import { createPublicClient } from '@/lib/supabase/static'
import { WorkGallery } from '@/components/sections/WorkGallery'
import { Reveal } from '@/components/ui/Reveal'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Work',
  description: 'Selected brand identity, events design, and print collateral projects by Nicopixel — a Lagos-based graphic design studio.',
  alternates: { canonical: 'https://nicopixel.vercel.app/work' },
}

export default async function WorkPage() {
  const supabase = createPublicClient()
  const { data: projects } = await supabase
    .from('projects').select('*')
    .eq('published', true)
    .order('sort_order', { ascending: true })

  return (
    <>
      <Reveal as="div" className="work-header">
        <p style={{
          fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'var(--accent-text)', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ display: 'inline-block', width: 24, height: 1, background: 'var(--accent)' }} />
          Selected Work
        </p>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(32px, 5vw, 64px)',
          fontWeight: 400, marginBottom: 0,
        }}>
          All Projects
        </h1>
      </Reveal>
      <WorkGallery projects={projects || []} />

      <section className="work-cta-section">
        <Reveal style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent-text)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ display: 'inline-block', width: 24, height: 1, background: 'var(--accent)' }} />
            Like what you see?
          </p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 400, lineHeight: 1.05, textAlign: 'center' }}>
            Let&apos;s build something<br /><em style={{ color: 'var(--accent-text)', fontStyle: 'italic' }}>worth noticing.</em>
          </h2>
          <Link href="/contact" style={{ display: 'inline-block', padding: '14px 36px', background: 'var(--accent)', color: 'white', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', textDecoration: 'none' }}>
            Start a Project →
          </Link>
        </Reveal>
      </section>

      <style>{`
        .work-header {
          padding: 60px 48px 40px;
          border-bottom: 1px solid var(--border);
        }
        .work-cta-section {
          padding: clamp(64px, 8vw, 100px) 48px;
          text-align: center;
          border-top: 1px solid var(--border);
        }
        @media(max-width: 767px) {
          .work-header { padding: 40px 20px 28px; }
          .work-cta-section { padding: 52px 20px; }
        }
      `}</style>
    </>
  )
}
