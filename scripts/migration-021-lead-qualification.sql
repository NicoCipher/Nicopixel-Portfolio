-- ============================================
-- MIGRATION 021 — LEAD QUALIFICATION
-- Run after migration-020 and before deploying the contact-form upgrade.
-- ============================================

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS project_type TEXT,
  ADD COLUMN IF NOT EXISTS budget_range TEXT,
  ADD COLUMN IF NOT EXISTS timeline TEXT,
  ADD COLUMN IF NOT EXISTS preferred_contact TEXT;

-- Keep dashboard filtering responsive without storing sensitive data in an
-- analytics table. These are project-preference fields provided by the lead.
CREATE INDEX IF NOT EXISTS idx_messages_project_type ON public.messages(project_type);
CREATE INDEX IF NOT EXISTS idx_messages_budget_range ON public.messages(budget_range);
