import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getClientIp, hasOversizedBody } from '@/lib/request'

const TRACKING_WINDOW_MS = 60 * 60 * 1_000
const TRACKING_LIMIT = 120

function getDeviceType(ua: string | null): string {
  if (!ua) return 'unknown'
  if (/mobile|android|iphone|ipad|tablet/i.test(ua)) return 'mobile'
  if (/tablet|ipad/i.test(ua)) return 'tablet'
  return 'desktop'
}

export async function POST(req: NextRequest) {
  try {
    if (hasOversizedBody(req.headers, 4_000)) {
      return NextResponse.json({ ok: false }, { status: 413 })
    }

    const { path, referrer, visitor_id } = await req.json()
    if (!path || typeof path !== 'string' || path.length > 500 || !path.startsWith('/') || path.startsWith('//')) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    let safePath: string
    try {
      const parsed = new URL(path, 'https://nicopixel.local')
      safePath = `${parsed.pathname}${parsed.search}`
    } catch {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const ua = req.headers.get('user-agent')
    const ip = getClientIp(req.headers)
    const supabase = await createAdminClient()

    // A database-backed cap works across Vercel function instances and keeps
    // this public endpoint from being used to inflate analytics indefinitely.
    const since = new Date(Date.now() - TRACKING_WINDOW_MS).toISOString()
    const { count } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('created_at', since)

    if ((count ?? 0) >= TRACKING_LIMIT) {
      return NextResponse.json({ ok: true })
    }

    let safeReferrer: string | null = null
    if (typeof referrer === 'string') {
      try { safeReferrer = new URL(referrer).origin.slice(0, 500) } catch { /* omit malformed referrers */ }
    }

    const { error } = await supabase.from('page_views').insert({
      path: safePath,
      referrer: safeReferrer,
      visitor_id: visitor_id ? String(visitor_id).slice(0, 100) : null,
      device_type: getDeviceType(ua),
      ip,
    })

    if (error) throw error

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
