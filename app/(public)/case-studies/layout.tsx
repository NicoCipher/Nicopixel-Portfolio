import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { createSocialMetadata } from '@/lib/seo'

const description = 'Detailed Nicopixel brand design case studies covering the brief, challenge, creative approach, outcome, and results behind selected projects.'

export const metadata: Metadata = createSocialMetadata({
  title: 'Brand Design Case Studies | Nicopixel',
  description,
  path: '/case-studies',
})

export default function CaseStudiesLayout({ children }: { children: ReactNode }) {
  return children
}
