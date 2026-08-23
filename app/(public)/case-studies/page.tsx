import { createPublicClient } from '@/lib/supabase/static'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { Reveal } from '@/components/ui/Reveal'

export const metadata: Metadata = {
  title: 'Case Studies',
  description: 'In-depth breakdowns of brand identity, events, and print projects — the brief, the challenge, the approach, and the outcome.',
  alternates: { canonical: 'https://nicopixel.vercel.app/case-studies' },
}

export default async function CaseStudiesPage() {
  const supabase = createPublicClient()
  const { data: studies } = await supabase
    .from('projects')
    .select('id, title, slug, category, cover_image, client_name, industry, brief, results')
    .eq('published', true)
    .eq('is_case_study', true)
    .order('sort_order', { ascending: true })

  return (
    <>
      <Reveal as="section" className="cs-header px-page">
        <p className="cs-eyebrow">
          <span style={{ display: 'inline-block', width: 24, height: 1, background: 'var(--accent)' }} />
          Case Studies
        </p>
        <h1 className="cs-title">
          The thinking<br /><em>behind the work.</em>
        </h1>
        <p className="cs-subtitle">
          Every project starts with a problem. Here is how each one was approached, solved, and delivered — brief to outcome.
        </p>
      </Reveal>

      {!studies || studies.length === 0 ? (
        <div className="cs-empty">
          <p>Case studies coming soon.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}>
            <Link href="/work" className="cs-empty-link">See all work →</Link>
            <Link href="/contact" className="cs-empty-link">Start a project →</Link>
          </div>
        </div>
      ) : (
        <section className="cs-list px-page">
          {studies.map((study: {
            id: string; title: string; slug: string; category: string;
            cover_image: string | null; client_name: string | null;
            industry: string | null; brief: string | null; results: string | null
          }, i: number) => (
            <Reveal key={study.id} className="cs-card-wrap" delay={Math.min(i, 4) * 80}>
              <Link href={`/work/${study.slug}`} className="cs-card-link">
                <article className="cs-card">
                  <div className="cs-card-img-wrap">
                    {study.cover_image
                      ? <Image src={study.cover_image} alt={`${study.title} case study — ${study.category} design by Nicopixel`} fill className="cs-card-img" style={{ objectFit: 'cover' }} />
                      : <div className="cs-card-placeholder"><span>{study.category}</span></div>
                    }
                    <div className="cs-card-overlay" />
                    <span className="cs-card-num">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="cs-card-body">
                    {(study.client_name || study.industry) && (
                      <span className="cs-card-client">{study.client_name}{study.client_name && study.industry ? ' — ' : ''}{study.industry}</span>
                    )}
                    <h2 className="cs-card-title">{study.title}</h2>
                    <span className="cs-card-cat">{study.category}</span>
                    {study.brief && <p className="cs-card-brief">{study.brief}</p>}
                    {study.results && (
                      <div className="cs-card-results">
                        <span className="cs-card-results-label">Result</span>
                        <span className="cs-card-results-text">{study.results}</span>
                      </div>
                    )}
                    <span className="cs-card-cta">Read Case Study <span className="cs-arrow">→</span></span>
                  </div>
                </article>
              </Link>
            </Reveal>
          ))}
        </section>
      )}

      <section className="cs-cta">
        <Reveal as="div" className="cs-cta-inner">
          <h2 className="cs-cta-title">Want results like these?</h2>
          <Link href="/contact" className="cs-cta-btn">Start a Project →</Link>
        </Reveal>
      </section>

      <style>{`
        .cs-header { padding-top: 80px; padding-bottom: 64px; border-bottom: 1px solid var(--border); position: relative; }
        .cs-eyebrow { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent-text); margin-bottom: 20px; display: flex; align-items: center; gap: 12px; }
        .cs-title { font-family: var(--font-heading); font-size: clamp(40px, 6.5vw, 88px); font-weight: 400; line-height: 1.0; letter-spacing: -0.02em; margin-bottom: 24px; }
        .cs-title em { color: var(--accent-text); font-style: italic; }
        .cs-subtitle { font-size: 16px; line-height: 1.8; color: var(--fg-muted); max-width: 540px; }

        .cs-empty { padding: 100px 48px; text-align: center; }
        .cs-empty p { font-family: var(--font-heading); font-size: 22px; font-style: italic; color: var(--fg-subtle); margin-bottom: 20px; }
        .cs-empty-link { font-size: 12px; color: var(--accent-text); text-decoration: none; letter-spacing: 0.1em; text-transform: uppercase; }

        .cs-list { display: flex; flex-direction: column; }
        .cs-card-link { display: block; text-decoration: none; border-bottom: 1px solid var(--border); }
        .cs-card-wrap:last-child .cs-card-link { border-bottom: none; }
        .cs-card { display: grid; grid-template-columns: 1fr 1fr; min-height: 440px; transition: background 0.3s; }
        .cs-card-link:hover .cs-card { background: var(--bg-secondary); }
        .cs-card-wrap:nth-child(even) .cs-card { direction: rtl; }
        .cs-card-wrap:nth-child(even) .cs-card-img-wrap,
        .cs-card-wrap:nth-child(even) .cs-card-body { direction: ltr; }

        .cs-card-img-wrap { position: relative; overflow: hidden; background: var(--bg-secondary); }
        .cs-card-img { transition: transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94); }
        .cs-card-link:hover .cs-card-img { transform: scale(1.05); }
        .cs-card-placeholder { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
        .cs-card-placeholder span { font-family: var(--font-heading); font-size: 32px; font-style: italic; color: var(--fg-subtle); text-transform: capitalize; }
        .cs-card-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0); transition: background 0.3s; }
        .cs-card-link:hover .cs-card-overlay { background: rgba(0,0,0,0.1); }
        .cs-card-num {
          position: absolute; bottom: 20px; left: 20px; z-index: 2;
          font-family: var(--font-heading); font-size: 13px; color: white;
          letter-spacing: 0.14em; background: rgba(0,0,0,0.55); backdrop-filter: blur(6px);
          padding: 6px 14px; border: 1px solid rgba(255,255,255,0.15);
        }

        .cs-card-body { padding: 56px 56px; display: flex; flex-direction: column; gap: 10px; justify-content: center; }
        .cs-card-client { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent-text); font-weight: 600; }
        .cs-card-title { font-family: var(--font-heading); font-size: clamp(26px, 3.2vw, 38px); font-weight: 500; line-height: 1.15; color: var(--fg); margin: 2px 0 2px; }
        .cs-card-cat { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--fg-subtle); margin-bottom: 8px; }
        .cs-card-brief { font-size: 15px; line-height: 1.8; color: var(--fg-muted); margin-bottom: 4px; }
        .cs-card-results { display: flex; flex-direction: column; gap: 3px; padding: 14px 18px; background: var(--bg); border-left: 2px solid var(--accent); margin: 6px 0 8px; }
        .cs-card-results-label { font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent-text); }
        .cs-card-results-text { font-size: 14px; color: var(--fg); font-weight: 500; line-height: 1.5; }
        .cs-card-cta { font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--fg); display: inline-flex; align-items: center; gap: 6px; margin-top: 10px; }
        .cs-arrow { transition: transform 0.3s; display: inline-block; }
        .cs-card-link:hover .cs-arrow { transform: translateX(4px); }

        .cs-cta { padding: 88px 48px; text-align: center; position: relative; }
        .cs-cta-inner { display: flex; flex-direction: column; align-items: center; gap: 28px; }
        .cs-cta-title { font-family: var(--font-heading); font-size: clamp(28px, 4vw, 52px); font-weight: 400; }
        .cs-cta-btn { display: inline-block; padding: 14px 36px; background: var(--accent); color: white; font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; text-decoration: none; transition: background 0.2s, transform 0.2s, box-shadow 0.3s; }
        .cs-cta-btn:hover { background: #a01830; transform: translateY(-2px); box-shadow: 0 8px 24px -6px rgba(196, 30, 58, 0.45); }

        @media(max-width: 900px) {
          .cs-card { grid-template-columns: 1fr; min-height: auto; }
          .cs-card-link:nth-child(even) .cs-card { direction: ltr; }
          .cs-card-img-wrap { aspect-ratio: 4/3; }
          .cs-card-body { padding: 40px 32px; }
        }
        @media(max-width: 767px) {
          .cs-header { padding: 56px 20px 44px; }
          .cs-card-body { padding: 32px 20px; }
          .cs-cta { padding: 64px 20px; }
        }
      `}</style>
    </>
  )
}
