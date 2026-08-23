import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { SessionGuard } from '@/components/admin/SessionGuard'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'

// Admin routes depend on the signed-in user's session and must never be
// pre-rendered or cached as public HTML during a production build.
export const dynamic = 'force-dynamic'

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data } = await supabase.from('site_settings').select('value').eq('key', 'session_timeout_minutes').maybeSingle()
  const timeoutMinutes = data?.value ? parseInt(data.value, 10) : 30

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A' }}>
      <AdminSidebar />
      <main style={{ marginLeft: 240, background: '#111111', minHeight: '100vh' }}>
        <div style={{ maxWidth: 1480, margin: '0 auto' }}>
          <Suspense>
            <SessionGuard timeoutMinutes={timeoutMinutes}>
              {children}
            </SessionGuard>
          </Suspense>
        </div>
      </main>
      <style>{`
        @media(max-width: 900px) {
          main { margin-left: 0 !important; padding-top: 56px; }
        }
      `}</style>
    </div>
  )
}
