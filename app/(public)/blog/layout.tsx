import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { createSocialMetadata } from '@/lib/seo'

const description = 'Practical insights on branding, visual identity, design decisions, and creative work from Nicopixel, a Lagos-based graphic designer.'

export const metadata: Metadata = createSocialMetadata({
  title: 'Branding & Graphic Design Insights | Nicopixel',
  description,
  path: '/blog',
})

export default function BlogLayout({ children }: { children: ReactNode }) {
  return children
}
