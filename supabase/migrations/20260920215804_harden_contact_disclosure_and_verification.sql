-- Harden professional contact disclosure and verification.
-- Public API/view never exposes email or phone values.

create table if not exists public.contact_disclosure_events (
  id uuid primary key default gen_random_uuid(),
  contact_point_id uuid,
  entity_id uuid not null references public.craftid_entities(id) on delete cascade,
  actor_user_id uuid,
  event_type text not null check (
    event_type in ('created','public_enabled','public_disabled','partner_sharing_enabled','partner_sharing_disabled','deleted')
  ),
  contact_type text not null,
  occurred_at timestamptz not null default now()
);

alter table public.contact_disclosure_events enable row level security;

create policy "owners and staff can read contact disclosure events"
on public.contact_disclosure_events for select
to authenticated
using (
  exists (
    select 1 from public.craftid_entities e
    where e.id = contact_disclosure_events.entity_id
      and (
        e.owner_user_id = (select auth.uid())
        or private.has_staff_role(array['reviewer','admin'])
      )
  )
);

grant select on public.contact_disclosure_events to authenticated;

alter table public.entity_contact_points
  add column if not exists show_in_public_profile boolean not null default false,
  add column if not exists public_consent_at timestamptz,
  add column if not exists share_with_institutional_partners boolean not null default false,
  add column if not exists partner_sharing_consent_at timestamptz,
  add column if not exists verification_method text
    check (verification_method is null or verification_method in ('channel_control','domain_control','manual_profile_match','external_source')),
  add column if not exists verification_level text not null default 'unverified'
    check (verification_level in ('unverified','control_confirmed','manual_match','external_source_confirmed')),
  add column if not exists verification_expires_at timestamptz;

update public.entity_contact_points
set
  show_in_public_profile = case
    when visibility = 'public' and contact_type in ('website','linkedin','portfolio') then true
    else false
  end,
  public_consent_at = case
    when visibility = 'public' and contact_type in ('website','linkedin','portfolio') then now()
    else null
  end;

drop policy if exists "public contact points are readable" on public.entity_contact_points;
revoke select on public.entity_contact_points from anon;

alter table public.entity_contact_points
  drop constraint if exists entity_contact_points_visibility_check;

alter table public.entity_contact_points
  drop column if exists visibility;

alter table public.entity_contact_points
  add constraint contact_public_type_check check (
    show_in_public_profile = false
    or contact_type in ('website','linkedin','portfolio')
  ),
  add constraint contact_public_consent_check check (
    (show_in_public_profile = false and public_consent_at is null)
    or (show_in_public_profile = true and public_consent_at is not null)
  ),
  add constraint contact_partner_consent_check check (
    (share_with_institutional_partners = false and partner_sharing_consent_at is null)
    or (share_with_institutional_partners = true and partner_sharing_consent_at is not null)
  );

create or replace function private.reset_contact_verification_on_value_change()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  if new.value is distinct from old.value then
    new.is_verified := false;
    new.verified_at := null;
    new.last_checked_at := null;
    new.verification_method := null;
    new.verification_level := 'unverified';
    new.verification_expires_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists contact_points_reset_verification on public.entity_contact_points;
create trigger contact_points_reset_verification
before update on public.entity_contact_points
for each row execute function private.reset_contact_verification_on_value_change();

create or replace function private.log_contact_disclosure_change()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.contact_disclosure_events(
      contact_point_id, entity_id, actor_user_id, event_type, contact_type
    ) values (new.id, new.entity_id, auth.uid(), 'created', new.contact_type);

    if new.show_in_public_profile then
      insert into public.contact_disclosure_events(
        contact_point_id, entity_id, actor_user_id, event_type, contact_type
      ) values (new.id, new.entity_id, auth.uid(), 'public_enabled', new.contact_type);
    end if;

    if new.share_with_institutional_partners then
      insert into public.contact_disclosure_events(
        contact_point_id, entity_id, actor_user_id, event_type, contact_type
      ) values (new.id, new.entity_id, auth.uid(), 'partner_sharing_enabled', new.contact_type);
    end if;

    return new;
  elsif tg_op = 'UPDATE' then
    if new.show_in_public_profile is distinct from old.show_in_public_profile then
      insert into public.contact_disclosure_events(
        contact_point_id, entity_id, actor_user_id, event_type, contact_type
      ) values (
        new.id, new.entity_id, auth.uid(),
        case when new.show_in_public_profile then 'public_enabled' else 'public_disabled' end,
        new.contact_type
      );
    end if;

    if new.share_with_institutional_partners is distinct from old.share_with_institutional_partners then
      insert into public.contact_disclosure_events(
        contact_point_id, entity_id, actor_user_id, event_type, contact_type
      ) values (
        new.id, new.entity_id, auth.uid(),
        case when new.share_with_institutional_partners then 'partner_sharing_enabled' else 'partner_sharing_disabled' end,
        new.contact_type
      );
    end if;

    return new;
  elsif tg_op = 'DELETE' then
    insert into public.contact_disclosure_events(
      contact_point_id, entity_id, actor_user_id, event_type, contact_type
    ) values (old.id, old.entity_id, auth.uid(), 'deleted', old.contact_type);
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists contact_points_log_disclosure on public.entity_contact_points;
create trigger contact_points_log_disclosure
after insert or update or delete on public.entity_contact_points
for each row execute function private.log_contact_disclosure_change();

create or replace view public.public_contact_links
with (security_barrier = true)
as
select
  id,
  entity_id,
  contact_type,
  value,
  verification_level,
  verified_at,
  last_checked_at,
  verification_expires_at
from public.entity_contact_points
where show_in_public_profile = true
  and contact_type in ('website','linkedin','portfolio');

grant select on public.public_contact_links to anon, authenticated;
