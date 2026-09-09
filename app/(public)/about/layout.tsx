import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { createSocialMetadata } from '@/lib/seo'

const description = 'Meet Taiwo Olumide, the Lagos-based graphic designer behind Nicopixel, creating brand identities, event design, and print collateral.'

export const metadata: Metadata = createSocialMetadata({
  title: 'About Nicopixel | Graphic Designer in Lagos',
  description,
  path: '/about',
})

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children
}
