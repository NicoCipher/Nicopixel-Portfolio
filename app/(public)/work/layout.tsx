import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { createSocialMetadata } from '@/lib/seo'

const description = 'Selected brand identity, events design, and print collateral projects by Nicopixel — a Lagos-based graphic design studio.'

export const metadata: Metadata = createSocialMetadata({
  title: 'Selected Graphic Design Work | Nicopixel',
  description,
  path: '/work',
})

export default function WorkLayout({ children }: { children: ReactNode }) {
  return children
}
