-- P2 governance hardening:
-- * separate public RLS predicates from staff helpers so anon reads cannot fail;
-- * expose partners only through scoped RPCs and keep internal scope notes admin-only;
-- * authorise publication-gate inspection;
-- * revoke destructive client privileges;
-- * enforce taxonomy stable-key immutability and acyclic hierarchy in the DB.

-------------------------------------------------------------------------------
-- 1. Public/staff RLS separation
-------------------------------------------------------------------------------

drop policy if exists "published entities are publicly readable" on public.craftid_entities;

create policy "published entities are publicly readable"
on public.craftid_entities for select
to anon, authenticated
using (public_status = 'published');

create policy "owners and staff can read own or governed entities"
on public.craftid_entities for select
to authenticated
using (
  owner_user_id = (select auth.uid())
  or private.has_staff_role(array['reviewer','admin'])
);

drop policy if exists "active taxonomy is publicly readable" on public.taxonomy_terms;

create policy "active taxonomy is publicly readable"
on public.taxonomy_terms for select
to anon, authenticated
using (is_active = true);

create policy "admins can read inactive taxonomy"
on public.taxonomy_terms for select
to authenticated
using (private.has_staff_role(array['admin']));

-------------------------------------------------------------------------------
-- 2. Partner organisation projections
-------------------------------------------------------------------------------

drop policy if exists "public can read confirmed public partners"
  on public.partner_organisations;

create policy "admins can read partner organisations"
on public.partner_organisations for select
to authenticated
using (private.has_staff_role(array['admin']));

revoke select on public.partner_organisations from anon, authenticated;

create or replace function public.public_partner_organisations()
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
  sort_order integer
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    po.id,
    po.legal_name_en,
    po.legal_name_uk,
    po.short_name_en,
    po.short_name_uk,
    po.country_code,
    po.partner_role,
    po.website_url,
    po.description_en,
    po.description_uk,
    po.sort_order
  from public.partner_organisations po
  where po.is_public = true
    and po.status = 'confirmed'
  order by po.sort_order, po.legal_name_en;
$$;

revoke all on function public.public_partner_organisations() from public;
grant execute on function public.public_partner_organisations() to anon, authenticated;

create or replace function public.admin_partner_organisations()
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
    po.id,
    po.legal_name_en,
    po.legal_name_uk,
    po.short_name_en,
    po.short_name_uk,
    po.country_code,
    po.partner_role,
    po.status,
    po.agreement_status,
    po.website_url,
    po.description_en,
    po.description_uk,
    po.scope_note,
    po.is_public,
    po.sort_order,
    po.updated_at
  from public.partner_organisations po
  order by po.sort_order, po.legal_name_en;
end;
$$;

revoke all on function public.admin_partner_organisations()
from public, anon;
grant execute on function public.admin_partner_organisations()
to authenticated;

-------------------------------------------------------------------------------
-- 3. Publication gate is visible only to the owner or an admin
-------------------------------------------------------------------------------

create or replace function public.publication_gate_status(p_entity_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_authorised boolean := false;
  v_failures text[];
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select exists (
    select 1
    from public.craftid_entities e
    where e.id = p_entity_id
      and e.owner_user_id = v_actor
  ) or private.has_staff_role(array['admin'])
  into v_authorised;

  if not coalesce(v_authorised, false) then
    raise exception 'not authorised to inspect publication gate';
  end if;

  v_failures := private.publication_gate_failures(p_entity_id);

  return jsonb_build_object(
    'pass', coalesce(cardinality(v_failures), 0) = 0,
    'failures', to_jsonb(v_failures)
  );
end;
$$;

revoke all on function public.publication_gate_status(uuid) from public, anon;
grant execute on function public.publication_gate_status(uuid) to authenticated;

-------------------------------------------------------------------------------
-- 4. Remove destructive privileges from client roles and their defaults
-------------------------------------------------------------------------------

revoke truncate on all tables in schema public from anon, authenticated;
revoke update on all sequences in schema public from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke truncate on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke update on sequences from anon, authenticated;

-------------------------------------------------------------------------------
-- 5. Taxonomy invariants are DB-enforced, not only RPC-enforced
-------------------------------------------------------------------------------

create or replace function private.protect_taxonomy_identity_and_hierarchy()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_cycle boolean := false;
begin
  if tg_op = 'UPDATE' and new.stable_key is distinct from old.stable_key then
    raise exception 'taxonomy stable_key is immutable';
  end if;

  if new.parent_id is not null and new.parent_id = new.id then
    raise exception 'taxonomy term cannot be its own parent';
  end if;

  if new.parent_id is not null then
    with recursive ancestors as (
      select t.id, t.parent_id
      from public.taxonomy_terms t
      where t.id = new.parent_id

      union all

      select t.id, t.parent_id
      from public.taxonomy_terms t
      join ancestors a on t.id = a.parent_id
    )
    select exists (
      select 1 from ancestors where id = new.id
    ) into v_cycle;

    if v_cycle then
      raise exception 'taxonomy hierarchy cycle is not permitted';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.protect_taxonomy_identity_and_hierarchy()
from public, anon, authenticated;

drop trigger if exists taxonomy_terms_protect_identity_and_hierarchy
  on public.taxonomy_terms;
create trigger taxonomy_terms_protect_identity_and_hierarchy
before insert or update on public.taxonomy_terms
for each row execute function private.protect_taxonomy_identity_and_hierarchy();
