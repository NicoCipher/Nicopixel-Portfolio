import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { createSocialMetadata } from '@/lib/seo'

const description = 'Brand identity, events design, and print collateral by Nicopixel. See what is included, how the process works, and examples of real client work.'

export const metadata: Metadata = createSocialMetadata({
  title: 'Graphic Design Services in Lagos | Nicopixel',
  description,
  path: '/services',
})

export default function ServicesLayout({ children }: { children: ReactNode }) {
  return children
}
