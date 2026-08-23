import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { getClientIp, hasOversizedBody } from '@/lib/request'

const RATE_LIMIT = 3
const WINDOW_MS = 60 * 60 * 1000

const MAX_NAME_LEN = 100
const MAX_SUBJECT_LEN = 150
const MAX_MESSAGE_LEN = 5000
const MAX_QUALIFICATION_LEN = 80

const PROJECT_TYPES = ['Brand identity', 'Event design', 'Print or packaging', 'Website or digital', 'Other']
const BUDGET_RANGES = ['Under ₦100,000', '₦100,000–₦250,000', '₦250,000–₦500,000', '₦500,000+', 'Not sure yet']
const TIMELINES = ['Within 2 weeks', 'Within 1 month', '1–3 months', 'Flexible']
const CONTACT_METHODS = ['Email', 'WhatsApp', 'Phone call']

// Escape HTML special characters so message content can never break out
// of the email's HTML structure or inject markup/scripts.
function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function POST(req: NextRequest) {
  if (hasOversizedBody(req.headers, 12_000)) {
    return NextResponse.json({ error: 'Request is too large.' }, { status: 413 })
  }

  const ip = getClientIp(req.headers)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const website = typeof body.website === 'string' ? body.website : ''
  const projectType = typeof body.project_type === 'string' ? body.project_type.trim() : ''
  const budgetRange = typeof body.budget_range === 'string' ? body.budget_range.trim() : ''
  const timeline = typeof body.timeline === 'string' ? body.timeline.trim() : ''
  const preferredContact = typeof body.preferred_contact === 'string' ? body.preferred_contact.trim() : ''

  // Honeypot check — if filled, it's a bot. Pretend success so bots don't learn.
  if (website) {
    return NextResponse.json({ success: true })
  }

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Name, email and message are required.' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }

  if (name.length > MAX_NAME_LEN || subject.length > MAX_SUBJECT_LEN || message.length > MAX_MESSAGE_LEN) {
    return NextResponse.json({ error: 'One or more fields exceed the maximum length.' }, { status: 400 })
  }

  const qualificationValues = [projectType, budgetRange, timeline, preferredContact]
  if (
    qualificationValues.some(value => value.length > MAX_QUALIFICATION_LEN) ||
    !PROJECT_TYPES.includes(projectType) ||
    !BUDGET_RANGES.includes(budgetRange) ||
    !TIMELINES.includes(timeline) ||
    !CONTACT_METHODS.includes(preferredContact)
  ) {
    return NextResponse.json({ error: 'Please complete the project details.' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  const { data: emailSetting } = await supabase.from('site_settings').select('value').eq('key', 'email').maybeSingle()
  const destinationEmail = emailSetting?.value || process.env.CONTACT_EMAIL!

  // Database-backed rate limit — checks recent submissions from this IP.
  // An in-memory counter would not work reliably across serverless
  // function instances, so this queries persistent storage instead.
  const since = new Date(Date.now() - WINDOW_MS).toISOString()
  const { count: recentCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', since)

  if ((recentCount ?? 0) >= RATE_LIMIT) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  try {
    const { data: insertedMessage, error: insertError } = await supabase
      .from('messages')
      .insert({
        name,
        email,
        subject: subject || null,
        message,
        project_type: projectType,
        budget_range: budgetRange,
        timeline,
        preferred_contact: preferredContact,
        ip,
      })
      .select('id')
      .single()

    if (insertError) throw insertError

    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safeSubject = subject ? escapeHtml(subject) : ''
    const safeMessage = escapeHtml(message)
    const safeProjectType = escapeHtml(projectType)
    const safeBudgetRange = escapeHtml(budgetRange)
    const safeTimeline = escapeHtml(timeline)
    const safePreferredContact = escapeHtml(preferredContact)

    // Instantiate Resend at request time. This keeps local/build-time
    // validation independent of secrets while production still fails closed
    // into the dashboard message queue if email is ever misconfigured.
    const sendResult = process.env.RESEND_API_KEY && destinationEmail
      ? await new Resend(process.env.RESEND_API_KEY).emails.send({
          from: 'Nicopixel <onboarding@resend.dev>',
          to: [destinationEmail],
          replyTo: email,
          subject: subject ? `[Nicopixel] ${safeSubject}` : `[Nicopixel] New message from ${safeName}`,
          html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 0;">
          <div style="border-bottom:2px solid #C41E3A;padding-bottom:20px;margin-bottom:28px;">
            <h2 style="margin:0;font-size:22px;color:#0A0A0A;">New message via Nicopixel</h2>
          </div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
            <tr><td style="padding:8px 0;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#999;width:100px;">From</td><td style="padding:8px 0;font-size:14px;color:#0A0A0A;">${safeName}</td></tr>
            <tr><td style="padding:8px 0;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#999;">Email</td><td style="padding:8px 0;font-size:14px;"><a href="mailto:${safeEmail}" style="color:#C41E3A;">${safeEmail}</a></td></tr>
            ${subject ? `<tr><td style="padding:8px 0;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#999;">Subject</td><td style="padding:8px 0;font-size:14px;color:#0A0A0A;">${safeSubject}</td></tr>` : ''}
            <tr><td style="padding:8px 0;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#999;">Project</td><td style="padding:8px 0;font-size:14px;color:#0A0A0A;">${safeProjectType}</td></tr>
            <tr><td style="padding:8px 0;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#999;">Budget</td><td style="padding:8px 0;font-size:14px;color:#0A0A0A;">${safeBudgetRange}</td></tr>
            <tr><td style="padding:8px 0;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#999;">Timing</td><td style="padding:8px 0;font-size:14px;color:#0A0A0A;">${safeTimeline}</td></tr>
            <tr><td style="padding:8px 0;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#999;">Reply via</td><td style="padding:8px 0;font-size:14px;color:#0A0A0A;">${safePreferredContact}</td></tr>
          </table>
          <div style="background:#f9f9f9;border-left:3px solid #C41E3A;padding:20px 24px;margin-bottom:28px;">
            <p style="margin:0;font-size:15px;line-height:1.8;color:#333;white-space:pre-wrap;">${safeMessage}</p>
          </div>
          <p style="font-size:11px;color:#bbb;margin:0;">Sent via nicopixel.vercel.app contact form</p>
        </div>
      `,
        })
      : { error: { message: 'Email notification is not configured.' } }

    const sendError = sendResult.error

    if (sendError) {
      // The message is already safely saved in the database above - this
      // only means the EMAIL NOTIFICATION failed (commonly: the resend.dev
      // sandbox domain only delivers to the email that signed up for Resend).
      // Record this so it's visible in Admin → Messages instead of silently
      // vanishing into a server log nobody checks.
      console.error('Resend send failed:', sendError.message)
      if (insertedMessage?.id) {
        await supabase.from('messages').update({ email_sent: false }).eq('id', insertedMessage.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Contact form error:', err)
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 })
  }
}
