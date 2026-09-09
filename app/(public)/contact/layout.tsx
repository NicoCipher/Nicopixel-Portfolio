import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { createSocialMetadata } from '@/lib/seo'

const description = 'Start a brand identity, events design, or print project with Nicopixel. Based in Lagos, Nigeria and available for projects locally and globally.'

export const metadata: Metadata = createSocialMetadata({
  title: 'Start a Graphic Design Project | Nicopixel',
  description,
  path: '/contact',
})

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children
}
