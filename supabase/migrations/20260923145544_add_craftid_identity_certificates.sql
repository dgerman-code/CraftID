-- CraftID Identity Certificates
-- A certificate confirms CraftID registration/identity only.
-- It is not a professional qualification, statutory licence, quality
-- certification, accreditation, or EU institutional endorsement.

create table if not exists public.craftid_certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_code text not null unique,
  entity_id uuid not null references public.craftid_entities(id) on delete restrict,
  version_no integer not null check (version_no > 0),
  entity_type text not null check (entity_type in ('professional','workshop')),
  craftid_number bigint not null,
  craftid_check_digits text not null,
  issued_display_name text not null,
  issued_role_label text,
  issued_country_code text,
  entity_created_at timestamptz not null,
  issued_at timestamptz not null default now(),
  issued_by_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'issued' check (status in ('issued','revoked')),
  revoked_at timestamptz,
  revoked_by_user_id uuid references auth.users(id) on delete set null,
  revoked_reason text,
  created_at timestamptz not null default now(),
  constraint craftid_certificates_entity_version_key unique(entity_id, version_no),
  constraint craftid_certificates_revocation_consistency_check check (
    (status = 'issued' and revoked_at is null and revoked_reason is null)
    or
    (status = 'revoked' and revoked_at is not null and revoked_reason is not null)
  )
);

create index if not exists craftid_certificates_entity_idx
on public.craftid_certificates(entity_id, issued_at desc);

create index if not exists craftid_certificates_status_idx
on public.craftid_certificates(status, issued_at desc);

alter table public.craftid_certificates enable row level security;

revoke all on table public.craftid_certificates from public, anon, authenticated;
grant select on table public.craftid_certificates to authenticated;

drop policy if exists "owners and staff can read CraftID certificates"
on public.craftid_certificates;

create policy "owners and staff can read CraftID certificates"
on public.craftid_certificates
for select
to authenticated
using (
  exists (
    select 1
    from public.craftid_entities e
    where e.id = craftid_certificates.entity_id
      and (
        e.owner_user_id = (select auth.uid())
        or private.has_staff_role(array['reviewer','admin'])
      )
  )
);

create or replace function private.protect_craftid_certificate_identity()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.id is distinct from old.id
     or new.certificate_code is distinct from old.certificate_code
     or new.entity_id is distinct from old.entity_id
     or new.version_no is distinct from old.version_no
     or new.entity_type is distinct from old.entity_type
     or new.craftid_number is distinct from old.craftid_number
     or new.craftid_check_digits is distinct from old.craftid_check_digits
     or new.issued_display_name is distinct from old.issued_display_name
     or new.issued_role_label is distinct from old.issued_role_label
     or new.issued_country_code is distinct from old.issued_country_code
     or new.entity_created_at is distinct from old.entity_created_at
     or new.issued_at is distinct from old.issued_at
     or new.issued_by_user_id is distinct from old.issued_by_user_id
     or new.created_at is distinct from old.created_at then
    raise exception 'issued CraftID certificate identity fields are immutable';
  end if;

  if old.status = 'revoked' and new.status is distinct from old.status then
    raise exception 'revoked CraftID certificate cannot be reactivated';
  end if;

  return new;
end;
$$;

revoke all on function private.protect_craftid_certificate_identity()
from public, anon, authenticated;

drop trigger if exists craftid_certificates_protect_identity
on public.craftid_certificates;

create trigger craftid_certificates_protect_identity
before update on public.craftid_certificates
for each row execute function private.protect_craftid_certificate_identity();

