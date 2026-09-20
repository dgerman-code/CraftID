-- Owners may change contact value/disclosure without self-verifying.
-- Verification survives disclosure-only changes and resets only on value change.

drop policy if exists "owners can update own unverified contact points" on public.entity_contact_points;

create policy "owners can update own contact points"
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
);

create or replace function private.protect_contact_verification_fields()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public, private
as $$
begin
  if private.has_staff_role(array['reviewer','admin']) then
    return new;
  end if;

  if new.value is distinct from old.value then
    new.is_verified := false;
    new.verified_at := null;
    new.last_checked_at := null;
    new.verification_method := null;
    new.verification_level := 'unverified';
    new.verification_expires_at := null;
  else
    new.is_verified := old.is_verified;
    new.verified_at := old.verified_at;
    new.last_checked_at := old.last_checked_at;
    new.verification_method := old.verification_method;
    new.verification_level := old.verification_level;
    new.verification_expires_at := old.verification_expires_at;
  end if;

  return new;
end;
$$;

drop trigger if exists contact_points_reset_verification on public.entity_contact_points;
drop trigger if exists contact_points_protect_verification on public.entity_contact_points;

create trigger contact_points_protect_verification
before update on public.entity_contact_points
for each row execute function private.protect_contact_verification_fields();
