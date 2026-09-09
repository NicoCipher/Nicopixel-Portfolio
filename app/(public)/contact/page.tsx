import type { Metadata } from 'next'
import { ContactPageClient } from '@/components/sections/ContactPageClient'
import { createSocialMetadata } from '@/lib/seo'

const socialDescription = 'Start a brand identity, events design, or print project with Nicopixel. Based in Lagos, Nigeria and available for projects locally and globally.'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Nicopixel for brand identity, events design, and print collateral projects in Lagos and beyond. Send a message or book a free discovery call.',
  alternates: { canonical: 'https://nicopixel.vercel.app/contact' },
  ...createSocialMetadata({
    title: 'Start a Graphic Design Project | Nicopixel',
    description: socialDescription,
    path: '/contact',
  }),
}

export default function ContactPage() {
  return <ContactPageClient />
}
