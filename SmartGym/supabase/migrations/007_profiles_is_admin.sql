-- ============================================================
-- SmartGym — Migration 007: profiles.is_admin + self-promotion guard
--
-- Formalizes the is_admin flag (already added manually in some envs) and
-- prevents users from escalating their own privileges: the existing
-- "profiles: users can update own profile" policy would otherwise let a user
-- set is_admin = true on their own row. Only service_role may change it.
--
-- Additive + idempotent.
-- ============================================================

-- 1. Column (no-op if it already exists)
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

comment on column public.profiles.is_admin is
  'Grants the in-app Admin Tools. Only settable by service_role (see guard trigger).';

-- 2. Guard: ignore is_admin changes coming from non-service-role connections.
--    SECURITY INVOKER (default) so current_user reflects the actual caller role
--    (PostgREST sets it to 'authenticated'/'anon'/'service_role' per request).
create or replace function public.prevent_is_admin_change()
returns trigger language plpgsql as $$
begin
  if new.is_admin is distinct from old.is_admin and current_user <> 'service_role' then
    new.is_admin := old.is_admin;   -- silently reject self-promotion
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_is_admin on public.profiles;
create trigger profiles_guard_is_admin
  before update on public.profiles
  for each row execute function public.prevent_is_admin_change();

-- To grant admin, run as service_role (SQL editor / admin dashboard):
--   update public.profiles set is_admin = true where email = 'mr.omario92@gmail.com';
