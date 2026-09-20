alter table public.entity_contact_points
  add column if not exists is_primary boolean not null default true;

-- Current UI stores one value per contact type, so the single row is primary.
-- System/login email remains in Supabase Auth and is not stored here.
