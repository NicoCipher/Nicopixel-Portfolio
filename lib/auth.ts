type AuthUser = { app_metadata?: Record<string, unknown> | null } | null | undefined

/** Only users deliberately granted the Supabase app_metadata admin role may manage the site. */
export function isAdmin(user: AuthUser): boolean {
  return user?.app_metadata?.role === 'admin'
}
