-- Fix generated-column handling in the entity identity guard and keep
-- published CraftID records continuously aligned with the publication gate.

create or replace function private.protect_craftid_entity_identity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_request_user uuid := (select auth.uid());
  v_email text;
  v_email_confirmed_at timestamptz;
  v_fingerprint text;
begin
  if new.id is distinct from old.id then
    raise exception 'CraftID entity id is immutable';
  end if;

  if new.craftid_number is distinct from old.craftid_number then
    raise exception 'CraftID number is immutable';
  end if;

  -- craftid_check_digits is a stored generated column derived from the immutable
  -- craftid_number. PostgreSQL computes generated values after BEFORE triggers,
  -- so comparing NEW.craftid_check_digits here would reject legitimate updates.
  if new.entity_type is distinct from old.entity_type then
    raise exception 'CraftID entity type is immutable';
  end if;

  if new.owner_user_id is distinct from old.owner_user_id then
    if new.owner_user_id is null and old.owner_user_id is not null then
      if exists (
        select 1 from auth.users u where u.id = old.owner_user_id
      ) then
        raise exception 'CraftID owner cannot be detached while the account exists';
      end if;

      return new;
    end if;

    if old.owner_user_id is null
       and new.owner_user_id = v_request_user
       and old.public_status = 'archived' then

      select u.email, u.email_confirmed_at
        into v_email, v_email_confirmed_at
      from auth.users u
      where u.id = v_request_user;

      if v_email_confirmed_at is null then
        raise exception 'confirm your email before recovering an archived CraftID';
      end if;

      v_fingerprint := private.craftid_identity_fingerprint(v_email);

      if v_fingerprint is null or not exists (
        select 1
        from private.craftid_identity_anchors a
        where a.entity_id = old.id
          and a.entity_type = old.entity_type
          and a.recovery_email_fingerprint = v_fingerprint
      ) then
        raise exception 'archived CraftID identity does not match this account';
      end if;

      return new;
    end if;

    raise exception 'CraftID owner cannot be changed through ordinary updates';
  end if;

  return new;
end;
$$;

revoke all on function private.protect_craftid_entity_identity()
from public, anon, authenticated;

create or replace function private.enforce_published_entity_readiness()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_entity_id uuid;
  v_status text;
  v_failures text[];
begin
  v_entity_id := case
    when tg_op = 'DELETE' then old.entity_id
    else new.entity_id
  end;

  if v_entity_id is null then
    return null;
  end if;

  select e.public_status
    into v_status
  from public.craftid_entities e
  where e.id = v_entity_id
  for update;

  if v_status <> 'published' then
    return null;
  end if;

  v_failures := private.publication_gate_failures(v_entity_id);

  if coalesce(array_length(v_failures, 1), 0) > 0 then
    update public.craftid_entities
    set public_status = 'draft',
        updated_at = now()
    where id = v_entity_id
      and public_status = 'published';

    insert into public.audit_events(
      actor_user_id,
      entity_id,
      action,
      old_status,
      new_status,
      metadata
    )
    values (
      (select auth.uid()),
      v_entity_id,
      'craftid_auto_unpublished_readiness',
      'published',
      'draft',
      jsonb_build_object(
        'failures', to_jsonb(v_failures),
        'trigger_table', tg_table_name,
        'trigger_operation', tg_op
      )
    );
  end if;

  return null;
end;
$$;

revoke all on function private.enforce_published_entity_readiness()
from public, anon, authenticated;

drop trigger if exists professional_profile_publication_readiness
on public.professional_profiles;
create trigger professional_profile_publication_readiness
after update or delete on public.professional_profiles
for each row execute function private.enforce_published_entity_readiness();

drop trigger if exists workshop_profile_publication_readiness
on public.workshop_profiles;
create trigger workshop_profile_publication_readiness
after update or delete on public.workshop_profiles
for each row execute function private.enforce_published_entity_readiness();

drop trigger if exists privacy_settings_publication_readiness
on public.privacy_settings;
create trigger privacy_settings_publication_readiness
after update or delete on public.privacy_settings
for each row execute function private.enforce_published_entity_readiness();

drop trigger if exists claims_publication_readiness
on public.claims;
create trigger claims_publication_readiness
after update or delete on public.claims
for each row execute function private.enforce_published_entity_readiness();

do $$
declare
  v_entity record;
  v_failures text[];
begin
  for v_entity in
    select e.id
    from public.craftid_entities e
    where e.public_status = 'published'
    for update
  loop
    v_failures := private.publication_gate_failures(v_entity.id);

    if coalesce(array_length(v_failures, 1), 0) > 0 then
      update public.craftid_entities
      set public_status = 'draft',
          updated_at = now()
      where id = v_entity.id
        and public_status = 'published';

      insert into public.audit_events(
        actor_user_id,
        entity_id,
        action,
        old_status,
        new_status,
        metadata
      )
      values (
        null,
        v_entity.id,
        'craftid_remediation_unpublished_invalid_record',
        'published',
        'draft',
        jsonb_build_object(
          'failures', to_jsonb(v_failures),
          'reason', 'existing published record did not satisfy current publication gate'
        )
      );
    end if;
  end loop;
end;
$$;
