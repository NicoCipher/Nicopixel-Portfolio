import { Navbar } from '@/components/layout/Navbar'
import { PageTracker } from '@/components/ui/PageTracker'
import { Footer } from '@/components/layout/Footer'
import { createPublicClient } from '@/lib/supabase/static'

export const revalidate = 300

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = createPublicClient()
  const { data: settingsRows } = await supabase.from('site_settings').select('key, value')
  const settings: Record<string, string | null> = {}
  settingsRows?.forEach((r: { key: string; value: string | null }) => { settings[r.key] = r.value })

  return (
    <div className="public-site">
      <a href="#main-content" className="skip-to-content">Skip to content</a>
      <Navbar settings={settings} />
      <PageTracker />
      <main id="main-content" style={{ overflowX: 'hidden', maxWidth: '100vw' }}>
        {children}
      </main>
      <Footer settings={settings} />

      <style>{`
        .skip-to-content {
          position: fixed;
          top: -100px; left: 16px;
          z-index: 200;
          background: var(--accent);
          color: white;
          padding: 12px 20px;
          font-size: 13px; font-weight: 600;
          text-decoration: none;
          transition: top 0.2s ease;
        }
        .skip-to-content:focus-visible {
          top: 16px;
        }
      `}</style>
    </div>
  )
}
