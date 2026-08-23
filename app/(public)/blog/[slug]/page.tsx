import { createPublicClient } from '@/lib/supabase/static'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import ReactMarkdown from 'react-markdown'
import { Reveal } from '@/components/ui/Reveal'
import { safeJsonLd } from '@/lib/safeJsonLd'

const BASE_URL = 'https://nicopixel.vercel.app'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = createPublicClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, cover_image, seo_title, seo_description')
    .eq('slug', slug).eq('published', true).single()

  if (!post) return { title: 'Post Not Found' }

  const title = post.seo_title || `${post.title} — Nicopixel`
  const description = post.seo_description || post.excerpt || 'Insights on branding and design from Nicopixel.'

  return {
    title,
    description,
    openGraph: {
      title, description,
      type: 'article',
      url: `${BASE_URL}/blog/${slug}`,
      images: [{ url: post.cover_image || `${BASE_URL}/og-image.png`, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical: `${BASE_URL}/blog/${slug}` },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createPublicClient()

  const { data: post } = await supabase
    .from('blog_posts').select('*')
    .eq('slug', slug).eq('published', true)
    .single()

  if (!post) notFound()

  const { data: related } = await supabase
    .from('blog_posts')
    .select('id, title, slug, cover_image, category')
    .eq('published', true).eq('category', post.category)
    .neq('id', post.id).limit(3)

  const postUrl = `${BASE_URL}/blog/${slug}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
        headline: post.title,
        description: post.excerpt,
        image: post.cover_image,
        datePublished: post.published_at,
        dateModified: post.updated_at,
        author: { '@id': `${BASE_URL}/#founder` },
        publisher: { '@id': `${BASE_URL}/#business` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Insights', item: `${BASE_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: post.title, item: postUrl },
        ],
      },
    ],
  }

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <Reveal as="div" className="post-header">
        <Link href="/blog" className="post-back">← Back to Insights</Link>
        <span className="post-cat">{post.category}</span>
        <h1 className="post-title">{post.title}</h1>
        <div className="post-meta">
          <span>By Taiwo Olumide</span>
          <span className="post-meta-dot">·</span>
          <span>{new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </Reveal>

      {post.cover_image && (
        <Reveal as="div" className="post-cover" delay={120}>
          <Image src={post.cover_image} alt={post.title} fill style={{ objectFit: 'cover' }} priority />
        </Reveal>
      )}

      <div className="post-content">
        <ReactMarkdown
          components={{
            h2: ({ children }) => <h2 className="post-h2">{children}</h2>,
            h3: ({ children }) => <h3 className="post-h3">{children}</h3>,
            p: ({ children }) => <p className="post-p">{children}</p>,
            ul: ({ children }) => <ul className="post-ul">{children}</ul>,
            li: ({ children }) => <li className="post-li">{children}</li>,
            strong: ({ children }) => <strong className="post-strong">{children}</strong>,
            a: ({ href, children }) => <a href={href} className="post-link">{children}</a>,
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      <Reveal as="div" className="post-cta">
        <h2 className="post-cta-title">Want this kind of thinking on your brand?</h2>
        <div className="post-cta-btns">
          <Link href="/contact" className="post-cta-btn">Start a Project →</Link>
          <Link href="/contact?mode=call" className="post-cta-btn-ghost">Book a Free Call</Link>
        </div>
      </Reveal>

      {related && related.length > 0 && (
        <div className="post-related">
          <h2 className="post-related-title">More on {post.category}</h2>
          <div className="post-related-grid">
            {related.map((r: { id: string; title: string; slug: string; cover_image: string | null; category: string }, i: number) => (
              <Reveal key={r.id} delay={i * 90} y={18}>
                <Link href={`/blog/${r.slug}`} className="post-related-card-link">
                  <div className="post-related-card">
                    <div className="post-related-img">
                      {r.cover_image
                        ? <Image src={r.cover_image} alt={r.title} fill style={{ objectFit: 'cover' }} />
                        : <div className="post-related-placeholder"><span>N</span></div>
                      }
                    </div>
                    <h4 className="post-related-card-title">{r.title}</h4>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .post-header { padding: 60px 48px 0; max-width: 760px; margin: 0 auto; }
        .post-back { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--fg-muted); text-decoration: none; display: inline-block; margin-bottom: 32px; }
        .post-cat { display: block; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent-text); margin-bottom: 16px; }
        .post-title { font-family: var(--font-heading); font-size: clamp(32px, 5vw, 56px); font-weight: 400; line-height: 1.1; margin-bottom: 20px; }
        .post-meta { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--fg-subtle); margin-bottom: 40px; }
        .post-meta-dot { color: var(--accent-text); }

        .post-cover { position: relative; width: 100%; aspect-ratio: 16/8; background: var(--bg-secondary); margin-bottom: 56px; }

        .post-content { max-width: 700px; margin: 0 auto; padding: 0 48px; }
        .post-h2 { font-family: var(--font-heading); font-size: 28px; font-weight: 400; color: var(--fg); margin: 48px 0 18px; line-height: 1.25; }
        .post-h3 { font-family: var(--font-heading); font-size: 21px; font-weight: 400; color: var(--fg); margin: 36px 0 14px; }
        .post-p { font-size: 16px; line-height: 1.9; color: var(--fg-muted); margin-bottom: 22px; }
        .post-ul { margin: 0 0 22px; padding-left: 22px; display: flex; flex-direction: column; gap: 10px; }
        .post-li { font-size: 16px; line-height: 1.8; color: var(--fg-muted); }
        .post-strong { color: var(--fg); font-weight: 600; }
        .post-link { color: var(--accent-text); text-decoration: underline; }

        .post-cta { max-width: 700px; margin: 64px auto 0; padding: 48px; background: var(--bg-secondary); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 24px; }
        .post-cta-title { font-family: var(--font-heading); font-size: clamp(22px, 3vw, 32px); font-weight: 400; }
        .post-cta-btns { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
        .post-cta-btn { display: inline-block; padding: 13px 32px; background: var(--accent); color: white; font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; text-decoration: none; transition: background 0.2s; }
        .post-cta-btn:hover { background: #a01830; }
        .post-cta-btn-ghost { display: inline-block; padding: 13px 24px; border: 1px solid var(--border); color: var(--fg-muted); font-size: 11px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; text-decoration: none; transition: border-color 0.2s, color 0.2s; }
        .post-cta-btn-ghost:hover { border-color: var(--accent); color: var(--accent-text); }

        .post-related { max-width: 1000px; margin: 64px auto 0; padding: 56px 48px; border-top: 1px solid var(--border); }
        .post-related-title { font-family: var(--font-heading); font-size: 24px; font-weight: 400; margin-bottom: 32px; }
        .post-related-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .post-related-card-link { display: block; text-decoration: none; }
        .post-related-card { display: flex; flex-direction: column; gap: 14px; }
        .post-related-img { position: relative; aspect-ratio: 4/3; background: var(--bg-secondary); overflow: hidden; }
        .post-related-placeholder { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
        .post-related-placeholder span { font-family: var(--font-heading); font-size: 40px; font-style: italic; color: var(--border); }
        .post-related-card-title { font-family: var(--font-heading); font-size: 16px; font-weight: 400; color: var(--fg); line-height: 1.3; }

        @media(max-width: 767px) {
          .post-header { padding: 40px 20px 0; }
          .post-content { padding: 0 20px; }
          .post-cta { margin: 48px 20px 0; padding: 36px 24px; }
          .post-related { margin: 48px auto 0; padding: 40px 20px; }
          .post-related-grid { grid-template-columns: 1fr; gap: 28px; }
        }
      `}</style>
    </article>
  )
}
