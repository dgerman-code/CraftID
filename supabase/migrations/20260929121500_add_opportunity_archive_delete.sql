-- Opportunity lifecycle controls for partner organisations.
-- Archive is reversible and always removes the item from the public directory.
-- Permanent deletion is allowed only before any CraftID interest request exists.

alter table public.opportunities
  add column if not exists archived_at timestamptz;

alter table public.opportunities
  drop constraint if exists opportunities_archived_not_published;

alter table public.opportunities
  add constraint opportunities_archived_not_published
  check (archived_at is null or is_published = false);

create index if not exists opportunities_partner_archive_idx
on public.opportunities(partner_organisation_id, archived_at, updated_at desc);

create or replace function private.partner_set_opportunity_archived_impl(
  p_opportunity_id uuid,
  p_archived boolean
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_partner_id uuid;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select o.partner_organisation_id
    into v_partner_id
  from public.opportunities o
  where o.id = p_opportunity_id
  for update;

  if v_partner_id is null then
    raise exception 'opportunity not found';
  end if;

  if not private.partner_has_access(v_partner_id) then
    raise exception 'partner access required';
  end if;

  update public.opportunities
  set archived_at = case when coalesce(p_archived,false) then now() else null end,
      is_published = case when coalesce(p_archived,false) then false else is_published end,
      published_at = case when coalesce(p_archived,false) then null else published_at end,
      updated_by = v_actor,
      updated_at = now()
  where id = p_opportunity_id;

  insert into public.audit_events(actor_user_id, action, metadata)
  values (
    v_actor,
    case when coalesce(p_archived,false)
      then 'partner_opportunity_archived'
      else 'partner_opportunity_restored'
    end,
    jsonb_build_object(
      'opportunity_id', p_opportunity_id,
      'partner_organisation_id', v_partner_id
    )
  );
end;
$$;

revoke all on function private.partner_set_opportunity_archived_impl(uuid,boolean)
from public, anon, authenticated;

create or replace function public.partner_set_opportunity_archived(
  p_opportunity_id uuid,
  p_archived boolean
)
returns void
language sql
security definer
set search_path = pg_catalog, private
as $$
  select private.partner_set_opportunity_archived_impl(
    p_opportunity_id,
    p_archived
  );
$$;

revoke all on function public.partner_set_opportunity_archived(uuid,boolean)
from public, anon;
grant execute on function public.partner_set_opportunity_archived(uuid,boolean)
to authenticated;

create or replace function private.partner_delete_opportunity_impl(
  p_opportunity_id uuid
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_partner_id uuid;
  v_title text;
  v_image_path text;
  v_interest_count bigint;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select
    o.partner_organisation_id,
    o.title,
    o.image_path
  into
    v_partner_id,
    v_title,
    v_image_path
  from public.opportunities o
  where o.id = p_opportunity_id
  for update;

  if v_partner_id is null then
    raise exception 'opportunity not found';
  end if;

  if not private.partner_has_access(v_partner_id) then
    raise exception 'partner access required';
  end if;

  select count(*)
    into v_interest_count
  from public.opportunity_interest_requests r
  where r.opportunity_id = p_opportunity_id;

  if v_interest_count > 0 then
    raise exception
      'This opportunity has % interest request(s) and cannot be deleted. Archive it instead.',
      v_interest_count;
  end if;

  insert into public.audit_events(actor_user_id, action, metadata)
  values (
    v_actor,
    'partner_opportunity_deleted',
    jsonb_build_object(
      'opportunity_id', p_opportunity_id,
      'partner_organisation_id', v_partner_id,
      'title', v_title,
      'image_path', v_image_path
    )
  );

  delete from public.opportunities
  where id = p_opportunity_id;

  return v_image_path;
end;
$$;

revoke all on function private.partner_delete_opportunity_impl(uuid)
from public, anon, authenticated;

create or replace function public.partner_delete_opportunity(
  p_opportunity_id uuid
)
returns text
language sql
security definer
set search_path = pg_catalog, private
as $$
  select private.partner_delete_opportunity_impl(p_opportunity_id);
$$;

revoke all on function public.partner_delete_opportunity(uuid)
from public, anon;
grant execute on function public.partner_delete_opportunity(uuid)
to authenticated;

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
  archived_at timestamptz,
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
    o.archived_at,
    o.updated_at
  from public.opportunities o
  join public.partner_organisations po on po.id = o.partner_organisation_id
  left join public.opportunity_eligibility_countries ec on ec.opportunity_id = o.id
  where private.partner_has_access(o.partner_organisation_id)
  group by o.id, po.id
  order by
    (o.archived_at is not null),
    o.updated_at desc;
end;
$$;

revoke all on function public.partner_opportunities()
from public, anon;
grant execute on function public.partner_opportunities()
to authenticated;

create or replace function public.public_opportunities(
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
    and o.archived_at is null
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
      and o.archived_at is null
      and po.status = 'confirmed'
      and po.is_public = true
    group by o.id, po.id
  ) x;
$$;

revoke all on function public.public_opportunity(uuid)
from public;
grant execute on function public.public_opportunity(uuid)
to anon, authenticated;
