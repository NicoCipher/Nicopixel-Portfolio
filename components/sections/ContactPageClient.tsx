'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { BookingEmbed } from '@/components/sections/BookingEmbed'
import { createClient } from '@/lib/supabase/client'
import { Reveal } from '@/components/ui/Reveal'
import { trackEvent } from '@/lib/analytics'

const FALLBACK_EMAIL = 'nicocipherr@gmail.com'
const EMPTY_FORM = {
  name: '', email: '', subject: '', message: '', website: '',
  project_type: '', budget_range: '', timeline: '', preferred_contact: '',
}

function ContactPageInner() {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'message' | 'call'>('message')
  const [form, setForm] = useState(EMPTY_FORM)
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const [contactEmail, setContactEmail] = useState(FALLBACK_EMAIL)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    if (searchParams.get('mode') === 'call') {
      const t = setTimeout(() => setMode('call'), 0)
      return () => clearTimeout(t)
    }
  }, [searchParams])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('site_settings').select('value').eq('key', 'email').maybeSingle()
      .then(({ data }) => { if (data?.value) setContactEmail(data.value) })
  }, [])

  const trackFormStart = () => {
    if (hasStarted) return
    setHasStarted(true)
    trackEvent('contact_form_started')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setStatus('error'); return }
      setStatus('success')
      trackEvent('contact_form_submitted')
      setForm(EMPTY_FORM)
    } catch {
      setError('Network error. Please try again.')
      setStatus('error')
    }
  }

  return (
    <section className="contact-section">
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <p style={{
          fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'var(--accent-text)', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ display: 'inline-block', width: 24, height: 1, background: 'var(--accent)' }} />
          Contact
        </p>

        <div className="contact-grid">
          {/* Left — info */}
          <Reveal>
            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(36px, 5vw, 64px)',
              fontWeight: 400, lineHeight: 1.05, marginBottom: 24,
            }}>
              Let&apos;s work<br /><em>together.</em>
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--fg-muted)', marginBottom: 32 }}>
              Have a project in mind? A brand to build, an event to design for, or print to produce? Let&apos;s talk.
            </p>
            <div className="contact-mode-toggle">
              <button
                className={`contact-mode-btn ${mode === 'message' ? 'contact-mode-btn-active' : ''}`}
                onClick={() => setMode('message')}
              >Send a Message</button>
              <button
                className={`contact-mode-btn ${mode === 'call' ? 'contact-mode-btn-active' : ''}`}
                onClick={() => setMode('call')}
              >Book a Call</button>
            </div>

            <div className="contact-info-card">
              {[
                { label: 'Email', value: contactEmail, href: `mailto:${contactEmail}` },
                { label: 'Location', value: 'Lagos, Nigeria' },
                { label: 'Response', value: 'Within 24 hours' },
              ].map((item, i) => (
                <div key={item.label} className="contact-info-row">
                  <span className="contact-info-num">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <span className="contact-info-label">{item.label}</span>
                    {item.href
                      ? <a className="contact-info-value" href={item.href}>{item.value}</a>
                      : <span className="contact-info-value">{item.value}</span>}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Right — form or booking */}
          <Reveal delay={130}>
            {mode === 'call' ? (
              <div className="contact-booking-wrap contact-card">
                <BookingEmbed />
              </div>
            ) : status === 'success' ? (
              <div className="contact-card" style={{ textAlign: 'center', padding: '56px 40px' }} role="status" aria-live="polite">
                <p style={{
                  fontFamily: 'var(--font-heading)', fontSize: 28,
                  fontStyle: 'italic', marginBottom: 12, color: 'var(--accent-text)',
                }}>Message sent.</p>
                <p style={{ fontSize: 14, color: 'var(--fg-muted)' }}>
                  I&apos;ll get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-card" style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
                {/* Honeypot — hidden from real users, bots tend to fill every field */}
                <input
                  type="text"
                  name="website"
                  value={form.website}
                  onChange={e => setForm({ ...form, website: e.target.value })}
                  tabIndex={-1}
                  autoComplete="off"
                  style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
                  aria-hidden="true"
                />
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="contact-name">Name</label>
                    <input id="contact-name" className="form-input" placeholder="Your name" value={form.name} maxLength={100}
                      autoComplete="name"
                    onFocus={trackFormStart}
                    onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="contact-email">Email</label>
                    <input id="contact-email" className="form-input" type="email" placeholder="your@email.com" value={form.email} maxLength={150}
                      autoComplete="email"
                      onChange={e => setForm({ ...form, email: e.target.value })} required />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="project-type">What do you need?</label>
                    <select id="project-type" className="form-input" value={form.project_type} required
                      onFocus={trackFormStart}
                      onChange={e => setForm({ ...form, project_type: e.target.value })}>
                      <option value="">Choose a project type</option>
                      <option>Brand identity</option>
                      <option>Event design</option>
                      <option>Print or packaging</option>
                      <option>Website or digital</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="budget-range">Approximate budget</label>
                    <select id="budget-range" className="form-input" value={form.budget_range} required
                      onChange={e => { setForm({ ...form, budget_range: e.target.value }); if (e.target.value) trackEvent('budget_selected', '/contact') }}>
                      <option value="">Choose a range</option>
                      <option>Under ₦100,000</option>
                      <option>₦100,000–₦250,000</option>
                      <option>₦250,000–₦500,000</option>
                      <option>₦500,000+</option>
                      <option>Not sure yet</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="project-timeline">When do you need it?</label>
                    <select id="project-timeline" className="form-input" value={form.timeline} required
                      onChange={e => setForm({ ...form, timeline: e.target.value })}>
                      <option value="">Choose a timeline</option>
                      <option>Within 2 weeks</option>
                      <option>Within 1 month</option>
                      <option>1–3 months</option>
                      <option>Flexible</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="preferred-contact">Preferred reply</label>
                    <select id="preferred-contact" className="form-input" value={form.preferred_contact} required
                      onChange={e => { setForm({ ...form, preferred_contact: e.target.value }); if (e.target.value) trackEvent('contact_method_selected', '/contact') }}>
                      <option value="">Choose a contact method</option>
                      <option>Email</option>
                      <option>WhatsApp</option>
                      <option>Phone call</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="contact-subject">Subject</label>
                  <input id="contact-subject" className="form-input" placeholder="Brand identity project" value={form.subject} maxLength={150}
                    onChange={e => setForm({ ...form, subject: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="contact-message">Message</label>
                  <textarea id="contact-message" className="form-input form-textarea"
                    rows={6} placeholder="Tell me about your project..." maxLength={5000}
                    value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
                </div>

                {error && <p role="alert" style={{ fontSize: 13, color: 'var(--accent-text)' }}>{error}</p>}

                <button type="submit" disabled={status === 'sending'} className="form-submit">
                  {status === 'sending' ? 'Sending...' : 'Send Message →'}
                </button>
              </form>
            )}
          </Reveal>
        </div>
      </div>

      <style>{`
        .contact-mode-toggle {
          display: flex; gap: 0;
          border: 1px solid var(--border);
          width: fit-content;
          margin-bottom: 32px;
        }
        .contact-mode-btn {
          padding: 14px 28px;
          background: transparent; border: none;
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--fg-muted); font-family: var(--font-body);
          cursor: pointer; transition: background 0.2s, color 0.2s;
          border-right: 1px solid var(--border);
          min-height: 48px;
        }
        .contact-mode-btn:last-child { border-right: none; }
        .contact-mode-btn-active { background: var(--fg); color: var(--bg); }
        .contact-mode-btn:not(.contact-mode-btn-active):hover { background: var(--bg-secondary); color: var(--fg); }

        .contact-info-card { border: 1px solid var(--border); }
        .contact-info-row { display: flex; align-items: center; gap: 20px; padding: 20px 24px; border-bottom: 1px solid var(--border); transition: background 0.2s; }
        .contact-info-row:last-child { border-bottom: none; }
        .contact-info-row:hover { background: var(--bg-secondary); }
        .contact-info-num { font-family: var(--font-heading); font-size: 13px; color: var(--accent-text); letter-spacing: 0.1em; flex-shrink: 0; }
        .contact-info-label { display: block; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--fg-subtle); margin-bottom: 4px; }
        .contact-info-value { font-size: 15px; color: var(--fg); font-weight: 500; }
        a.contact-info-value:hover { color: var(--accent-text); }

        .contact-card { border: 1px solid var(--border); background: var(--bg-secondary); padding: 40px; }
        .contact-booking-wrap { min-height: 560px; }
        .contact-section {
          min-height: calc(100vh - 64px);
          padding: 80px 48px;
          position: relative;
          overflow: hidden;
        }
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          margin-top: 60px;
          align-items: start;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
        }
        .form-label {
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--fg-subtle);
          margin-bottom: 8px;
        }
        .form-input {
          width: 100%;
          padding: 13px 16px;
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--fg);
          font-size: 15px;
          font-family: var(--font-body);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          -webkit-appearance: none;
        }
        .form-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(196, 30, 58, 0.1); }
        .form-input::placeholder { color: var(--fg-subtle); }
        .form-textarea { resize: none; }
        .form-submit {
          align-self: flex-start;
          padding: 15px 40px;
          background: var(--accent);
          color: white;
          border: none;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-family: var(--font-body);
          transition: background 0.2s, transform 0.2s, box-shadow 0.3s;
        }
        .form-submit:hover { background: #a01830; transform: translateY(-2px); box-shadow: 0 8px 24px -6px rgba(196, 30, 58, 0.45); }
        .form-submit:disabled { background: var(--fg-subtle); transform: none; box-shadow: none; }

        @media (max-width: 767px) {
          .contact-section { padding: 60px 24px; }
          .contact-card { padding: 28px; }
          .contact-grid {
            grid-template-columns: 1fr;
            gap: 52px;
            margin-top: 40px;
          }
          .form-row {
            grid-template-columns: 1fr;
            gap: 28px;
          }
          .form-submit { width: 100%; text-align: center; }
        }
      `}</style>
    </section>
  )
}

export function ContactPageClient() {
  return (
    <Suspense>
      <ContactPageInner />
    </Suspense>
  )
}
