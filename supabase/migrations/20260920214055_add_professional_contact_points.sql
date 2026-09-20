-- Professional contact and external presence.
-- Optional, independently visible fields; no contact is required for a CraftID record.

create table if not exists public.entity_contact_points (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.craftid_entities(id) on delete cascade,
  contact_type text not null check (
    contact_type in ('professional_email','phone','website','linkedin','portfolio')
  ),
  value text not null,
  visibility text not null default 'private'
    check (visibility in ('private','public')),
  is_verified boolean not null default false,
  verified_at timestamptz,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(entity_id, contact_type)
);

alter table public.entity_contact_points enable row level security;

create policy "owners and staff can read contact points"
on public.entity_contact_points for select
to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = entity_contact_points.entity_id
      and (
        e.owner_user_id = (select auth.uid())
        or private.has_staff_role(array['reviewer','admin'])
      )
  )
);

create policy "owners can insert contact points"
on public.entity_contact_points for insert
to authenticated
with check (
  exists (
    select 1 from public.craftid_entities e
    where e.id = entity_contact_points.entity_id
      and e.owner_user_id = (select auth.uid())
  )
  and is_verified = false
  and verified_at is null
);

create policy "owners can update own unverified contact points"
on public.entity_contact_points for update
to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = entity_contact_points.entity_id
      and e.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.craftid_entities e
    where e.id = entity_contact_points.entity_id
      and e.owner_user_id = (select auth.uid())
  )
  and is_verified = false
  and verified_at is null
);

create policy "owners can delete contact points"
on public.entity_contact_points for delete
to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = entity_contact_points.entity_id
      and e.owner_user_id = (select auth.uid())
  )
);

create policy "public contact points are readable"
on public.entity_contact_points for select
to anon
using (visibility = 'public');

grant select on public.entity_contact_points to anon, authenticated;
grant insert, update, delete on public.entity_contact_points to authenticated;

drop trigger if exists entity_contact_points_touch_updated_at on public.entity_contact_points;
create trigger entity_contact_points_touch_updated_at
before update on public.entity_contact_points
for each row execute function private.touch_updated_at();
