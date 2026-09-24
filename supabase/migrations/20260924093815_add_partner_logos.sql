-- Partner logo support.
-- Logos are public brand assets; only Platform Admins may write them.

alter table public.partner_organisations
  add column if not exists logo_path text;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'partner-logos',
  'partner-logos',
  true,
  2097152,
  array['image/jpeg','image/png','image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "partner logos admins can upload" on storage.objects;
create policy "partner logos admins can upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'partner-logos'
  and private.has_staff_role(array['admin'])
);

drop policy if exists "partner logos admins can update" on storage.objects;
create policy "partner logos admins can update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'partner-logos'
  and private.has_staff_role(array['admin'])
)
with check (
  bucket_id = 'partner-logos'
  and private.has_staff_role(array['admin'])
);

drop policy if exists "partner logos admins can delete" on storage.objects;
create policy "partner logos admins can delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'partner-logos'
  and private.has_staff_role(array['admin'])
);

-- Align the save RPC with the simplified pilot partner-role model.
create or replace function private.admin_save_partner_organisation_impl(
  p_id uuid,
  p_legal_name_en text,
  p_legal_name_uk text,
  p_short_name_en text,
  p_short_name_uk text,
  p_country_code text,
  p_partner_role text,
  p_status text,
  p_agreement_status text,
  p_website_url text,
  p_description_en text,
  p_description_uk text,
  p_scope_note text,
  p_is_public boolean,
  p_sort_order integer
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_id uuid;
  v_actor uuid := (select auth.uid());
  v_old jsonb;
  v_country text := upper(btrim(coalesce(p_country_code, '')));
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  if nullif(btrim(coalesce(p_legal_name_en, '')), '') is null then
    raise exception 'English legal name is required';
  end if;

  if v_country !~ '^[A-Z]{2}$' then
    raise exception 'country code must be ISO alpha-2';
  end if;

  if p_partner_role not in ('national_operator','partner') then
    raise exception 'invalid partner role';
  end if;

  if p_status not in ('invited','in_discussion','confirmed','inactive') then
    raise exception 'invalid partner status';
  end if;

  if p_agreement_status not in ('none','draft','mandate_on_file','agreement_signed') then
    raise exception 'invalid agreement status';
  end if;

  if coalesce(p_is_public,false) and p_status <> 'confirmed' then
    raise exception 'only confirmed partners may be public';
  end if;

  if nullif(btrim(coalesce(p_website_url,'')), '') is not null
     and btrim(p_website_url) !~ '^https?://' then
    raise exception 'website URL must start with http:// or https://';
  end if;

  if p_id is null then
    insert into public.partner_organisations(
      legal_name_en, legal_name_uk, short_name_en, short_name_uk,
      country_code, partner_role, status, agreement_status, website_url,
      description_en, description_uk, scope_note, is_public, sort_order,
      created_by, updated_by
    )
    values (
      btrim(p_legal_name_en),
      nullif(btrim(coalesce(p_legal_name_uk,'')), ''),
      nullif(btrim(coalesce(p_short_name_en,'')), ''),
      nullif(btrim(coalesce(p_short_name_uk,'')), ''),
      v_country, p_partner_role, p_status, p_agreement_status,
      nullif(btrim(coalesce(p_website_url,'')), ''),
      nullif(btrim(coalesce(p_description_en,'')), ''),
      nullif(btrim(coalesce(p_description_uk,'')), ''),
      nullif(btrim(coalesce(p_scope_note,'')), ''),
      coalesce(p_is_public,false), coalesce(p_sort_order,0), v_actor, v_actor
    )
    returning id into v_id;

    insert into public.audit_events(actor_user_id, action, metadata)
    values (
      v_actor,
      'partner_organisation_created',
      jsonb_build_object(
        'partner_organisation_id', v_id,
        'legal_name_en', btrim(p_legal_name_en),
        'partner_role', p_partner_role,
        'status', p_status,
        'agreement_status', p_agreement_status
      )
    );
  else
    select to_jsonb(po) into v_old
    from public.partner_organisations po
    where po.id = p_id
    for update;

    if v_old is null then
      raise exception 'partner organisation not found';
    end if;

    update public.partner_organisations
    set legal_name_en = btrim(p_legal_name_en),
        legal_name_uk = nullif(btrim(coalesce(p_legal_name_uk,'')), ''),
        short_name_en = nullif(btrim(coalesce(p_short_name_en,'')), ''),
        short_name_uk = nullif(btrim(coalesce(p_short_name_uk,'')), ''),
        country_code = v_country,
        partner_role = p_partner_role,
        status = p_status,
        agreement_status = p_agreement_status,
        website_url = nullif(btrim(coalesce(p_website_url,'')), ''),
        description_en = nullif(btrim(coalesce(p_description_en,'')), ''),
        description_uk = nullif(btrim(coalesce(p_description_uk,'')), ''),
        scope_note = nullif(btrim(coalesce(p_scope_note,'')), ''),
        is_public = coalesce(p_is_public,false),
        sort_order = coalesce(p_sort_order,0),
        updated_by = v_actor,
        updated_at = now()
    where id = p_id;

    v_id := p_id;

    insert into public.audit_events(actor_user_id, action, metadata)
    values (
      v_actor,
      'partner_organisation_updated',
      jsonb_build_object(
        'partner_organisation_id', v_id,
        'old_status', v_old->>'status',
        'new_status', p_status,
        'old_role', v_old->>'partner_role',
        'new_role', p_partner_role,
        'agreement_status', p_agreement_status
      )
    );
  end if;

  return v_id;
end;
$$;

create or replace function private.admin_set_partner_logo_impl(
  p_partner_id uuid,
  p_logo_path text
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_old_path text;
  v_new_path text := nullif(btrim(coalesce(p_logo_path,'')), '');
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  if not exists (
    select 1 from public.partner_organisations po where po.id = p_partner_id
  ) then
    raise exception 'partner organisation not found';
  end if;

  if v_new_path is not null
     and v_new_path !~ ('^' || p_partner_id::text || '/[0-9a-f-]+\\.(png|jpg|webp)$') then
    raise exception 'invalid partner logo path';
  end if;

  select po.logo_path into v_old_path
  from public.partner_organisations po
  where po.id = p_partner_id
  for update;

  update public.partner_organisations
  set logo_path = v_new_path,
      updated_by = v_actor,
      updated_at = now()
  where id = p_partner_id;

  insert into public.audit_events(actor_user_id, action, metadata)
  values (
    v_actor,
    case when v_new_path is null then 'partner_logo_removed' else 'partner_logo_updated' end,
    jsonb_build_object(
      'partner_organisation_id', p_partner_id,
      'old_logo_path', v_old_path,
      'new_logo_path', v_new_path
    )
  );

  return v_old_path;
end;
$$;

revoke all on function private.admin_set_partner_logo_impl(uuid,text)
from public, anon, authenticated;
grant execute on function private.admin_set_partner_logo_impl(uuid,text)
to authenticated;

drop function if exists public.admin_set_partner_logo(uuid,text);
create function public.admin_set_partner_logo(
  p_partner_id uuid,
  p_logo_path text
)
returns text
language sql
set search_path = pg_catalog, private
as $$
  select private.admin_set_partner_logo_impl(p_partner_id, p_logo_path);
$$;

revoke all on function public.admin_set_partner_logo(uuid,text) from public;
grant execute on function public.admin_set_partner_logo(uuid,text) to authenticated;

-- Recreate partner list RPCs because their table-return signatures gain logo_path.
drop function if exists public.admin_partner_organisations();
drop function if exists public.public_partner_organisations();
drop function if exists api_internal.admin_partner_organisations();
drop function if exists api_internal.public_partner_organisations();

create function api_internal.admin_partner_organisations()
returns table(
  id uuid,
  legal_name_en text,
  legal_name_uk text,
  short_name_en text,
  short_name_uk text,
  country_code text,
  partner_role text,
  status text,
  agreement_status text,
  website_url text,
  description_en text,
  description_uk text,
  scope_note text,
  is_public boolean,
  sort_order integer,
  logo_path text,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public, private
as $$
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  return query
  select
    po.id, po.legal_name_en, po.legal_name_uk, po.short_name_en, po.short_name_uk,
    po.country_code, po.partner_role, po.status, po.agreement_status, po.website_url,
    po.description_en, po.description_uk, po.scope_note, po.is_public, po.sort_order,
    po.logo_path, po.updated_at
  from public.partner_organisations po
  order by po.sort_order, po.legal_name_en;
end;
$$;

create function api_internal.public_partner_organisations()
returns table(
  id uuid,
  legal_name_en text,
  legal_name_uk text,
  short_name_en text,
  short_name_uk text,
  country_code text,
  partner_role text,
  website_url text,
  description_en text,
  description_uk text,
  sort_order integer,
  logo_path text
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    po.id, po.legal_name_en, po.legal_name_uk, po.short_name_en, po.short_name_uk,
    po.country_code, po.partner_role, po.website_url, po.description_en,
    po.description_uk, po.sort_order, po.logo_path
  from public.partner_organisations po
  where po.is_public = true
    and po.status = 'confirmed'
  order by po.sort_order, po.legal_name_en;
$$;

revoke all on function api_internal.admin_partner_organisations()
from public, anon, authenticated;
revoke all on function api_internal.public_partner_organisations()
from public, anon, authenticated;

create function public.admin_partner_organisations()
returns table(
  id uuid,
  legal_name_en text,
  legal_name_uk text,
  short_name_en text,
  short_name_uk text,
  country_code text,
  partner_role text,
  status text,
  agreement_status text,
  website_url text,
  description_en text,
  description_uk text,
  scope_note text,
  is_public boolean,
  sort_order integer,
  logo_path text,
  updated_at timestamptz
)
language sql
stable
set search_path = pg_catalog, api_internal
as $$
  select * from api_internal.admin_partner_organisations();
$$;

create function public.public_partner_organisations()
returns table(
  id uuid,
  legal_name_en text,
  legal_name_uk text,
  short_name_en text,
  short_name_uk text,
  country_code text,
  partner_role text,
  website_url text,
  description_en text,
  description_uk text,
  sort_order integer,
  logo_path text
)
language sql
stable
set search_path = pg_catalog, api_internal
as $$
  select * from api_internal.public_partner_organisations();
$$;

revoke all on function public.admin_partner_organisations() from public;
grant execute on function public.admin_partner_organisations() to authenticated;

revoke all on function public.public_partner_organisations() from public;
grant execute on function public.public_partner_organisations() to anon, authenticated;
