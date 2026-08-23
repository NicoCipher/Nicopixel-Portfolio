import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth'
import { getClientIp, hasOversizedBody } from '@/lib/request'

const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

export async function POST(req: NextRequest) {
  if (hasOversizedBody(req.headers, 8_000)) {
    return NextResponse.json({ error: 'Request is too large.' }, { status: 413 })
  }

  const ip = getClientIp(req.headers)

  let email: string, password: string
  try {
    const body = await req.json()
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    password = typeof body.password === 'string' ? body.password : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (!email || !password || email.length > 254 || password.length > 1_000) {
    return NextResponse.json({ error: 'Email and password required.' }, { status: 400 })
  }

  try {
    const supabase = await createAdminClient()

    // Check recent failed attempts
    const since = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('login_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('email', email)
      .eq('ip', ip)
      .eq('success', false)
      .gte('attempted_at', since)

    if ((count ?? 0) >= MAX_ATTEMPTS) {
      const { error: logErr } = await supabase.from('activity_log').insert({
        action: 'LOGIN_BLOCKED',
        detail: `Account locked — too many failed attempts from IP ${ip}`,
        ip,
      })
      if (logErr) console.error('activity_log insert failed:', logErr.message)
      return NextResponse.json({
        error: `Too many failed attempts. Try again in ${LOCKOUT_MINUTES} minutes.`
      }, { status: 429 })
    }

    // Attempt login with user's Supabase client
    const userSupabase = await createClient()
    const { data, error } = await userSupabase.auth.signInWithPassword({ email, password })

    const authorized = !error && isAdmin(data.user)

    // Log only a successful, authorised admin session as successful.
    const { error: attemptLogErr } = await supabase.from('login_attempts').insert({
      email,
      ip,
      success: authorized,
    })
    if (attemptLogErr) console.error('login_attempts insert failed:', attemptLogErr.message)

    if (error) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    if (!authorized) {
      await userSupabase.auth.signOut()
      await supabase.from('activity_log').insert({
        user_id: data.user?.id,
        action: 'LOGIN_DENIED',
        detail: 'Signed-in user does not have the admin role.',
        ip,
      })
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    // Log successful login
    const { error: successLogErr } = await supabase.from('activity_log').insert({
      user_id: data.user.id,
      action: 'LOGIN_SUCCESS',
      detail: `Signed in from IP ${ip}`,
      ip,
    })
    if (successLogErr) console.error('activity_log insert failed:', successLogErr.message)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Login route error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
