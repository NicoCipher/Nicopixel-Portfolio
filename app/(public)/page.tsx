import { createPublicClient } from '@/lib/supabase/static'
import Link from 'next/link'
import type { Project } from '@/types'
import { AnimatedStat } from '@/components/ui/AnimatedStat'
import { FeaturedProjectsAccordion } from '@/components/sections/FeaturedProjectsAccordion'
import { HeroVisual } from '@/components/sections/HeroVisual'

export default async function HomePage() {
  const supabase = createPublicClient()

  const [
    { data: projects },
    { data: settingsRows },
    { data: services },
    { data: whyItems },
    { data: testimonials },
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('published', true).eq('featured', true).order('sort_order').limit(10),
    supabase.from('site_settings').select('key, value'),
    supabase.from('services').select('*').eq('active', true).order('sort_order'),
    supabase.from('why_items').select('*').order('sort_order'),
    supabase.from('testimonials').select('*').eq('active', true).order('sort_order'),
  ])

  const s: Record<string, string> = {}
  settingsRows?.forEach((r: { key: string; value: string | null }) => { s[r.key] = r.value ?? '' })

  const stats = [
    { num: s.hero_stat_1_num || '4+', label: s.hero_stat_1_label || 'Years' },
    { num: s.hero_stat_2_num || '80+', label: s.hero_stat_2_label || 'Projects' },
    { num: s.hero_stat_3_num || '40+', label: s.hero_stat_3_label || 'Clients' },
  ]

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero-section">
        <HeroVisual logoUrl={s.logo_url} />

        {/* Registration marks — a print designer's actual craft, used here as the page-load signature */}
        <svg className="reg-mark reg-mark-tl" viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="7" />
          <line x1="16" y1="0" x2="16" y2="32" />
          <line x1="0" y1="16" x2="32" y2="16" />
        </svg>
        <svg className="reg-mark reg-mark-tr" viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="7" />
          <line x1="16" y1="0" x2="16" y2="32" />
          <line x1="0" y1="16" x2="32" y2="16" />
        </svg>
        <svg className="reg-mark reg-mark-br" viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="7" />
          <line x1="16" y1="0" x2="16" y2="32" />
          <line x1="0" y1="16" x2="32" y2="16" />
        </svg>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 'var(--content-max)', margin: '0 auto', width: '100%' }}>
          <div style={{ maxWidth: 760 }}>
          <p className="hero-eyebrow hero-anim hero-anim-1">
            <span style={{ display: 'inline-block', width: 24, height: 1, background: 'var(--accent)' }} />
            {s.hero_eyebrow || 'Brand · Events · Print · Lagos, Nigeria'}
          </p>
          <h1 className="hero-title">
            <span className="hero-line-mask">
              <span className="hero-line-inner hero-anim-2">{s.hero_title || 'Nicopixel'}</span>
            </span>
            <br />
            <span className="hero-line-mask">
              <em className="hero-line-inner hero-anim-3">{s.hero_subtitle || 'Graphic Designer'}</em>
            </span>
          </h1>
          <p className="hero-sub hero-anim hero-anim-4">{s.hero_sub || 'Graphic designer specialising in brand identity, events design, and print collateral.'}</p>
          <div className="hero-cta hero-anim hero-anim-5">
            <Link href="/contact" className="btn-accent">Start a Project →</Link>
            <Link href="/work" className="btn-ghost">See My Work</Link>
          </div>
          <div className="hero-stats hero-anim hero-anim-6">
            {stats.map((stat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                {i > 0 && <div className="h-stat-divider" />}
                <div className="h-stat">
                  <AnimatedStat value={stat.num} label={stat.label} startDelay={2100} />
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      {services && services.length > 0 && (
        <section className="services-section">
          <div className="services-label scroll-reveal">What I Do</div>
          <div className="services-grid">
            {services.map((svc: { id: string; num: string; title: string; description: string | null; deliverables: string[] }, i: number) => (
              <Link key={svc.id} href={`/services#service-${svc.id}`} className="service-card scroll-reveal" style={{ animationDelay: `${i * 90}ms` }}>
                <span className="service-num">{svc.num}</span>
                <h3 className="service-title">{svc.title}</h3>
                <p className="service-desc">{svc.description}</p>
                {svc.deliverables?.length > 0 && (
                  <ul className="service-list">
                    {svc.deliverables.map((d: string) => (
                      <li key={d}><span style={{ color: 'var(--accent-text)', marginRight: 8 }}>—</span>{d}</li>
                    ))}
                  </ul>
                )}
                <span className="service-cta">Learn more <span className="service-arrow">→</span></span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── FEATURED WORK ── */}
      {projects && projects.length > 0 && (
        <section className="featured-section">
          <div className="featured-header scroll-reveal">
            <div>
              <p className="section-eyebrow">Selected Work</p>
              <h2 className="section-title">Recent Projects</h2>
            </div>
            <Link href="/work" className="link-muted">View All →</Link>
          </div>
          <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
            <FeaturedProjectsAccordion projects={(projects as Project[]).slice(0, 5)} />
          </div>
        </section>
      )}

      {/* ── WHY NICOPIXEL ── */}
      {whyItems && whyItems.length > 0 && (
        <section className="why-section">
          <div className="why-header scroll-reveal">
            <p className="section-eyebrow">Why Nicopixel</p>
            <h2 className="why-headline">
              {s.why_title || 'Design that works'}<br />
              <em>{s.why_subtitle || 'as hard as you do.'}</em>
            </h2>
          </div>
          <div className="why-grid">
            {whyItems.map((w: { id: string; title: string; description: string | null }, i: number) => (
              <div key={w.id} className="why-card scroll-reveal" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="why-card-num">{String(i + 1).padStart(2, '0')}</div>
                <div className="why-card-body">
                  <h4 className="why-card-title">{w.title}</h4>
                  <p className="why-card-desc">{w.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ── */}
      {testimonials && testimonials.length > 0 && (
        <section className="testimonials-section">
          <div className="testimonials-inner">
            <div className="testimonials-label scroll-reveal">
              <p className="section-eyebrow">Client Results</p>
              <h2 className="testimonials-headline">Words from<br /><em>the work.</em></h2>
            </div>
            <div className="testimonials-list">
              {testimonials.map((t: { id: string; quote: string; name: string; role: string | null }, i: number) => (
                <div key={t.id} className="testimonial-item scroll-reveal" style={{ animationDelay: `${i * 110}ms` }}>
                  <div className="testimonial-quote-wrap">
                    <span className="tq-mark">&ldquo;</span>
                    <p className="tq-text">{t.quote}</p>
                  </div>
                  <div className="tq-author">
                    <div className="tq-avatar">{t.name.charAt(0)}</div>
                    <div>
                      <span className="tq-name">{t.name}</span>
                      {t.role && <span className="tq-role">{t.role}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── MARQUEE ──
          Two explicit, identical groups instead of one flat repeated
          array. The old version relied on Array(12).fill([...]).flat()
          (36 individual spans of varying text width — "Brand Identity"
          vs "Print Collateral" render at different widths) happening to
          split into two pixel-identical halves at exactly the 50% mark.
          Any subpixel rounding across that many items breaks that
          assumption, which shows up as a visible cut once per loop. Two
          structurally-identical sibling groups make the seam exact by
          construction: -50% of (groupWidth + groupWidth) is always
          precisely groupWidth, with no reliance on rounding at all. */}
      <div style={{ borderTop: '1px solid var(--border)', overflow: 'hidden', padding: '14px 0' }}>
        <div style={{ display: 'flex', width: 'max-content', animation: 'marquee 18s linear infinite' }}>
          {[0, 1].map(groupIndex => (
            <div key={groupIndex} style={{ display: 'flex', flexShrink: 0 }} aria-hidden={groupIndex === 1}>
              {Array(6).fill(['Brand Identity', 'Events Design', 'Print Collateral']).flat().map((item: string, i: number) => (
                <span key={i} style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontStyle: 'italic', color: 'var(--fg-subtle)', padding: '0 28px', display: 'inline-flex', alignItems: 'center', gap: 28, whiteSpace: 'nowrap' }}>
                  {item}<span style={{ color: 'var(--accent-text)', fontSize: 5 }}>●</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM CTA ── */}
      <section className="bottom-cta-section">
        <div className="bottom-cta-inner scroll-reveal">
          <p className="bottom-cta-eyebrow">
            <span style={{ display: 'inline-block', width: 24, height: 1, background: 'var(--accent)' }} />
            Ready to start?
          </p>
          <h2 className="bottom-cta-title">Your brand deserves to<br /><em>look the part.</em></h2>
          <div className="bottom-cta-btns">
            <Link href="/contact" className="btn-accent">Start a Project →</Link>
            <Link href="/contact?mode=call" className="btn-ghost">Book a Free Call</Link>
          </div>
        </div>
      </section>

      <style>{`
        .bottom-cta-section { padding: 88px 48px; border-top: 1px solid var(--border); text-align: center; }
        .bottom-cta-inner { max-width: 640px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 24px; }
        .bottom-cta-eyebrow { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent-text); display: flex; align-items: center; gap: 12px; }
        .bottom-cta-title { font-family: var(--font-heading); font-size: clamp(32px, 5vw, 64px); font-weight: 400; line-height: 1.05; }
        .bottom-cta-title em { font-style: italic; color: var(--accent-text); }
        .bottom-cta-btns { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .hero-section { min-height: calc(100svh - 64px); display: flex; flex-direction: column; justify-content: flex-end; padding: 80px 48px 64px; border-bottom: 1px solid var(--border); position: relative; overflow: hidden; }
        /* Registration marks — print-craft signature, align the page like a printer aligning plates */
        .reg-mark {
          position: absolute; width: 28px; height: 28px;
          stroke: var(--accent); stroke-width: 1; fill: none;
          opacity: 0; transform: scale(0.6);
          animation: reg-mark-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .reg-mark-tl { top: 28px; left: 28px; animation-delay: 0.05s; }
        .reg-mark-tr { top: 28px; right: 28px; animation-delay: 0.15s; }
        .reg-mark-br { bottom: 28px; right: 28px; animation-delay: 0.25s; }
        @keyframes reg-mark-in { to { opacity: 0.45; transform: scale(1); } }

        /* Staged entrance for hero text elements */
        .hero-anim { opacity: 0; transform: translateY(16px); animation: hero-fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .hero-anim-1 { animation-delay: 0.45s; }
        .hero-anim-4 { animation-delay: 1.05s; }
        .hero-anim-5 { animation-delay: 1.2s; }
        .hero-anim-6 { animation-delay: 1.35s; }
        @keyframes hero-fade-up { to { opacity: 1; transform: translateY(0); } }

        /* Headline mask-reveal — text rises into place like ink settling on a press */
        .hero-line-mask { display: inline-block; overflow: hidden; vertical-align: top; }
        .hero-line-inner { display: inline-block; transform: translateY(110%); animation: hero-line-up 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .hero-anim-2 { animation-delay: 0.6s; }
        .hero-anim-3 { animation-delay: 0.75s; }
        @keyframes hero-line-up { to { transform: translateY(0); } }

        .hero-eyebrow { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent-text); margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
        .hero-title { font-family: var(--font-heading); font-size: clamp(42px, 7vw, 108px); font-weight: 400; line-height: 1.0; letter-spacing: -0.02em; margin-bottom: 24px; }
        .hero-title em { color: var(--accent-text); font-style: italic; }
        .hero-sub { font-size: clamp(14px, 1.5vw, 16px); line-height: 1.8; color: var(--fg-muted); max-width: 520px; margin-bottom: 40px; }
        .hero-cta { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; margin-bottom: 48px; }
        .hero-stats { display: flex; align-items: center; gap: 0; }
        .h-stat { display: flex; flex-direction: column; gap: 2px; }
        .h-stat-num { font-family: var(--font-heading); font-size: 28px; font-weight: 400; color: var(--fg); line-height: 1; }
        .h-stat-label { font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--fg-subtle); }
        .h-stat-divider { width: 1px; height: 32px; background: var(--border); margin: 0 24px; }
        .btn-accent { display: inline-block; padding: 14px 32px; background: var(--accent); color: white; font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; text-decoration: none; transition: background 0.2s, transform 0.2s, box-shadow 0.3s; }
        .btn-accent:hover { background: #a01830; transform: translateY(-2px); box-shadow: 0 8px 24px -6px rgba(196, 30, 58, 0.45); }
        .btn-ghost { font-size: 11px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: var(--fg-muted); text-decoration: none; transition: color 0.2s; border-bottom: 1px solid var(--border); padding-bottom: 2px; }
        .btn-ghost:hover { color: var(--fg); border-color: var(--fg); }
        .link-muted { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--fg-muted); text-decoration: none; transition: color 0.2s; }
        .link-muted:hover { color: var(--fg); }
        .services-section { padding: 88px 48px; border-bottom: 1px solid var(--border); background: var(--bg-secondary); }
        .services-label { font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent-text); margin-bottom: 48px; display: flex; align-items: center; gap: 12px; max-width: var(--content-max); margin-left: auto; margin-right: auto; }
        .services-label::before { content: ''; display: inline-block; width: 20px; height: 1px; background: var(--accent); }
        .services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; max-width: var(--content-max); margin: 0 auto; }
        .service-card { padding: 44px 40px 40px 0; border-right: 1px solid var(--border); display: flex; flex-direction: column; gap: 14px; position: relative; overflow: hidden; transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1); text-decoration: none; color: inherit; }
        .service-card::before { content: ''; position: absolute; bottom: 0; left: 0; height: 2px; width: 0; background: var(--accent); transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1); z-index: 2; }
        .service-card:hover::before { width: 100%; }
        .service-card:hover { transform: translateY(-6px); }
        .service-card:last-child { border-right: none; padding-right: 0; }
        .service-card:not(:first-child) { padding-left: 40px; }
        .service-num {
          font-family: var(--font-heading); font-size: 90px; font-weight: 400; font-style: italic;
          color: var(--border); line-height: 1;
          position: absolute; top: -8px; right: 16px;
          transition: color 0.35s; user-select: none; z-index: 0;
        }
        .service-card:hover .service-num { color: var(--accent-text); opacity: 0.15; }
        .service-title { position: relative; z-index: 1; font-family: var(--font-heading); font-size: 25px; font-weight: 500; color: var(--fg); line-height: 1.2; margin-top: 36px; }
        .service-desc { position: relative; z-index: 1; font-size: 14.5px; line-height: 1.8; color: var(--fg-muted); flex: 1; }
        .service-list { position: relative; z-index: 1; list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
        .service-list li { font-size: 13px; color: var(--fg-muted); display: flex; align-items: center; }
        .service-cta {
          position: relative; z-index: 1;
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--fg-muted); margin-top: 10px;
          transition: color 0.25s;
        }
        .service-card:hover .service-cta { color: var(--accent-text); }
        .service-arrow { display: inline-block; transition: transform 0.25s; }
        .service-card:hover .service-arrow { transform: translateX(4px); }
        .featured-section { padding: 88px 48px; border-bottom: 1px solid var(--border); }
        .featured-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; max-width: var(--content-max); margin-left: auto; margin-right: auto; }
        .section-eyebrow { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent-text); margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
        .section-eyebrow::before { content: ''; display: inline-block; width: 16px; height: 1px; background: var(--accent); }
        .section-title { font-family: var(--font-heading); font-size: clamp(28px, 4vw, 48px); font-weight: 400; }
        .section-title em { font-style: italic; color: var(--accent-text); }
        /* ── WHY ── */
        .why-section { border-bottom: 1px solid var(--border); overflow: hidden; }
        .why-header { padding: 88px 48px 0; display: flex; flex-direction: column; gap: 12px; border-bottom: 1px solid var(--border); padding-bottom: 48px; max-width: var(--content-max); margin-left: auto; margin-right: auto; }
        .why-headline { font-family: var(--font-heading); font-size: clamp(36px, 5vw, 72px); font-weight: 400; line-height: 1.0; }
        .why-headline em { font-style: italic; color: var(--accent-text); }
        .why-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0; max-width: var(--content-max); margin: 0 auto; }
        .why-card {
          padding: 48px;
          border-right: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          display: flex; flex-direction: column; gap: 20px;
          position: relative; overflow: hidden;
          transition: background 0.3s, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .why-card::before {
          content: ''; position: absolute; top: 0; left: 0; height: 2px; width: 0;
          background: var(--accent); transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1); z-index: 2;
        }
        .why-card:hover::before { width: 100%; }
        .why-card:nth-child(even) { border-right: none; }
        .why-card:nth-last-child(-n+2) { border-bottom: none; }
        .why-card:hover { background: var(--bg-secondary); transform: translateY(-4px); }
        .why-card-num {
          font-family: var(--font-heading);
          font-size: 80px; font-weight: 400; font-style: italic;
          color: var(--border); line-height: 1;
          position: absolute; top: -10px; right: 24px;
          transition: color 0.3s;
          user-select: none;
        }
        .why-card:hover .why-card-num { color: var(--accent-text); opacity: 0.15; }
        .why-card-body { position: relative; z-index: 1; }
        .why-card-title { font-family: var(--font-heading); font-size: 22px; font-weight: 500; color: var(--fg); margin-bottom: 10px; line-height: 1.3; display: flex; align-items: center; gap: 12px; }
        .why-card-title::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--accent); flex-shrink: 0; transition: transform 0.3s; }
        .why-card:hover .why-card-title::before { transform: scale(1.6); }
        .why-card-desc { font-size: 14.5px; line-height: 1.8; color: var(--fg-muted); }

        /* ── TESTIMONIALS ── */
        .testimonials-section { background: var(--test-bg); border-bottom: 1px solid var(--border); transition: background 0.3s; }
        .testimonials-inner { display: grid; grid-template-columns: 280px 1fr; gap: 0; max-width: var(--content-max); margin: 0 auto; }
        .testimonials-label { padding: 64px 48px; border-right: 1px solid var(--test-label-border); display: flex; flex-direction: column; justify-content: flex-end; gap: 16px; background: var(--test-bg); }
        .testimonials-label .section-eyebrow { color: var(--accent-text); }
        .testimonials-label .section-eyebrow::before { background: var(--accent); }
        .testimonials-headline { font-family: var(--font-heading); font-size: clamp(28px, 3vw, 44px); font-weight: 400; color: var(--test-heading); line-height: 1.1; }
        .testimonials-headline em { font-style: italic; color: var(--test-heading-em); }
        .testimonials-list { display: flex; flex-direction: column; gap: 0; }
        .testimonial-item { padding: 44px 48px 44px 52px; border-bottom: 1px solid var(--test-border); display: flex; flex-direction: column; gap: 20px; transition: background 0.3s; background: var(--test-bg); position: relative; overflow: hidden; }
        .testimonial-item::before { content: ''; position: absolute; top: 0; left: 0; bottom: 0; width: 3px; background: var(--accent); transform: scaleY(0); transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1); transform-origin: top; }
        .testimonial-item:hover::before { transform: scaleY(1); }
        .testimonial-item:last-child { border-bottom: none; }
        .testimonial-item:hover { background: var(--test-bg-hover); }
        .testimonial-quote-wrap { display: flex; flex-direction: column; gap: 4px; position: relative; }
        .tq-mark { font-family: var(--font-heading); font-size: 64px; color: var(--accent-text); line-height: 0.5; opacity: 0.35; display: block; }
        .tq-text { font-family: var(--font-heading); font-size: clamp(16px, 1.8vw, 20px); font-style: italic; font-weight: 400; line-height: 1.6; color: var(--test-text-featured); margin-top: -8px; }
        .tq-author { display: flex; align-items: center; gap: 14px; }
        .tq-avatar { width: 38px; height: 38px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; font-family: var(--font-heading); font-size: 16px; color: white; flex-shrink: 0; box-shadow: 0 0 0 3px var(--test-bg), 0 0 0 4px var(--test-border); }
        .tq-name { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--test-name); margin-bottom: 2px; }
        .tq-name::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
        .tq-role { display: block; font-size: 11px; color: var(--test-role); letter-spacing: 0.06em; margin-left: 13px; }
        @media(max-width: 900px) {
          .services-grid { grid-template-columns: 1fr; }
          .service-card { padding: 32px 0 !important; border-right: none !important; border-bottom: 1px solid var(--border); }
          .service-num { font-size: 60px !important; top: -4px !important; }
          .service-title { margin-top: 24px !important; }
          .service-card:last-child { border-bottom: none; }
          .why-grid { grid-template-columns: 1fr; gap: 0; }
        }
        @media(max-width: 767px) {
          .hero-section { padding: 0 20px 48px; min-height: calc(100svh - 64px); }
          .reg-mark { width: 20px; height: 20px; }
          .reg-mark-tl, .reg-mark-tr { top: 16px; }
          .reg-mark-tl { left: 16px; }
          .reg-mark-tr { right: 16px; }
          .reg-mark-br { display: none; }
          .services-section, .featured-section { padding: 56px 20px; }
          .why-header { padding: 48px 20px !important; }
          .why-grid { grid-template-columns: 1fr !important; }
          .why-card { padding: 32px 20px !important; border-right: none !important; }
          .why-card:nth-last-child(-n+2) { border-bottom: 1px solid var(--border) !important; }
          .why-card:last-child { border-bottom: none !important; }
          .testimonials-inner { grid-template-columns: 1fr !important; }
          .testimonials-label { padding: 48px 20px 32px !important; border-right: none !important; border-bottom: 1px solid var(--test-border); }
          .testimonial-item { padding: 32px 20px 32px 24px !important; }
          .featured-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .bottom-cta-section { padding: 72px 20px; }
        }
      `}</style>
    </>
  )
}
