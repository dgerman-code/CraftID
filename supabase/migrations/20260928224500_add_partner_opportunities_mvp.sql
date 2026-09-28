-- Partner opportunities MVP
-- Simple country roles, private admin contact cards, partner portal access,
-- multi-country opportunity eligibility and controlled CraftID interest requests.
--
-- Partner relationship lifecycle CRM states are intentionally not used by the
-- new UI. Existing status columns remain for backward compatibility, while
-- assigned organisations are stored as confirmed.

-------------------------------------------------------------------------------
-- 1. Private admin contact card and partner portal access
-------------------------------------------------------------------------------

create table if not exists private.partner_admin_contacts (
  partner_organisation_id uuid primary key
    references public.partner_organisations(id) on delete cascade,
  contact_name text,
  contact_title text,
  contact_email text,
  contact_phone text,
  internal_note text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

revoke all on table private.partner_admin_contacts
from public, anon, authenticated;

create table if not exists private.partner_memberships (
  id uuid primary key default gen_random_uuid(),
  partner_organisation_id uuid not null
    references public.partner_organisations(id) on delete cascade,
  login_email text not null,
  user_id uuid references auth.users(id) on delete set null,
  access_role text not null default 'editor'
    check (access_role in ('editor')),
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(partner_organisation_id, login_email)
);

create index if not exists partner_memberships_user_idx
on private.partner_memberships(user_id)
where user_id is not null and is_active = true;

create index if not exists partner_memberships_email_idx
on private.partner_memberships(lower(login_email))
where is_active = true;

revoke all on table private.partner_memberships
from public, anon, authenticated;

create or replace function private.partner_has_access(p_partner_organisation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, auth, public, private
as $$
  select
    private.has_staff_role(array['admin'])
    or exists (
      select 1
      from private.partner_memberships m
      join auth.users u on u.id = (select auth.uid())
      where m.partner_organisation_id = p_partner_organisation_id
        and m.is_active = true
        and (
          m.user_id = u.id
          or (
            m.user_id is null
            and u.email_confirmed_at is not null
            and lower(m.login_email) = lower(coalesce(u.email,''))
          )
        )
    );
$$;

revoke all on function private.partner_has_access(uuid)
from public, anon, authenticated;

create or replace function public.current_partner_organisations()
returns table(
  id uuid,
  legal_name_en text,
  legal_name_uk text,
  short_name_en text,
  short_name_uk text,
  country_code text,
  partner_role text,
  website_url text,
  logo_path text
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
  select distinct
    po.id,
    po.legal_name_en,
    po.legal_name_uk,
    po.short_name_en,
    po.short_name_uk,
    po.country_code,
    po.partner_role,
    po.website_url,
    po.logo_path
  from public.partner_organisations po
  where po.status = 'confirmed'
    and private.partner_has_access(po.id)
  order by po.country_code, po.legal_name_en;
end;
$$;

revoke all on function public.current_partner_organisations()
from public, anon;
grant execute on function public.current_partner_organisations()
to authenticated;

create or replace function public.admin_save_partner_contact_card(
  p_partner_organisation_id uuid,
  p_contact_name text,
  p_contact_title text,
  p_contact_email text,
  p_contact_phone text,
  p_internal_note text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_email text := nullif(lower(btrim(coalesce(p_contact_email,''))), '');
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  if not exists (
    select 1 from public.partner_organisations po
    where po.id = p_partner_organisation_id
  ) then
    raise exception 'partner organisation not found';
  end if;

  if v_email is not null
     and v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'invalid contact email';
  end if;

  insert into private.partner_admin_contacts(
    partner_organisation_id,
    contact_name,
    contact_title,
    contact_email,
    contact_phone,
    internal_note,
    updated_by,
    updated_at
  )
  values (
    p_partner_organisation_id,
    nullif(btrim(coalesce(p_contact_name,'')), ''),
    nullif(btrim(coalesce(p_contact_title,'')), ''),
    v_email,
    nullif(btrim(coalesce(p_contact_phone,'')), ''),
    nullif(btrim(coalesce(p_internal_note,'')), ''),
    v_actor,
    now()
  )
  on conflict (partner_organisation_id) do update
  set contact_name = excluded.contact_name,
      contact_title = excluded.contact_title,
      contact_email = excluded.contact_email,
      contact_phone = excluded.contact_phone,
      internal_note = excluded.internal_note,
      updated_by = v_actor,
      updated_at = now();

  insert into public.audit_events(actor_user_id, action, metadata)
  values (
    v_actor,
    'partner_admin_contact_updated',
    jsonb_build_object('partner_organisation_id', p_partner_organisation_id)
  );
end;
$$;

revoke all on function public.admin_save_partner_contact_card(uuid,text,text,text,text,text)
from public, anon;
grant execute on function public.admin_save_partner_contact_card(uuid,text,text,text,text,text)
to authenticated;

create or replace function public.admin_save_partner_membership(
  p_partner_organisation_id uuid,
  p_login_email text,
  p_is_active boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_email text := lower(btrim(coalesce(p_login_email,'')));
  v_user_id uuid;
  v_id uuid;
begin
  if not private.has_staff_role(array['admin']) then
    raise exception 'admin role required';
  end if;

  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'valid portal login email is required';
  end if;

  if not exists (
    select 1 from public.partner_organisations po
    where po.id = p_partner_organisation_id
  ) then
    raise exception 'partner organisation not found';
  end if;

  select u.id into v_user_id
  from auth.users u
  where lower(coalesce(u.email,'')) = v_email
  order by u.created_at asc
  limit 1;

  insert into private.partner_memberships(
    partner_organisation_id,
    login_email,
    user_id,
    access_role,
    is_active,
    created_by,
    updated_at
  )
  values (
    p_partner_organisation_id,
    v_email,
    v_user_id,
    'editor',
    coalesce(p_is_active,true),
    v_actor,
    now()
  )
  on conflict (partner_organisation_id, login_email) do update
  set user_id = coalesce(excluded.user_id, private.partner_memberships.user_id),
      is_active = excluded.is_active,
      updated_at = now()
  returning id into v_id;

  insert into public.audit_events(actor_user_id, action, metadata)
  values (
    v_actor,
    'partner_portal_access_updated',
    jsonb_build_object(
      'partner_organisation_id', p_partner_organisation_id,
      'membership_id', v_id,
      'login_email', v_email,
      'active', coalesce(p_is_active,true),
      'bound_to_user', v_user_id is not null
    )
  );

  return v_id;
end;
$$;

revoke all on function public.admin_save_partner_membership(uuid,text,boolean)
from public, anon;
grant execute on function public.admin_save_partner_membership(uuid,text,boolean)
to authenticated;

create or replace function public.admin_partner_private_details()
returns table(
  partner_organisation_id uuid,
  contact_name text,
  contact_title text,
  contact_email text,
  contact_phone text,
  internal_note text,
  portal_emails text[]
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
    po.id,
    c.contact_name,
    c.contact_title,
    c.contact_email,
    c.contact_phone,
    c.internal_note,
    coalesce(
      array_agg(m.login_email order by m.login_email)
        filter (where m.is_active = true),
      '{}'::text[]
    )
  from public.partner_organisations po
  left join private.partner_admin_contacts c
    on c.partner_organisation_id = po.id
  left join private.partner_memberships m
    on m.partner_organisation_id = po.id
  group by
    po.id,
    c.contact_name,
    c.contact_title,
    c.contact_email,
    c.contact_phone,
    c.internal_note
  order by po.country_code, po.legal_name_en;
end;
$$;

revoke all on function public.admin_partner_private_details()
from public, anon;
grant execute on function public.admin_partner_private_details()
to authenticated;

-------------------------------------------------------------------------------
-- 2. Partner-created opportunities
-------------------------------------------------------------------------------

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  partner_organisation_id uuid not null
    references public.partner_organisations(id) on delete cascade,
  title text not null,
  summary text not null,
  opportunity_type text not null check (
    opportunity_type in (
      'grant','open_call','training','fair','exhibition','residency',
      'exchange','competition','certification_support','export_support',
      'business_support','event','other'
    )
  ),
  content_language text not null default 'en'
    check (content_language ~ '^[a-z]{2}$'),
  target_entity text not null default 'both'
    check (target_entity in ('professional','workshop','both')),
  location_mode text not null default 'online'
    check (location_mode in ('onsite','online','hybrid')),
  location_country_code text,
  location_city text,
  eligibility_scope text not null default 'partner_country'
    check (
      eligibility_scope in (
        'partner_country','selected_countries','all_europe','international'
      )
    ),
  starts_on date,
  ends_on date,
  deadline_date date,
  external_apply_url text,
  public_contact_name text,
  public_contact_email text,
  allow_interest boolean not null default true,
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    location_country_code is null
    or (location_country_code = upper(location_country_code)
        and char_length(location_country_code) = 2)
  ),
  check (external_apply_url is null or external_apply_url ~ '^https?://'),
  check (
    public_contact_email is null
    or public_contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  )
);

create index if not exists opportunities_partner_idx
on public.opportunities(partner_organisation_id, updated_at desc);

create index if not exists opportunities_public_idx
on public.opportunities(is_published, deadline_date, updated_at desc);

create table if not exists public.opportunity_eligibility_countries (
  opportunity_id uuid not null
    references public.opportunities(id) on delete cascade,
  country_code text not null
    check (country_code = upper(country_code) and char_length(country_code) = 2),
  primary key(opportunity_id, country_code)
);

alter table public.opportunities enable row level security;
alter table public.opportunity_eligibility_countries enable row level security;

revoke all on public.opportunities from anon, authenticated;
revoke all on public.opportunity_eligibility_countries from anon, authenticated;
grant all on public.opportunities to service_role;
grant all on public.opportunity_eligibility_countries to service_role;

create or replace function private.partner_save_opportunity_impl(
  p_id uuid,
  p_partner_organisation_id uuid,
  p_title text,
  p_summary text,
  p_opportunity_type text,
  p_content_language text,
  p_target_entity text,
  p_location_mode text,
  p_location_country_code text,
  p_location_city text,
  p_eligibility_scope text,
  p_eligible_countries text[],
  p_starts_on date,
  p_ends_on date,
  p_deadline_date date,
  p_external_apply_url text,
  p_public_contact_name text,
  p_public_contact_email text,
  p_allow_interest boolean,
  p_is_published boolean
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_id uuid;
  v_country text := nullif(upper(btrim(coalesce(p_location_country_code,''))), '');
  v_email text := nullif(lower(btrim(coalesce(p_public_contact_email,''))), '');
  v_url text := nullif(btrim(coalesce(p_external_apply_url,'')), '');
  v_eligible text[];
  v_old_published boolean;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if not private.partner_has_access(p_partner_organisation_id) then
    raise exception 'partner access required';
  end if;

  if not exists (
    select 1 from public.partner_organisations po
    where po.id = p_partner_organisation_id
      and po.status = 'confirmed'
  ) then
    raise exception 'assigned partner organisation not found';
  end if;

  if length(btrim(coalesce(p_title,''))) < 3 then
    raise exception 'title is required';
  end if;

  if length(btrim(coalesce(p_summary,''))) < 10 then
    raise exception 'short description is required';
  end if;

  if p_opportunity_type not in (
    'grant','open_call','training','fair','exhibition','residency',
    'exchange','competition','certification_support','export_support',
    'business_support','event','other'
  ) then
    raise exception 'invalid opportunity type';
  end if;

  if p_target_entity not in ('professional','workshop','both') then
    raise exception 'invalid target entity';
  end if;

  if p_location_mode not in ('onsite','online','hybrid') then
    raise exception 'invalid location mode';
  end if;

  if p_eligibility_scope not in (
    'partner_country','selected_countries','all_europe','international'
  ) then
    raise exception 'invalid eligibility scope';
  end if;

  if p_content_language !~ '^[a-z]{2}$' then
    raise exception 'content language must be a two-letter code';
  end if;

  if v_country is not null and v_country !~ '^[A-Z]{2}$' then
    raise exception 'location country must be ISO alpha-2';
  end if;

  if p_location_mode in ('onsite','hybrid') and v_country is null then
    raise exception 'country is required for onsite or hybrid opportunities';
  end if;

  if v_url is not null and v_url !~ '^https?://' then
    raise exception 'application URL must start with http:// or https://';
  end if;

  if v_email is not null
     and v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'invalid public contact email';
  end if;

  if v_url is null and v_email is null and not coalesce(p_allow_interest,false) then
    raise exception 'enable at least one contact method: apply URL, contact email or CraftID interest';
  end if;

  if p_starts_on is not null
     and p_ends_on is not null
     and p_ends_on < p_starts_on then
    raise exception 'end date cannot be before start date';
  end if;

  select coalesce(array_agg(distinct upper(btrim(x))) filter (
    where upper(btrim(x)) ~ '^[A-Z]{2}$'
  ), '{}'::text[])
  into v_eligible
  from unnest(coalesce(p_eligible_countries, '{}'::text[])) x;

  if p_eligibility_scope = 'selected_countries'
     and cardinality(v_eligible) = 0 then
    raise exception 'select at least one eligible country';
  end if;

  if p_id is null then
    insert into public.opportunities(
      partner_organisation_id,
      title,
      summary,
      opportunity_type,
      content_language,
      target_entity,
      location_mode,
      location_country_code,
      location_city,
      eligibility_scope,
      starts_on,
      ends_on,
      deadline_date,
      external_apply_url,
      public_contact_name,
      public_contact_email,
      allow_interest,
      is_published,
      published_at,
      created_by,
      updated_by
    )
    values (
      p_partner_organisation_id,
      btrim(p_title),
      btrim(p_summary),
      p_opportunity_type,
      lower(p_content_language),
      p_target_entity,
      p_location_mode,
      v_country,
      nullif(btrim(coalesce(p_location_city,'')), ''),
      p_eligibility_scope,
      p_starts_on,
      p_ends_on,
      p_deadline_date,
      v_url,
      nullif(btrim(coalesce(p_public_contact_name,'')), ''),
      v_email,
      coalesce(p_allow_interest,false),
      coalesce(p_is_published,false),
      case when coalesce(p_is_published,false) then now() else null end,
      v_actor,
      v_actor
    )
    returning id into v_id;
  else
    select o.is_published
      into v_old_published
    from public.opportunities o
    where o.id = p_id
      and o.partner_organisation_id = p_partner_organisation_id
    for update;

    if not found then
      raise exception 'opportunity not found for this partner';
    end if;

    update public.opportunities
    set title = btrim(p_title),
        summary = btrim(p_summary),
        opportunity_type = p_opportunity_type,
        content_language = lower(p_content_language),
        target_entity = p_target_entity,
        location_mode = p_location_mode,
        location_country_code = v_country,
        location_city = nullif(btrim(coalesce(p_location_city,'')), ''),
        eligibility_scope = p_eligibility_scope,
        starts_on = p_starts_on,
        ends_on = p_ends_on,
        deadline_date = p_deadline_date,
        external_apply_url = v_url,
        public_contact_name = nullif(btrim(coalesce(p_public_contact_name,'')), ''),
        public_contact_email = v_email,
        allow_interest = coalesce(p_allow_interest,false),
        is_published = coalesce(p_is_published,false),
        published_at = case
          when coalesce(p_is_published,false) and not coalesce(v_old_published,false)
            then now()
          when coalesce(p_is_published,false)
            then published_at
          else null
        end,
        updated_by = v_actor,
        updated_at = now()
    where id = p_id;

    v_id := p_id;
  end if;

  delete from public.opportunity_eligibility_countries
  where opportunity_id = v_id;

  if p_eligibility_scope = 'selected_countries' then
    insert into public.opportunity_eligibility_countries(opportunity_id, country_code)
    select v_id, x
    from unnest(v_eligible) x
    on conflict do nothing;
  end if;

  insert into public.audit_events(actor_user_id, action, metadata)
  values (
    v_actor,
    case when p_id is null then 'partner_opportunity_created' else 'partner_opportunity_updated' end,
    jsonb_build_object(
      'opportunity_id', v_id,
      'partner_organisation_id', p_partner_organisation_id,
      'published', coalesce(p_is_published,false),
      'eligibility_scope', p_eligibility_scope,
      'eligible_countries', v_eligible
    )
  );

  return v_id;
end;
$$;

revoke all on function private.partner_save_opportunity_impl(
  uuid,uuid,text,text,text,text,text,text,text,text,text,text[],date,date,date,text,text,text,boolean,boolean
) from public, anon, authenticated;

create or replace function public.partner_save_opportunity(
  p_id uuid,
  p_partner_organisation_id uuid,
  p_title text,
  p_summary text,
  p_opportunity_type text,
  p_content_language text,
  p_target_entity text,
  p_location_mode text,
  p_location_country_code text,
  p_location_city text,
  p_eligibility_scope text,
  p_eligible_countries text[],
  p_starts_on date,
  p_ends_on date,
  p_deadline_date date,
  p_external_apply_url text,
  p_public_contact_name text,
  p_public_contact_email text,
  p_allow_interest boolean,
  p_is_published boolean
)
returns uuid
language sql
security invoker
set search_path = pg_catalog, private
as $$
  select private.partner_save_opportunity_impl(
    p_id,
    p_partner_organisation_id,
    p_title,
    p_summary,
    p_opportunity_type,
    p_content_language,
    p_target_entity,
    p_location_mode,
    p_location_country_code,
    p_location_city,
    p_eligibility_scope,
    p_eligible_countries,
    p_starts_on,
    p_ends_on,
    p_deadline_date,
    p_external_apply_url,
    p_public_contact_name,
    p_public_contact_email,
    p_allow_interest,
    p_is_published
  );
$$;

revoke all on function public.partner_save_opportunity(
  uuid,uuid,text,text,text,text,text,text,text,text,text,text[],date,date,date,text,text,text,boolean,boolean
) from public, anon;
grant execute on function public.partner_save_opportunity(
  uuid,uuid,text,text,text,text,text,text,text,text,text,text[],date,date,date,text,text,text,boolean,boolean
) to authenticated;

create or replace function public.partner_opportunities()
returns table(
  id uuid,
  partner_organisation_id uuid,
  partner_name text,
  partner_country_code text,
  partner_role text,
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

-------------------------------------------------------------------------------
-- 3. Controlled interest requests and partner responses
-------------------------------------------------------------------------------

create table if not exists public.opportunity_interest_requests (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null
    references public.opportunities(id) on delete cascade,
  entity_id uuid not null
    references public.craftid_entities(id) on delete restrict,
  sender_user_id uuid not null
    references auth.users(id) on delete restrict,
  message text,
  share_profile boolean not null default true,
  shared_email text,
  shared_phone text,
  response_message text,
  response_contact_email text,
  response_contact_url text,
  responded_by uuid references auth.users(id) on delete set null,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  unique(opportunity_id, entity_id)
);

create index if not exists opportunity_interest_partner_idx
on public.opportunity_interest_requests(opportunity_id, created_at desc);

create index if not exists opportunity_interest_owner_idx
on public.opportunity_interest_requests(sender_user_id, created_at desc);

alter table public.opportunity_interest_requests enable row level security;
revoke all on public.opportunity_interest_requests from anon, authenticated;
grant all on public.opportunity_interest_requests to service_role;

create or replace function public.submit_opportunity_interest(
  p_opportunity_id uuid,
  p_entity_id uuid,
  p_message text,
  p_share_profile boolean,
  p_share_email boolean,
  p_phone text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, auth, public
as $$
declare
  v_actor uuid := (select auth.uid());
  v_email text;
  v_id uuid;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if not coalesce(p_share_profile,false) then
    raise exception 'sharing your CraftID identity is required to send an interest request';
  end if;

  if not exists (
    select 1
    from public.craftid_entities e
    where e.id = p_entity_id
      and e.owner_user_id = v_actor
      and e.public_status <> 'archived'
  ) then
    raise exception 'CraftID entity is not owned by this account';
  end if;

  if not exists (
    select 1
    from public.opportunities o
    join public.partner_organisations po on po.id = o.partner_organisation_id
    where o.id = p_opportunity_id
      and o.is_published = true
      and o.allow_interest = true
      and po.status = 'confirmed'
      and po.is_public = true
      and (o.deadline_date is null or o.deadline_date >= current_date)
  ) then
    raise exception 'this opportunity is not accepting CraftID interest requests';
  end if;

  if coalesce(p_share_email,false) then
    select lower(u.email) into v_email
    from auth.users u
    where u.id = v_actor
      and u.email_confirmed_at is not null;
  end if;

  insert into public.opportunity_interest_requests(
    opportunity_id,
    entity_id,
    sender_user_id,
    message,
    share_profile,
    shared_email,
    shared_phone
  )
  values (
    p_opportunity_id,
    p_entity_id,
    v_actor,
    nullif(btrim(coalesce(p_message,'')), ''),
    true,
    v_email,
    case
      when nullif(btrim(coalesce(p_phone,'')), '') is not null
        then btrim(p_phone)
      else null
    end
  )
  returning id into v_id;

  insert into public.audit_events(actor_user_id, entity_id, action, metadata)
  values (
    v_actor,
    p_entity_id,
    'opportunity_interest_submitted',
    jsonb_build_object(
      'interest_request_id', v_id,
      'opportunity_id', p_opportunity_id,
      'shared_email', v_email is not null,
      'shared_phone', nullif(btrim(coalesce(p_phone,'')), '') is not null
    )
  );

  return v_id;
end;
$$;

revoke all on function public.submit_opportunity_interest(uuid,uuid,text,boolean,boolean,text)
from public, anon;
grant execute on function public.submit_opportunity_interest(uuid,uuid,text,boolean,boolean,text)
to authenticated;

create or replace function public.partner_interest_requests()
returns table(
  request_id uuid,
  opportunity_id uuid,
  opportunity_title text,
  partner_organisation_id uuid,
  entity_id uuid,
  craftid_number bigint,
  craftid_check_digits text,
  entity_type text,
  display_name text,
  public_status text,
  message text,
  shared_email text,
  shared_phone text,
  response_message text,
  response_contact_email text,
  response_contact_url text,
  responded_at timestamptz,
  created_at timestamptz
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
    r.id,
    o.id,
    o.title,
    o.partner_organisation_id,
    e.id,
    e.craftid_number,
    e.craftid_check_digits,
    e.entity_type,
    coalesce(pp.display_name, wp.display_name),
    e.public_status,
    r.message,
    r.shared_email,
    r.shared_phone,
    r.response_message,
    r.response_contact_email,
    r.response_contact_url,
    r.responded_at,
    r.created_at
  from public.opportunity_interest_requests r
  join public.opportunities o on o.id = r.opportunity_id
  join public.craftid_entities e on e.id = r.entity_id
  left join public.professional_profiles pp on pp.entity_id = e.id
  left join public.workshop_profiles wp on wp.entity_id = e.id
  where private.partner_has_access(o.partner_organisation_id)
  order by r.created_at desc;
end;
$$;

revoke all on function public.partner_interest_requests()
from public, anon;
grant execute on function public.partner_interest_requests()
to authenticated;

create or replace function public.partner_respond_to_interest(
  p_request_id uuid,
  p_response_message text,
  p_response_contact_email text,
  p_response_contact_url text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_partner_id uuid;
  v_email text := nullif(lower(btrim(coalesce(p_response_contact_email,''))), '');
  v_url text := nullif(btrim(coalesce(p_response_contact_url,'')), '');
  v_entity_id uuid;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if length(btrim(coalesce(p_response_message,''))) < 2 then
    raise exception 'response message is required';
  end if;

  if v_email is not null
     and v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'invalid response contact email';
  end if;

  if v_url is not null and v_url !~ '^https?://' then
    raise exception 'response link must start with http:// or https://';
  end if;

  select o.partner_organisation_id, r.entity_id
    into v_partner_id, v_entity_id
  from public.opportunity_interest_requests r
  join public.opportunities o on o.id = r.opportunity_id
  where r.id = p_request_id
  for update of r;

  if v_partner_id is null then
    raise exception 'interest request not found';
  end if;

  if not private.partner_has_access(v_partner_id) then
    raise exception 'partner access required';
  end if;

  update public.opportunity_interest_requests
  set response_message = btrim(p_response_message),
      response_contact_email = v_email,
      response_contact_url = v_url,
      responded_by = v_actor,
      responded_at = now()
  where id = p_request_id;

  insert into public.audit_events(actor_user_id, entity_id, action, metadata)
  values (
    v_actor,
    v_entity_id,
    'opportunity_interest_responded',
    jsonb_build_object(
      'interest_request_id', p_request_id,
      'partner_organisation_id', v_partner_id
    )
  );
end;
$$;

revoke all on function public.partner_respond_to_interest(uuid,text,text,text)
from public, anon;
grant execute on function public.partner_respond_to_interest(uuid,text,text,text)
to authenticated;

create or replace function public.owner_opportunity_interests(p_entity_id uuid)
returns table(
  request_id uuid,
  opportunity_id uuid,
  opportunity_title text,
  partner_name text,
  message text,
  response_message text,
  response_contact_email text,
  response_contact_url text,
  responded_at timestamptz,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = pg_catalog, auth, public
as $$
declare
  v_actor uuid := (select auth.uid());
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if not exists (
    select 1 from public.craftid_entities e
    where e.id = p_entity_id
      and e.owner_user_id = v_actor
  ) then
    raise exception 'CraftID entity is not owned by this account';
  end if;

  return query
  select
    r.id,
    o.id,
    o.title,
    coalesce(po.short_name_en, po.legal_name_en),
    r.message,
    r.response_message,
    r.response_contact_email,
    r.response_contact_url,
    r.responded_at,
    r.created_at
  from public.opportunity_interest_requests r
  join public.opportunities o on o.id = r.opportunity_id
  join public.partner_organisations po on po.id = o.partner_organisation_id
  where r.entity_id = p_entity_id
    and r.sender_user_id = v_actor
  order by r.created_at desc;
end;
$$;

revoke all on function public.owner_opportunity_interests(uuid)
from public, anon;
grant execute on function public.owner_opportunity_interests(uuid)
to authenticated;
