-- ============================================================
-- SmartGym — Migration 006: catalog_exercises.updated_at trigger
--
-- 001_initial_schema applied handle_updated_at() to profiles/routines/etc. but
-- NOT to catalog_exercises. Without it, editing an exercise leaves updated_at
-- unchanged, so the client's change-detection version can't tell the catalog
-- changed and the app keeps serving stale cached data.
--
-- Additive + idempotent. Also does the same for routine_templates defensively.
-- ============================================================

drop trigger if exists catalog_exercises_updated_at on public.catalog_exercises;
create trigger catalog_exercises_updated_at
  before update on public.catalog_exercises
  for each row execute function public.handle_updated_at();

-- routine_templates already got this in 004; re-assert for safety (no-op if present).
drop trigger if exists routine_templates_updated_at on public.routine_templates;
create trigger routine_templates_updated_at
  before update on public.routine_templates
  for each row execute function public.handle_updated_at();

-- One-time cache bust for already-installed clients after you deploy this:
-- touch every row so its updated_at (and thus the client version tag) changes.
-- Safe to run once; comment out if you don't want the churn.
update public.catalog_exercises set updated_at = now();
