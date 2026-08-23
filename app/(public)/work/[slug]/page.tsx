import { createPublicClient } from '@/lib/supabase/static'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ProjectGallery } from '@/components/sections/ProjectGallery'
import { Reveal } from '@/components/ui/Reveal'
import { safeJsonLd } from '@/lib/safeJsonLd'

const BASE_URL = 'https://nicopixel.vercel.app'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = createPublicClient()
  const { data: project } = await supabase
    .from('projects').select('title, description, cover_image, seo_title, seo_description, category, is_case_study, client_name, results')
    .eq('slug', slug).eq('published', true).single()

  if (!project) return { title: 'Project Not Found' }

  const title = project.seo_title || `${project.title} — Nicopixel`
  const description = project.seo_description || project.description || `${project.category} design project by Nicopixel.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/work/${slug}`,
      images: [{ url: project.cover_image || `${BASE_URL}/og-image.png`, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical: `${BASE_URL}/work/${slug}` },
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createPublicClient()

  const { data: project } = await supabase
    .from('projects').select('*')
    .eq('slug', slug).eq('published', true)
    .single()

  if (!project) notFound()

  const { data: related } = await supabase
    .from('projects').select('id, title, slug, cover_image, category')
    .eq('published', true).eq('category', project.category)
    .neq('id', project.id).limit(3)

  // Next project — same ordering as the Work listing itself, so it reads
  // as "keep going in order" rather than an arbitrary pick. Wraps around
  // to the first project if the current one is last.
  const { data: nextCandidates } = await supabase
    .from('projects').select('title, slug, cover_image')
    .eq('published', true).neq('id', project.id).gt('sort_order', project.sort_order)
    .order('sort_order', { ascending: true }).limit(1)
  let nextProject = nextCandidates?.[0]
  if (!nextProject) {
    const { data: firstProject } = await supabase
      .from('projects').select('title, slug, cover_image')
      .eq('published', true).neq('id', project.id)
      .order('sort_order', { ascending: true }).limit(1)
    nextProject = firstProject?.[0]
  }

  // JSON-LD for this specific project
  const projectUrl = `${BASE_URL}/work/${slug}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CreativeWork',
        name: project.title,
        description: project.description,
        image: project.cover_image,
        url: projectUrl,
        creator: { '@id': `${BASE_URL}/#founder` },
        genre: project.category,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Work', item: `${BASE_URL}/work` },
          { '@type': 'ListItem', position: 3, name: project.title, item: projectUrl },
        ],
      },
    ],
  }

  // Each case study block gets its own photo where possible. Previously
  // this fell back to cover_image for every missing gallery slot, which
  // meant a project with 0-1 gallery images showed the *same* photo under
  // all 4 numerals — reads as a bug, not a design choice. Now it only
  // assigns a photo where a genuinely distinct image is available; blocks
  // beyond that gracefully stay text-only instead of repeating.
  const uniqueImages = Array.from(new Set([project.cover_image, ...(project.images || [])].filter(Boolean))) as string[]
  const blockImages = [0, 1, 2, 3].map(i => uniqueImages[i] || null)

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* Hero image */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/8', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
        {project.cover_image
          ? <Image src={project.cover_image} alt={`${project.title} — ${project.category} design case study by Nicopixel, Lagos`} fill style={{ objectFit: 'cover' }} priority />
          : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 80, fontStyle: 'italic', color: 'var(--fg-subtle)' }}>{project.category}</span>
            </div>
        }
      </div>

      {/* Meta */}
      <Reveal as="div" className="proj-meta">
        <Link href="/work" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--fg-muted)', textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>← Back to Work</Link>
        <span style={{ display: 'block', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent-text)', marginBottom: 12, fontWeight: 600 }}>{project.category}</span>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 400, lineHeight: 1.1, marginBottom: 24 }}>{project.title}</h1>
        {project.description && (
          <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--fg-muted)', maxWidth: 600 }}>{project.description}</p>
        )}
      </Reveal>

      {/* Case Study Breakdown */}
      {project.is_case_study && (project.brief || project.challenge || project.approach || project.outcome) && (
        <div className="case-study-section">
          <div className="case-study-meta-row">
            {project.client_name && (
              <div className="cs-meta-item">
                <span className="cs-meta-label">Client</span>
                <span className="cs-meta-value">{project.client_name}</span>
              </div>
            )}
            {project.industry && (
              <div className="cs-meta-item">
                <span className="cs-meta-label">Industry</span>
                <span className="cs-meta-value">{project.industry}</span>
              </div>
            )}
            <div className="cs-meta-item">
              <span className="cs-meta-label">Services</span>
              <span className="cs-meta-value" style={{ textTransform: 'capitalize' }}>{project.category}</span>
            </div>
          </div>

          <div className="case-study-grid">
            {project.brief && (
              <Reveal as="div" className="cs-block" delay={0}>
                {blockImages[0] && (
                  <div className="cs-block-img">
                    <Image src={blockImages[0]} alt="" fill style={{ objectFit: 'cover' }} sizes="(max-width: 767px) 100vw, 50vw" />
                    <span className="cs-block-num">01</span>
                  </div>
                )}
                <h3 className="cs-block-title">The Brief</h3>
                <p className="cs-block-text">{project.brief}</p>
              </Reveal>
            )}
            {project.challenge && (
              <Reveal as="div" className="cs-block" delay={80}>
                {blockImages[1] && (
                  <div className="cs-block-img">
                    <Image src={blockImages[1]} alt="" fill style={{ objectFit: 'cover' }} sizes="(max-width: 767px) 100vw, 50vw" />
                    <span className="cs-block-num">02</span>
                  </div>
                )}
                <h3 className="cs-block-title">The Challenge</h3>
                <p className="cs-block-text">{project.challenge}</p>
              </Reveal>
            )}
            {project.approach && (
              <Reveal as="div" className="cs-block" delay={160}>
                {blockImages[2] && (
                  <div className="cs-block-img">
                    <Image src={blockImages[2]} alt="" fill style={{ objectFit: 'cover' }} sizes="(max-width: 767px) 100vw, 50vw" />
                    <span className="cs-block-num">03</span>
                  </div>
                )}
                <h3 className="cs-block-title">The Approach</h3>
                <p className="cs-block-text">{project.approach}</p>
              </Reveal>
            )}
            {project.outcome && (
              <Reveal as="div" className="cs-block" delay={240}>
                {blockImages[3] && (
                  <div className="cs-block-img">
                    <Image src={blockImages[3]} alt="" fill style={{ objectFit: 'cover' }} sizes="(max-width: 767px) 100vw, 50vw" />
                    <span className="cs-block-num">04</span>
                  </div>
                )}
                <h3 className="cs-block-title">The Outcome</h3>
                <p className="cs-block-text">{project.outcome}</p>
              </Reveal>
            )}
          </div>

          {project.results && (
            <Reveal as="div" className="cs-results">
              <span className="cs-results-label">Results</span>
              <p className="cs-results-text">{project.results}</p>
            </Reveal>
          )}
        </div>
      )}
      {project.images && project.images.length > 0 && (
        <div className="proj-gallery">
          <ProjectGallery images={project.images} title={project.title} />
        </div>
      )}

      {/* Next Project — a prominent "keep going" banner, separate from
          Related below: this is sequential (same order as the Work
          listing, wraps to the first project at the end), Related is
          curated by category. Different jobs, both worth having. */}
      {nextProject && (
        <Reveal as="div">
          <Link href={`/work/${nextProject.slug}`} className="proj-next-link">
            <div className="proj-next-banner">
              {nextProject.cover_image && (
                <Image src={nextProject.cover_image} alt="" fill style={{ objectFit: 'cover' }} sizes="100vw" />
              )}
              <div className="proj-next-overlay">
                <span className="proj-next-label">Next Project</span>
                <h2 className="proj-next-title">{nextProject.title} <span className="proj-next-arrow">→</span></h2>
              </div>
            </div>
          </Link>
        </Reveal>
      )}

      {/* Related */}
      {related && related.length > 0 && (
        <div className="proj-related">
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 500, marginBottom: 32, textTransform: 'capitalize', maxWidth: 'var(--content-max)', marginLeft: 'auto', marginRight: 'auto' }}>
            More {project.category} work
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, maxWidth: 'var(--content-max)', margin: '0 auto' }}>
            {related.map((p: typeof project, i: number) => (
              <Reveal key={p.id} delay={i * 90} y={18}>
                <Link href={`/work/${p.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
                  <div style={{ position: 'relative', aspectRatio: '4/3', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                    {p.cover_image && <Image src={p.cover_image} alt={`${p.title} — design by Nicopixel`} fill style={{ objectFit: 'cover' }} sizes="(max-width: 767px) 100vw, 33vw" />}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 20 }}>
                      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 400, color: 'white', margin: 0 }}>{p.title}</h4>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      )}

      {/* ── CTA ── */}
      <section style={{ padding: 'clamp(64px, 8vw, 100px) 48px', textAlign: 'center', background: 'var(--bg-secondary)' }}>
        <Reveal style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 400, lineHeight: 1.1 }}>
            Want work like this<br /><em style={{ fontStyle: 'italic', color: 'var(--accent-text)' }}>for your brand?</em>
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--fg-muted)' }}>
            Every project starts with a conversation. Let&apos;s talk about what you need.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/contact" style={{ display: 'inline-block', padding: '14px 36px', background: 'var(--accent)', color: 'white', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', textDecoration: 'none', transition: 'background 0.2s' }}>
              Start a Project →
            </Link>
            <Link href="/contact?mode=call" style={{ display: 'inline-block', padding: '14px 28px', border: '1px solid var(--border)', color: 'var(--fg-muted)', fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', textDecoration: 'none', transition: 'border-color 0.2s, color 0.2s' }}>
              Book a Free Call
            </Link>
          </div>
        </Reveal>
      </section>

      <style>{`
        .proj-meta { padding: 60px 48px; border-bottom: 1px solid var(--border); }

        .case-study-section { border-bottom: 1px solid var(--border); padding: 56px 48px 64px; background: var(--bg-secondary); }
        .case-study-meta-row { display: flex; gap: 48px; margin-bottom: 48px; flex-wrap: wrap; max-width: var(--content-max); margin-left: auto; margin-right: auto; }
        .cs-meta-item { display: flex; flex-direction: column; gap: 5px; }
        .cs-meta-label { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--fg-subtle); }
        .cs-meta-value { font-size: 15px; font-weight: 600; color: var(--fg); font-family: var(--font-heading); }
        .case-study-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0; border-top: 1px solid var(--border); max-width: var(--content-max); margin-left: auto; margin-right: auto; }
        .cs-block { border-right: 1px solid var(--border); border-bottom: 1px solid var(--border); }
        .cs-block:nth-child(2n) { border-right: none; }
        .cs-block:nth-last-child(-n+2) { border-bottom: none; }
        .cs-block-img { position: relative; width: 100%; aspect-ratio: 16/10; overflow: hidden; background: var(--bg-secondary); }
        .cs-block-img::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%);
          pointer-events: none;
        }
        .cs-block-num {
          position: absolute; z-index: 1; bottom: 12px; right: 22px;
          font-family: var(--font-heading); font-style: italic; font-weight: 400;
          font-size: clamp(36px, 4.5vw, 56px); line-height: 1; color: white;
        }
        .cs-block-title { font-family: var(--font-heading); font-size: 20px; font-weight: 400; color: var(--fg); margin: 24px 40px 12px; }
        .cs-block-text { font-size: 14px; line-height: 1.85; color: var(--fg-muted); padding: 0 40px 40px; }
        .cs-results { margin-top: 40px; padding: 28px 32px; background: var(--accent); display: flex; flex-direction: column; gap: 8px; max-width: var(--content-max); margin-left: auto; margin-right: auto; }
        .cs-results-label { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.85); }
        .cs-results-text { font-family: var(--font-heading); font-size: 18px; font-style: italic; color: white; line-height: 1.5; }

        .proj-gallery { padding: 48px 48px; border-bottom: 1px solid var(--border); max-width: var(--content-max); margin: 0 auto; }
        .proj-next-link { display: block; text-decoration: none; }
        .proj-next-banner {
          position: relative; width: 100%; aspect-ratio: 21/9;
          background: var(--bg-secondary); overflow: hidden;
        }
        .proj-next-banner img { transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .proj-next-link:hover .proj-next-banner img { transform: scale(1.05); }
        .proj-next-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 55%, transparent 100%);
          display: flex; flex-direction: column; justify-content: flex-end;
          padding: clamp(28px, 5vw, 56px);
        }
        .proj-next-label {
          font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--accent-text); font-weight: 600; margin-bottom: 10px;
        }
        .proj-next-title {
          font-family: var(--font-heading); font-size: clamp(28px, 4.5vw, 56px);
          font-weight: 400; color: white; margin: 0;
          display: flex; align-items: center; gap: 16px;
        }
        .proj-next-arrow { transition: transform 0.3s ease; display: inline-block; }
        .proj-next-link:hover .proj-next-arrow { transform: translateX(8px); }

        .proj-related { padding: 60px 48px; }
        @media(max-width: 767px) {
          .proj-next-banner { aspect-ratio: 4/5; }
          .proj-meta { padding: 40px 20px; }
          .case-study-section { padding: 40px 20px 48px; }
          .case-study-meta-row { gap: 28px; margin-bottom: 36px; }
          .case-study-grid { grid-template-columns: 1fr; }
          .cs-block { border-right: none !important; border-bottom: 1px solid var(--border) !important; }
          .cs-block:last-child { border-bottom: none !important; }
          .cs-block-title, .cs-block-text { margin-left: 20px; margin-right: 20px; padding-left: 0; padding-right: 0; }
          .cs-results { padding: 22px 24px; }
          .proj-gallery { padding: 24px 20px; }
          .proj-gallery-grid { grid-template-columns: 1fr 1fr; }
          .proj-related { padding: 40px 20px; }
          .proj-related div[style*="repeat(3"] { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </article>
  )
}
