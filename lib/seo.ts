import type { Metadata } from 'next'

export const SITE_URL = 'https://nicopixel.vercel.app'
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/og-image.png`

export function createSocialMetadata({
  title,
  description,
  path,
  image = DEFAULT_SOCIAL_IMAGE,
}: {
  title: string
  description: string
  path: string
  image?: string
}): Metadata {
  const url = new URL(path, SITE_URL).toString()
  const imageUrl = image.startsWith('http') ? image : new URL(image, SITE_URL).toString()

  return {
    openGraph: {
      title,
      description,
      url,
      siteName: 'Nicopixel',
      locale: 'en_NG',
      type: 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}
