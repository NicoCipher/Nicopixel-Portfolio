import type { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/static'

const BASE_URL = 'https://nicopixel.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'monthly', priority: 1 },
    { url: `${BASE_URL}/work`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/services`, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE_URL}/case-studies`, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE_URL}/blog`, changeFrequency: 'weekly', priority: 0.75 },
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.7 },
  ]

  try {
    const supabase = createPublicClient()
    const [{ data: projects }, { data: posts }] = await Promise.all([
      supabase
        .from('projects')
        .select('slug, updated_at, cover_image')
        .eq('published', true),
      supabase
        .from('blog_posts')
        .select('slug, updated_at, cover_image')
        .eq('published', true),
    ])

    const projectPages: MetadataRoute.Sitemap = (projects || []).map((project) => ({
      url: `${BASE_URL}/work/${project.slug}`,
      lastModified: project.updated_at ? new Date(project.updated_at) : undefined,
      changeFrequency: 'monthly',
      priority: 0.8,
      images: project.cover_image ? [project.cover_image] : undefined,
    }))

    const blogPages: MetadataRoute.Sitemap = (posts || []).map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : undefined,
      changeFrequency: 'monthly',
      priority: 0.65,
      images: post.cover_image ? [post.cover_image] : undefined,
    }))

    return [...staticPages, ...projectPages, ...blogPages]
  } catch {
    // Keep core pages discoverable even if the content store is temporarily unavailable.
    return staticPages
  }
}
