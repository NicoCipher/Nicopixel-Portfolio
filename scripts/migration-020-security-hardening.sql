-- ============================================
-- MIGRATION 020 — SECURITY HARDENING
-- Run in the Supabase SQL Editor before deploying the matching app code.
-- ============================================
--
-- IMPORTANT — designate your real admin account FIRST. Replace the email
-- below, run it once, then sign out and back in after this migration:
--
-- UPDATE auth.users
-- SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
--   || jsonb_build_object('role', 'admin')
-- WHERE email = 'your-admin-email@example.com';
--
-- Do not set role=admin in user_metadata: a signed-in user can edit that.

-- RLS policies can call this function without trusting editable user metadata.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- page_views is now written only by the server-side tracking endpoint. The
-- IP column supports durable, cross-instance rate limiting on Vercel.
ALTER TABLE public.page_views
  ADD COLUMN IF NOT EXISTS ip TEXT;

CREATE INDEX IF NOT EXISTS idx_page_views_ip_created
  ON public.page_views(ip, created_at DESC);

-- Replace the legacy policy set wholesale. Earlier migrations granted every
-- authenticated user full admin access; Postgres ORs permissive policies, so
-- merely adding an admin policy would not remove that exposure.
DO $$
DECLARE
  target_table text;
  target_policy text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'about_content', 'activity_log', 'blog_posts', 'career_milestones',
    'faqs', 'login_attempts', 'messages', 'page_views', 'process_steps',
    'projects', 'services', 'site_settings', 'testimonials', 'why_items'
  ]
  LOOP
    IF to_regclass(format('public.%I', target_table)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target_table);
      FOR target_policy IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = target_table
      LOOP
        EXECUTE format('DROP POLICY %I ON public.%I', target_policy, target_table);
      END LOOP;
    END IF;
  END LOOP;
END;
$$;

-- Public site content: visitors can only read records intended for publication.
CREATE POLICY "Public read about" ON public.about_content
  FOR SELECT USING (true);
CREATE POLICY "Public read settings" ON public.site_settings
  FOR SELECT USING (true);
CREATE POLICY "Public read published projects" ON public.projects
  FOR SELECT USING (published = true);
CREATE POLICY "Public read active testimonials" ON public.testimonials
  FOR SELECT USING (active = true);
CREATE POLICY "Public read active services" ON public.services
  FOR SELECT USING (active = true);
CREATE POLICY "Public read why items" ON public.why_items
  FOR SELECT USING (true);
CREATE POLICY "Public read process steps" ON public.process_steps
  FOR SELECT USING (true);
CREATE POLICY "Public read active FAQs" ON public.faqs
  FOR SELECT USING (active = true);
CREATE POLICY "Public read published blog posts" ON public.blog_posts
  FOR SELECT USING (published = true);
CREATE POLICY "Public read active milestones" ON public.career_milestones
  FOR SELECT USING (active = true);

-- No browser client can create or read personal/contact/security data.
-- Contact, analytics, and login logging use the service-role server routes,
-- which bypass RLS after validating and rate-limiting the request.

-- Only explicit admins can manage content or access private operational data.
CREATE POLICY "Admin manage about" ON public.about_content
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage settings" ON public.site_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage projects" ON public.projects
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage testimonials" ON public.testimonials
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage services" ON public.services
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage why items" ON public.why_items
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage process steps" ON public.process_steps
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage FAQs" ON public.faqs
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage blog posts" ON public.blog_posts
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage milestones" ON public.career_milestones
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage messages" ON public.messages
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage page views" ON public.page_views
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage login attempts" ON public.login_attempts
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin manage activity log" ON public.activity_log
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Verification query (expected: only policies created in this migration).
-- SELECT tablename, policyname, roles, cmd, qual, with_check
-- FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
