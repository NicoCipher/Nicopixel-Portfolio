import { createPublicClient } from '@/lib/supabase/static'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { FaqAccordion } from '@/components/sections/FaqAccordion'
import { safeJsonLd } from '@/lib/safeJsonLd'

export const metadata: Metadata = {
  title: 'Services',
  description: 'Brand identity, events design, and print collateral. See exactly what Nicopixel offers, what is included, and how the process works.',
  alternates: { canonical: 'https://nicopixel.vercel.app/services' },
}

type ServiceRow = {
  id: string; num: string; title: string; description: string | null;
  deliverables: string[]; timeline: string | null; category: string
}

export default async function ServicesPage() {
  const supabase = createPublicClient()

  const [
    { data: services },
    { data: steps },
    { data: faqs },
  ] = await Promise.all([
    supabase.from('services').select('*').eq('active', true).order('sort_order'),
    supabase.from('process_steps').select('*').order('sort_order'),
    supabase.from('faqs').select('*').eq('active', true).order('sort_order'),
  ])

  // One representative project per category, to back up each service with real proof
  const categories = [...new Set((services || []).map((s: ServiceRow) => s.category).filter(Boolean))]
  const projectsByCategory: Record<string, { slug: string; title: string; cover_image: string | null } | null> = {}
  if (categories.length > 0) {
    const { data: matchingProjects } = await supabase
      .from('projects')
      .select('slug, title, cover_image, category')
      .eq('published', true)
      .in('category', categories)
      .order('sort_order')
    categories.forEach(cat => {
      projectsByCategory[cat] = (matchingProjects || []).find(p => p.category === cat) || null
    })
  }

  const jsonLd = (services && services.length > 0) ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: services.map((svc: ServiceRow, i: number) => ({
      '@type': 'Service',
      position: i + 1,
      name: svc.title,
      description: svc.description,
      provider: { '@type': 'ProfessionalService', name: 'Nicopixel' },
      areaServed: ['Lagos', 'Nigeria'],
    })),
  } : null

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      )}
      {/* ── HEADER ── */}
      <section className="svc-header px-page scroll-reveal">
        <svg className="reg-mark reg-mark-tr" viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="7" /><line x1="16" y1="0" x2="16" y2="32" /><line x1="0" y1="16" x2="32" y2="16" />
        </svg>
        <p className="svc-eyebrow">
          <span style={{ display: 'inline-block', width: 24, height: 1, background: 'var(--accent)' }} />
          Services
        </p>
        <h1 className="svc-title">
          What I create<br /><em>for you.</em>
        </h1>
        <p className="svc-subtitle">
          Every service is built around one goal — making your brand impossible to ignore. Here is exactly what you get, how long it takes, and the work it&apos;s already produced.
        </p>
      </section>

      {/* ── SERVICE CARDS ── */}
      <section className="svc-list">
        {(services || []).map((svc: ServiceRow, i: number) => {
          const proof = projectsByCategory[svc.category]
          return (
            <div key={svc.id} id={`service-${svc.id}`} className={`svc-card scroll-reveal ${i % 2 === 1 ? 'svc-card-alt' : ''}`}>
              <div className="svc-card-inner">
                {/* Left */}
                <div className="svc-card-left">
                  <span className="svc-card-num">{svc.num}</span>
                  <h2 className="svc-card-title">{svc.title}</h2>
                  <p className="svc-card-desc">{svc.description}</p>
                  {svc.timeline && (
                    <div className="svc-meta-item">
                      <span className="svc-meta-label">Timeline</span>
                      <span className="svc-meta-value">{svc.timeline}</span>
                    </div>
                  )}

                  {proof && (
                    <Link href={`/work/${proof.slug}`} className="svc-proof">
                      <div className="svc-proof-img">
                        {proof.cover_image
                          ? <Image src={proof.cover_image} alt={`${proof.title} — example of ${svc.title} by Nicopixel`} fill style={{ objectFit: 'cover' }} sizes="120px" />
                          : <div className="svc-proof-placeholder" />
                        }
                      </div>
                      <div>
                        <span className="svc-proof-label">See it in action</span>
                        <span className="svc-proof-title">{proof.title} →</span>
                      </div>
                    </Link>
                  )}
                </div>

                {/* Right — deliverables */}
                <div className="svc-card-right">
                  <p className="svc-deliverables-label">What&apos;s included</p>
                  <ul className="svc-deliverables">
                    {(svc.deliverables || []).map((d: string) => (
                      <li key={d} className="svc-deliverable">
                        <span className="svc-tick">✓</span>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* ── PROCESS ── */}
      {steps && steps.length > 0 && (
        <section className="svc-process">
          <div className="svc-process-inner">
            <div className="svc-process-header scroll-reveal">
              <p className="svc-eyebrow">
                <span style={{ display: 'inline-block', width: 24, height: 1, background: 'var(--accent)' }} />
                How it works
              </p>
              <h2 className="svc-section-title">
                The process,<br /><em>step by step.</em>
              </h2>
            </div>
            <div className="svc-steps">
              {(steps as { id: string; num: string; title: string; description: string | null }[]).map((step, i) => (
                <div key={step.id} className="svc-step scroll-reveal" style={{ animationDelay: `${i * 80}ms` }}>
                  <span className="svc-step-num">{step.num}</span>
                  <h3 className="svc-step-title">{step.title}</h3>
                  <p className="svc-step-desc">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      {faqs && faqs.length > 0 && (
        <section className="svc-faq">
          <svg className="reg-mark reg-mark-bl" viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="16" cy="16" r="7" /><line x1="16" y1="0" x2="16" y2="32" /><line x1="0" y1="16" x2="32" y2="16" />
          </svg>
          <div className="svc-faq-inner">
            <div className="svc-faq-header scroll-reveal">
              <p className="svc-eyebrow">
                <span style={{ display: 'inline-block', width: 24, height: 1, background: 'var(--accent)' }} />
                FAQ
              </p>
              <h2 className="svc-section-title">
                Questions<br /><em>answered.</em>
              </h2>
            </div>
            <div className="svc-faq-list">
              <FaqAccordion faqs={faqs} />
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="svc-cta">
        <div className="svc-cta-inner scroll-reveal">
          <h2 className="svc-cta-title">Ready to build something great?</h2>
          <p className="svc-cta-sub">
            Tell me about your brand and what you need — I&apos;ll get back to you within 24 hours.
          </p>
          <Link href="/contact" className="btn-accent-svc">Start a Project →</Link>
        </div>
      </section>

      <style>{`
        /* ── HEADER ── */
        .svc-header {
          padding-top: 80px;
          padding-bottom: 72px;
          border-bottom: 1px solid var(--border);
          position: relative;
        }
        .svc-eyebrow {
          font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--accent-text); margin-bottom: 20px;
          display: flex; align-items: center; gap: 12px;
        }
        .svc-title {
          font-family: var(--font-heading);
          font-size: clamp(44px, 7vw, 96px);
          font-weight: 400; line-height: 1.0;
          letter-spacing: -0.02em; margin-bottom: 24px;
        }
        .svc-title em { color: var(--accent-text); font-style: italic; }
        .svc-subtitle {
          font-size: 16px; line-height: 1.8;
          color: var(--fg-muted); max-width: 560px;
        }

        /* ── SERVICE CARDS ── */
        .svc-list { display: flex; flex-direction: column; }
        .svc-card {
          border-bottom: 1px solid var(--border);
          padding: 72px 48px;
          transition: background 0.3s;
          scroll-margin-top: 84px;
        }
        .svc-card:hover { background: var(--bg-secondary); }
        .svc-card-alt { background: var(--bg-secondary); }
        .svc-card-alt:hover { background: var(--bg); }
        .svc-card-inner {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 80px; align-items: start;
          max-width: var(--content-max); margin: 0 auto;
        }
        .svc-card-num {
          display: block;
          font-family: var(--font-heading); font-size: 12px;
          color: var(--accent-text); letter-spacing: 0.2em;
          margin-bottom: 16px;
        }
        .svc-card-title {
          font-family: var(--font-heading);
          font-size: clamp(28px, 3.5vw, 48px);
          font-weight: 400; margin-bottom: 20px; line-height: 1.1;
        }
        .svc-card-desc {
          font-size: 15px; line-height: 1.8;
          color: var(--fg-muted); margin-bottom: 32px;
        }
        .svc-card-meta { display: flex; gap: 40px; margin-bottom: 24px; }
        .svc-meta-item { display: flex; flex-direction: column; gap: 4px; margin-bottom: 24px; }
        .svc-meta-label {
          font-size: 11px; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--fg-subtle);
        }
        .svc-meta-value {
          font-size: 15px; font-weight: 600; color: var(--fg);
          font-family: var(--font-heading);
        }

        /* Proof — links the service to real, matching work */
        .svc-proof {
          display: flex; align-items: center; gap: 16px;
          padding: 14px; border: 1px solid var(--border);
          text-decoration: none; color: inherit;
          transition: border-color 0.25s, background 0.25s;
          margin-bottom: 8px;
        }
        .svc-proof:hover { border-color: var(--accent); background: var(--bg); }
        .svc-proof-img { position: relative; width: 64px; height: 64px; flex-shrink: 0; background: var(--bg-secondary); overflow: hidden; }
        .svc-proof-placeholder { position: absolute; inset: 0; background: var(--bg-secondary); }
        .svc-proof-label { display: block; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--fg-subtle); margin-bottom: 4px; }
        .svc-proof-title { display: block; font-size: 14px; font-weight: 600; color: var(--fg); transition: color 0.25s; }
        .svc-proof:hover .svc-proof-title { color: var(--accent-text); }

        /* Registration marks — print-craft signature, consistent with the rest of the site */
        .reg-mark { position: absolute; width: 26px; height: 26px; stroke: var(--accent); stroke-width: 1; fill: none; opacity: 0.4; }
        .svc-header .reg-mark-tr { top: 28px; right: 28px; }
        .svc-faq .reg-mark-bl { bottom: 28px; left: 28px; }


        /* Deliverables */
        .svc-card-right { padding-top: 8px; }
        .svc-deliverables-label {
          font-size: 12px; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--fg-subtle);
          margin-bottom: 20px; display: block;
        }
        .svc-deliverables { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0; }
        .svc-deliverable {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 0; border-bottom: 1px solid var(--border);
          font-size: 14px; color: var(--fg-muted);
        }
        .svc-deliverable:last-child { border-bottom: none; }
        .svc-tick {
          width: 20px; height: 20px; border-radius: '50%';
          background: var(--accent); color: white;
          font-size: 10px; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0; border-radius: 50%;
        }

        /* ── PROCESS ── */
        .svc-process {
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 80px 48px;
        }
        .svc-process-inner { max-width: var(--content-max); margin: 0 auto; }
        .svc-process-header { margin-bottom: 64px; }
        .svc-section-title {
          font-family: var(--font-heading);
          font-size: clamp(32px, 4vw, 60px);
          font-weight: 400; margin-top: 12px; line-height: 1.05;
        }
        .svc-section-title em { font-style: italic; color: var(--accent-text); }
        .svc-steps {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 0;
        }
        .svc-step {
          padding: 36px 36px 36px 0;
          border-right: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }
        .svc-step:nth-child(3n) { border-right: none; padding-right: 0; }
        .svc-step:nth-child(3n+1) { padding-left: 0; }
        .svc-step:not(:nth-child(3n+1)) { padding-left: 36px; }
        .svc-step:nth-child(4), .svc-step:nth-child(5), .svc-step:nth-child(6) { border-bottom: none; }
        .svc-step-num {
          display: block; font-family: var(--font-heading);
          font-size: 44px; font-style: italic; color: var(--border);
          line-height: 1; margin-bottom: 16px;
          transition: color 0.3s;
        }
        .svc-step:hover .svc-step-num { color: var(--accent-text); }
        .svc-step-title {
          font-family: var(--font-heading); font-size: 19px;
          font-weight: 500; color: var(--fg); margin-bottom: 10px;
        }
        .svc-step-desc { font-size: 15px; line-height: 1.8; color: var(--fg-muted); }

        /* ── FAQ ── */
        .svc-faq {
          border-bottom: 1px solid var(--border);
          padding: 80px 48px;
          position: relative;
        }
        .svc-faq-inner {
          display: grid; grid-template-columns: 320px 1fr;
          gap: 80px; align-items: start;
          max-width: var(--content-max); margin: 0 auto;
        }
        .svc-faq-header { position: sticky; top: 80px; }
        .svc-faq-list {}

        /* ── CTA ── */
        .svc-cta { padding: 88px 48px; }
        .svc-cta-inner { max-width: 700px; margin: 0 auto; text-align: center; }
        .svc-cta-title {
          font-family: var(--font-heading);
          font-size: clamp(28px, 4vw, 56px);
          font-weight: 400; margin-bottom: 20px; line-height: 1.1;
        }
        .svc-cta-sub {
          font-size: 15px; line-height: 1.8;
          color: var(--fg-muted); margin-bottom: 40px;
        }
        .btn-accent-svc {
          display: inline-block; padding: 14px 36px;
          background: var(--accent); color: white;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.14em; text-transform: uppercase;
          text-decoration: none; transition: background 0.2s, transform 0.2s, box-shadow 0.3s;
        }
        .btn-accent-svc:hover { background: #a01830; transform: translateY(-2px); box-shadow: 0 8px 24px -6px rgba(196, 30, 58, 0.45); }

        /* ── RESPONSIVE ── */
        @media(max-width: 900px) {
          .svc-card-inner { grid-template-columns: 1fr; gap: 40px; }
          .svc-steps { grid-template-columns: 1fr 1fr; }
          .svc-step:nth-child(2n) { border-right: none; }
          .svc-step:nth-child(5), .svc-step:nth-child(6) { border-bottom: none; }
          .svc-step:nth-child(4) { border-bottom: 1px solid var(--border); }
          .svc-faq-inner { grid-template-columns: 1fr; gap: 40px; }
          .svc-faq-header { position: static; }
        }
        @media(max-width: 767px) {
          .svc-header { padding: 60px 20px 52px; }
          .svc-card { padding: 52px 20px; }
          .svc-card-meta { flex-direction: column; gap: 20px; }
          .svc-process { padding: 60px 20px; }
          .svc-steps { grid-template-columns: 1fr; }
          .svc-step { border-right: none !important; padding-left: 0 !important; padding-right: 0 !important; border-bottom: 1px solid var(--border) !important; }
          .svc-step:last-child { border-bottom: none !important; }
          .svc-faq { padding: 60px 20px; }
          .svc-cta { padding: 72px 20px; }
          .reg-mark { width: 20px; height: 20px; }
          .svc-header .reg-mark-tr { top: 16px; right: 16px; }
          .svc-faq .reg-mark-bl { bottom: 16px; left: 16px; }
        }
      `}</style>
    </>
  )
}