create or replace function private.issue_own_craftid_certificate_impl(
  p_entity_id uuid
)
returns table(
  certificate_id uuid,
  certificate_code text,
  version_no integer,
  issued_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_entity public.craftid_entities%rowtype;
  v_display_name text;
  v_role_label text;
  v_country_code text;
  v_version integer;
  v_code text;
  v_certificate public.craftid_certificates%rowtype;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  select e.*
    into v_entity
  from public.craftid_entities e
  where e.id = p_entity_id
    and e.owner_user_id = v_user_id
  for update;

  if v_entity.id is null then
    raise exception 'CraftID entity not found or not owned by this account';
  end if;

  if v_entity.public_status <> 'published' then
    raise exception 'certificate can be issued only for a published CraftID';
  end if;

  if v_entity.entity_type = 'professional' then
    select pp.display_name, pp.professional_title, pp.country_code
      into v_display_name, v_role_label, v_country_code
    from public.professional_profiles pp
    where pp.entity_id = v_entity.id;
  else
    select wp.display_name, wp.craft_sector, wp.country_code
      into v_display_name, v_role_label, v_country_code
    from public.workshop_profiles wp
    where wp.entity_id = v_entity.id;
  end if;

  if nullif(btrim(coalesce(v_display_name, '')), '') is null then
    raise exception 'display name is required before certificate issuance';
  end if;

  select coalesce(max(c.version_no), 0) + 1
    into v_version
  from public.craftid_certificates c
  where c.entity_id = v_entity.id;

  v_code :=
    'CID-CERT-' ||
    lpad(v_entity.craftid_number::text, 8, '0') ||
    '-' || v_entity.craftid_check_digits ||
    '-V' || lpad(v_version::text, 2, '0');

  insert into public.craftid_certificates(
    certificate_code,
    entity_id,
    version_no,
    entity_type,
    craftid_number,
    craftid_check_digits,
    issued_display_name,
    issued_role_label,
    issued_country_code,
    entity_created_at,
    issued_by_user_id
  )
  values (
    v_code,
    v_entity.id,
    v_version,
    v_entity.entity_type,
    v_entity.craftid_number,
    v_entity.craftid_check_digits,
    btrim(v_display_name),
    nullif(btrim(coalesce(v_role_label, '')), ''),
    v_country_code,
    v_entity.created_at,
    v_user_id
  )
  returning * into v_certificate;

  insert into public.audit_events(
    actor_user_id,
    entity_id,
    action,
    metadata
  )
  values (
    v_user_id,
    v_entity.id,
    'craftid_certificate_issued',
    jsonb_build_object(
      'certificate_id', v_certificate.id,
      'certificate_code', v_certificate.certificate_code,
      'version_no', v_certificate.version_no
    )
  );

  return query
  select
    v_certificate.id,
    v_certificate.certificate_code,
    v_certificate.version_no,
    v_certificate.issued_at;
end;
$$;

revoke all on function private.issue_own_craftid_certificate_impl(uuid)
from public, anon, authenticated;

create or replace function public.issue_own_craftid_certificate(
  p_entity_id uuid
)
returns table(
  certificate_id uuid,
  certificate_code text,
  version_no integer,
  issued_at timestamptz
)
language sql
security invoker
set search_path = pg_catalog, private
as $$
  select * from private.issue_own_craftid_certificate_impl(p_entity_id);
$$;

revoke all on function public.issue_own_craftid_certificate(uuid) from public, anon;
grant execute on function public.issue_own_craftid_certificate(uuid) to authenticated;

create or replace function public.public_craftid_certificate(
  p_certificate_code text
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'certificate_id', c.id,
    'certificate_code', c.certificate_code,
    'version_no', c.version_no,
    'certificate_status', c.status,
    'issued_at', c.issued_at,
    'revoked_at', c.revoked_at,
    'revoked_reason', c.revoked_reason,
    'issued_display_name', c.issued_display_name,
    'issued_role_label', c.issued_role_label,
    'issued_country_code', c.issued_country_code,
    'entity_type', c.entity_type,
    'craftid_number', c.craftid_number,
    'craftid_check_digits', c.craftid_check_digits,
    'entity_created_at', c.entity_created_at,
    'current_craftid_status', e.public_status,
    'current_profile_available', e.public_status = 'published'
  )
  from public.craftid_certificates c
  join public.craftid_entities e on e.id = c.entity_id
  where upper(c.certificate_code) = upper(btrim(coalesce(p_certificate_code, '')))
  limit 1;
$$;

revoke all on function public.public_craftid_certificate(text) from public;
grant execute on function public.public_craftid_certificate(text) to anon, authenticated;

create or replace function private.admin_revoke_craftid_certificate_impl(
  p_certificate_code text,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_certificate public.craftid_certificates%rowtype;
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  if v_reason is null then
    raise exception 'revocation reason required';
  end if;

  select c.*
    into v_certificate
  from public.craftid_certificates c
  where upper(c.certificate_code) = upper(btrim(coalesce(p_certificate_code, '')))
  for update;

  if v_certificate.id is null then
    raise exception 'certificate not found';
  end if;

  if v_certificate.status = 'revoked' then
    return;
  end if;

  update public.craftid_certificates
  set status = 'revoked',
      revoked_at = now(),
      revoked_by_user_id = (select auth.uid()),
      revoked_reason = v_reason
  where id = v_certificate.id;

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
    v_certificate.entity_id,
    'craftid_certificate_revoked',
    'issued',
    'revoked',
    jsonb_build_object(
      'certificate_id', v_certificate.id,
      'certificate_code', v_certificate.certificate_code,
      'reason', v_reason
    )
  );
end;
$$;

revoke all on function private.admin_revoke_craftid_certificate_impl(text,text)
from public, anon, authenticated;

create or replace function public.admin_revoke_craftid_certificate(
  p_certificate_code text,
  p_reason text
)
returns void
language sql
security invoker
set search_path = pg_catalog, private
as $$
  select private.admin_revoke_craftid_certificate_impl(
    p_certificate_code,
    p_reason
  );
$$;

revoke all on function public.admin_revoke_craftid_certificate(text,text)
from public, anon;
grant execute on function public.admin_revoke_craftid_certificate(text,text)
to authenticated;
