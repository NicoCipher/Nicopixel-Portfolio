import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { createPublicClient } from '@/lib/supabase/static'
import { getFontPairing } from '@/lib/fontPairings'
import { allFontVariables, FONT_PAIRING_VARS } from '@/lib/fonts'
import { safeJsonLd } from '@/lib/safeJsonLd'

const BASE_URL = 'https://nicopixel.vercel.app'

export const revalidate = 300

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  verification: {
    google: 'Iwi20c1kX7mijGTU8x8pfOLmsGdjNlNy9D0v5EOy3qM',
  },
  title: {
    default: 'Nicopixel — Graphic Designer Lagos',
    template: '%s | Nicopixel',
  },
  description: 'Nicopixel is a Lagos-based graphic designer specialising in brand identity, events design, and print collateral. Available for projects across Nigeria and globally.',
  keywords: [
    'nicopixel',
    'graphic designer lagos',
    'graphic designer nigeria',
    'brand identity designer lagos',
    'brand identity nigeria',
    'events design lagos',
    'print design nigeria',
    'logo designer lagos',
    'creative designer lagos',
    'Taiwo Olumide',
  ],
  authors: [{ name: 'Taiwo Olumide', url: BASE_URL }],
  creator: 'Taiwo Olumide',
  publisher: 'Nicopixel',
  category: 'Design',
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: BASE_URL,
    siteName: 'Nicopixel',
    title: 'Nicopixel — Graphic Designer Lagos',
    description: 'Lagos-based graphic designer. Brand identity, events design, and print collateral.',
    images: [{
      url: '/og-image.png',
      width: 1200, height: 630,
      alt: 'Nicopixel — Graphic Designer Lagos',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nicopixel — Graphic Designer Lagos',
    description: 'Lagos-based graphic designer. Brand identity, events design, and print collateral.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true, follow: true,
    googleBot: {
      index: true, follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: { canonical: BASE_URL },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Fetch favicon, logo, and social links from settings
  const supabase = createPublicClient()
  const { data: rows } = await supabase.from('site_settings').select('key, value').in('key', [
    'favicon_url', 'logo_url', 'font_pairing',
    'behance', 'behance_enabled', 'instagram', 'instagram_enabled',
    'tiktok', 'tiktok_enabled', 'linkedin', 'linkedin_enabled',
    'twitter', 'twitter_enabled',
  ])
  const siteAssets: Record<string, string> = {}
  rows?.forEach((r: { key: string; value: string | null }) => { if (r.value) siteAssets[r.key] = r.value })
  const fontPairing = getFontPairing(siteAssets.font_pairing)
  const fontVars = FONT_PAIRING_VARS[fontPairing.key] ?? FONT_PAIRING_VARS.editorial

  const sameAs = ['behance', 'instagram', 'tiktok', 'linkedin', 'twitter']
    .filter(key => siteAssets[key] && siteAssets[`${key}_enabled`] !== 'false')
    .map(key => siteAssets[key])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfessionalService',
        '@id': `${BASE_URL}/#business`,
        name: 'Nicopixel',
        url: BASE_URL,
        description: 'Graphic design studio specialising in brand identity, events design, and print collateral.',
        areaServed: ['Lagos', 'Nigeria'],
        address: { '@type': 'PostalAddress', addressLocality: 'Lagos', addressCountry: 'NG' },
        founder: { '@id': `${BASE_URL}/#founder` },
        sameAs,
      },
      {
        '@type': 'Person',
        '@id': `${BASE_URL}/#founder`,
        name: 'Taiwo Olumide',
        alternateName: 'Nicopixel',
        url: BASE_URL,
        jobTitle: 'Graphic Designer',
        worksFor: { '@id': `${BASE_URL}/#business` },
        address: { '@type': 'PostalAddress', addressLocality: 'Lagos', addressCountry: 'NG' },
        knowsAbout: ['Brand Identity', 'Graphic Design', 'Events Design', 'Print Design', 'Logo Design'],
        sameAs,
      },
    ],
  }

  return (
    <html lang="en" suppressHydrationWarning className={allFontVariables}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `:root { --font-heading: ${fontVars.heading} !important; --font-body: ${fontVars.body} !important; }` }} />
        {siteAssets.favicon_url ? (
          <>
            <link rel="icon" type="image/png" href={siteAssets.favicon_url} />
            <link rel="shortcut icon" href={siteAssets.favicon_url} />
            <link rel="apple-touch-icon" href={siteAssets.favicon_url} />
          </>
        ) : (
          <>
            <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
            <link rel="shortcut icon" href="/favicon.ico" />
            <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          </>
        )}
        <meta name="theme-color" content="#0A0A0A" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
