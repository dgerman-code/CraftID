-- Partner temporary access provisioning + Opportunity imagery.
-- New partner accounts may be created with an admin-issued temporary password.
-- Existing auth accounts are never password-reset by this workflow.
-- Partner-created opportunities may have one optional public cover image.

-------------------------------------------------------------------------------
-- 1. Partner temporary-password state
-------------------------------------------------------------------------------

alter table private.partner_memberships
  add column if not exists must_change_password boolean not null default false;

create or replace function public.admin_auth_user_for_email(
  p_login_email text
)
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog, auth, private
as $$
declare
  v_email text := lower(btrim(coalesce(p_login_email,'')));
  v_user_id uuid;
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'valid email is required';
  end if;

  select u.id
    into v_user_id
  from auth.users u
  where lower(coalesce(u.email,'')) = v_email
  order by u.created_at asc
  limit 1;

  return v_user_id;
end;
$$;

revoke all on function public.admin_auth_user_for_email(text)
from public, anon;
grant execute on function public.admin_auth_user_for_email(text)
to authenticated;

create or replace function public.admin_finalize_partner_provisioning(
  p_partner_organisation_id uuid,
  p_login_email text,
  p_user_id uuid,
  p_must_change_password boolean
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_email text := lower(btrim(coalesce(p_login_email,'')));
  v_auth_email text;
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'valid partner login email is required';
  end if;

  if not exists (
    select 1
    from public.partner_organisations po
    where po.id = p_partner_organisation_id
  ) then
    raise exception 'partner organisation not found';
  end if;

  select lower(u.email)
    into v_auth_email
  from auth.users u
  where u.id = p_user_id;

  if v_auth_email is null then
    raise exception 'auth user not found';
  end if;

  if v_auth_email <> v_email then
    raise exception 'auth user email does not match partner login email';
  end if;

  insert into private.partner_memberships(
    partner_organisation_id,
    login_email,
    user_id,
    access_role,
    is_active,
    must_change_password,
    created_by,
    created_at,
    updated_at
  )
  values (
    p_partner_organisation_id,
    v_email,
    p_user_id,
    'editor',
    true,
    coalesce(p_must_change_password,false),
    v_actor,
    now(),
    now()
  )
  on conflict (partner_organisation_id, login_email) do update
  set user_id = excluded.user_id,
      is_active = true,
      must_change_password = excluded.must_change_password,
      updated_at = now();

  insert into public.audit_events(actor_user_id, action, metadata)
  values (
    v_actor,
    'partner_portal_access_provisioned',
    jsonb_build_object(
      'partner_organisation_id', p_partner_organisation_id,
      'login_email', v_email,
      'user_id', p_user_id,
      'temporary_password_required', coalesce(p_must_change_password,false)
    )
  );
end;
$$;

revoke all on function public.admin_finalize_partner_provisioning(uuid,text,uuid,boolean)
from public, anon;
grant execute on function public.admin_finalize_partner_provisioning(uuid,text,uuid,boolean)
to authenticated;

create or replace function public.current_partner_password_change_required()
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, auth, private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_email text;
begin
  if v_actor is null then
    return false;
  end if;

  select lower(u.email)
    into v_email
  from auth.users u
  where u.id = v_actor;

  return exists (
    select 1
    from private.partner_memberships m
    where m.is_active = true
      and m.must_change_password = true
      and (
        m.user_id = v_actor
        or (
          m.user_id is null
          and lower(m.login_email) = v_email
        )
      )
  );
end;
$$;

revoke all on function public.current_partner_password_change_required()
from public, anon;
grant execute on function public.current_partner_password_change_required()
to authenticated;

create or replace function public.mark_current_partner_password_changed()
returns void
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_email text;
  v_changed integer;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select lower(u.email)
    into v_email
  from auth.users u
  where u.id = v_actor;

  update private.partner_memberships m
  set user_id = coalesce(m.user_id, v_actor),
      must_change_password = false,
      updated_at = now()
  where m.is_active = true
    and (
      m.user_id = v_actor
      or (
        m.user_id is null
        and lower(m.login_email) = v_email
      )
    );

  get diagnostics v_changed = row_count;

  if v_changed = 0 then
    raise exception 'partner access not found for this account';
  end if;

  insert into public.audit_events(actor_user_id, action, metadata)
  values (
    v_actor,
    'partner_temporary_password_replaced',
    jsonb_build_object('memberships_updated', v_changed)
  );
end;
$$;

revoke all on function public.mark_current_partner_password_changed()
from public, anon;
grant execute on function public.mark_current_partner_password_changed()
to authenticated;

-------------------------------------------------------------------------------
-- 2. Optional public Opportunity cover image
-------------------------------------------------------------------------------

alter table public.opportunities
  add column if not exists image_path text;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'opportunity-images',
  'opportunity-images',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "opportunity images partners can upload" on storage.objects;
create policy "opportunity images partners can upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'opportunity-images'
  and array_length(storage.foldername(name), 1) >= 2
  and case
    when (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
      then private.partner_has_access(((storage.foldername(name))[1])::uuid)
    else false
  end
);

drop policy if exists "opportunity images partners can update" on storage.objects;
create policy "opportunity images partners can update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'opportunity-images'
  and array_length(storage.foldername(name), 1) >= 2
  and case
    when (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
      then private.partner_has_access(((storage.foldername(name))[1])::uuid)
    else false
  end
)
with check (
  bucket_id = 'opportunity-images'
  and array_length(storage.foldername(name), 1) >= 2
  and case
    when (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
      then private.partner_has_access(((storage.foldername(name))[1])::uuid)
    else false
  end
);

drop policy if exists "opportunity images partners can delete" on storage.objects;
create policy "opportunity images partners can delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'opportunity-images'
  and array_length(storage.foldername(name), 1) >= 2
  and case
    when (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
      then private.partner_has_access(((storage.foldername(name))[1])::uuid)
    else false
  end
);

create or replace function private.partner_set_opportunity_image_impl(
  p_opportunity_id uuid,
  p_image_path text
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_partner_id uuid;
  v_old_path text;
  v_new_path text := nullif(btrim(coalesce(p_image_path,'')), '');
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select o.partner_organisation_id, o.image_path
    into v_partner_id, v_old_path
  from public.opportunities o
  where o.id = p_opportunity_id
  for update;

  if v_partner_id is null then
    raise exception 'opportunity not found';
  end if;

  if not private.partner_has_access(v_partner_id) then
    raise exception 'partner access required';
  end if;

  if v_new_path is not null
     and v_new_path !~ (
       '^' || v_partner_id::text || '/' || p_opportunity_id::text ||
       '/[0-9a-f-]+[.](png|jpg|webp)$'
     ) then
    raise exception 'invalid opportunity image path';
  end if;

  update public.opportunities
  set image_path = v_new_path,
      updated_by = v_actor,
      updated_at = now()
  where id = p_opportunity_id;

  insert into public.audit_events(actor_user_id, action, metadata)
  values (
    v_actor,
    case when v_new_path is null
      then 'opportunity_image_removed'
      else 'opportunity_image_updated'
    end,
    jsonb_build_object(
      'opportunity_id', p_opportunity_id,
      'partner_organisation_id', v_partner_id,
      'old_image_path', v_old_path,
      'new_image_path', v_new_path
    )
  );

  return v_old_path;
end;
$$;

revoke all on function private.partner_set_opportunity_image_impl(uuid,text)
from public, anon, authenticated;

create or replace function public.partner_set_opportunity_image(
  p_opportunity_id uuid,
  p_image_path text
)
returns text
language sql
security definer
set search_path = pg_catalog, private
as $$
  select private.partner_set_opportunity_image_impl(
    p_opportunity_id,
    p_image_path
  );
$$;

revoke all on function public.partner_set_opportunity_image(uuid,text)
from public, anon;
grant execute on function public.partner_set_opportunity_image(uuid,text)
to authenticated;

-------------------------------------------------------------------------------
-- 3. Opportunity read models include image + organisation logo
-------------------------------------------------------------------------------

drop function if exists public.partner_opportunities();

create function public.partner_opportunities()
returns table(
  id uuid,
  partner_organisation_id uuid,
  partner_name text,
  partner_country_code text,
  partner_role text,
  partner_logo_path text,
  title text,
  summary text,
  opportunity_type text,
  content_language text,
  target_entity text,
  location_mode text,
  location_country_code text,
  location_city text,
  eligibility_scope text,
  eligible_countries text[],
  starts_on date,
  ends_on date,
  deadline_date date,
  external_apply_url text,
  public_contact_name text,
  public_contact_email text,
  allow_interest boolean,
  is_published boolean,
  image_path text,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = pg_catalog, auth, public, private
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'authentication required';
  end if;

  return query
  select
    o.id,
    o.partner_organisation_id,
    coalesce(po.short_name_en, po.legal_name_en),
    po.country_code,
    po.partner_role,
    po.logo_path,
    o.title,
    o.summary,
    o.opportunity_type,
    o.content_language,
    o.target_entity,
    o.location_mode,
    o.location_country_code,
    o.location_city,
    o.eligibility_scope,
    coalesce(
      array_agg(ec.country_code order by ec.country_code)
        filter (where ec.country_code is not null),
      '{}'::text[]
    ),
    o.starts_on,
    o.ends_on,
    o.deadline_date,
    o.external_apply_url,
    o.public_contact_name,
    o.public_contact_email,
    o.allow_interest,
    o.is_published,
    o.image_path,
    o.updated_at
  from public.opportunities o
  join public.partner_organisations po on po.id = o.partner_organisation_id
  left join public.opportunity_eligibility_countries ec on ec.opportunity_id = o.id
  where private.partner_has_access(o.partner_organisation_id)
  group by o.id, po.id
  order by o.updated_at desc;
end;
$$;

revoke all on function public.partner_opportunities()
from public, anon;
grant execute on function public.partner_opportunities()
to authenticated;

drop function if exists public.public_opportunities(text,text);

create function public.public_opportunities(
  p_country_code text default null,
  p_opportunity_type text default null
)
returns table(
  id uuid,
  partner_organisation_id uuid,
  partner_name text,
  partner_country_code text,
  partner_role text,
  partner_logo_path text,
  title text,
  summary text,
  opportunity_type text,
  content_language text,
  target_entity text,
  location_mode text,
  location_country_code text,
  location_city text,
  eligibility_scope text,
  eligible_countries text[],
  starts_on date,
  ends_on date,
  deadline_date date,
  external_apply_url text,
  public_contact_name text,
  public_contact_email text,
  allow_interest boolean,
  image_path text,
  published_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    o.id,
    o.partner_organisation_id,
    coalesce(po.short_name_en, po.legal_name_en),
    po.country_code,
    po.partner_role,
    po.logo_path,
    o.title,
    o.summary,
    o.opportunity_type,
    o.content_language,
    o.target_entity,
    o.location_mode,
    o.location_country_code,
    o.location_city,
    o.eligibility_scope,
    coalesce(
      array_agg(ec.country_code order by ec.country_code)
        filter (where ec.country_code is not null),
      '{}'::text[]
    ),
    o.starts_on,
    o.ends_on,
    o.deadline_date,
    o.external_apply_url,
    o.public_contact_name,
    o.public_contact_email,
    o.allow_interest,
    o.image_path,
    o.published_at
  from public.opportunities o
  join public.partner_organisations po on po.id = o.partner_organisation_id
  left join public.opportunity_eligibility_countries ec on ec.opportunity_id = o.id
  where o.is_published = true
    and po.status = 'confirmed'
    and po.is_public = true
    and (o.deadline_date is null or o.deadline_date >= current_date)
    and (
      p_opportunity_type is null
      or btrim(p_opportunity_type) = ''
      or o.opportunity_type = p_opportunity_type
    )
    and (
      p_country_code is null
      or btrim(p_country_code) = ''
      or o.eligibility_scope in ('all_europe','international')
      or (
        o.eligibility_scope = 'partner_country'
        and po.country_code = upper(btrim(p_country_code))
      )
      or (
        o.eligibility_scope = 'selected_countries'
        and exists (
          select 1
          from public.opportunity_eligibility_countries match_country
          where match_country.opportunity_id = o.id
            and match_country.country_code = upper(btrim(p_country_code))
        )
      )
    )
  group by o.id, po.id
  order by
    o.deadline_date nulls last,
    o.published_at desc nulls last,
    o.created_at desc;
$$;

revoke all on function public.public_opportunities(text,text)
from public;
grant execute on function public.public_opportunities(text,text)
to anon, authenticated;

create or replace function public.public_opportunity(p_opportunity_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select to_jsonb(x)
  from (
    select
      o.id,
      o.partner_organisation_id,
      coalesce(po.short_name_en, po.legal_name_en) as partner_name,
      po.country_code as partner_country_code,
      po.partner_role,
      po.logo_path as partner_logo_path,
      po.website_url as partner_website_url,
      o.title,
      o.summary,
      o.opportunity_type,
      o.content_language,
      o.target_entity,
      o.location_mode,
      o.location_country_code,
      o.location_city,
      o.eligibility_scope,
      coalesce(
        array_agg(ec.country_code order by ec.country_code)
          filter (where ec.country_code is not null),
        '{}'::text[]
      ) as eligible_countries,
      o.starts_on,
      o.ends_on,
      o.deadline_date,
      o.external_apply_url,
      o.public_contact_name,
      o.public_contact_email,
      o.allow_interest,
      o.image_path,
      o.published_at
    from public.opportunities o
    join public.partner_organisations po on po.id = o.partner_organisation_id
    left join public.opportunity_eligibility_countries ec on ec.opportunity_id = o.id
    where o.id = p_opportunity_id
      and o.is_published = true
      and po.status = 'confirmed'
      and po.is_public = true
    group by o.id, po.id
  ) x;
$$;

revoke all on function public.public_opportunity(uuid)
from public;
grant execute on function public.public_opportunity(uuid)
to anon, authenticated;
