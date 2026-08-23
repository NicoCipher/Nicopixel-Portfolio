import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Use this client only in contexts that have no real request/cookie scope —
 * sitemap.ts, robots.ts, or any route handler that runs outside normal
 * page rendering. It never touches next/headers, so it can't throw or
 * misbehave when called by static generation or external crawlers.
 *
 * Do NOT use this for anything that needs the visitor's auth session
 * (admin pages, RLS-scoped user data) — use lib/supabase/server.ts for that.
 */
export function createStaticClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Anonymous client for public server-rendered pages. Unlike the session-aware
 * client, it never reads cookies, so public pages remain eligible for route
 * caching and do not vary per visitor.
 */
export function createPublicClient() {
  return createStaticClient()
}
