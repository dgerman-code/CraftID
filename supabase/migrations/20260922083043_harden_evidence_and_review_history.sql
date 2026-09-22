-- Preserve evidence provenance and review history.
-- Reviewed evidence cannot be rewritten in place and reviewed claims cannot
-- erase their review history through a status downgrade followed by deletion.

-------------------------------------------------------------------------------
-- 1. Claims with review history cannot be deleted, and owners cannot downgrade
--    reviewed claim status to regain delete privileges.
-------------------------------------------------------------------------------

create or replace function private.protect_claim_review_history()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_is_staff boolean := private.has_staff_role(array['reviewer','admin']);
begin
  if tg_op = 'DELETE' then
    if exists (select 1 from public.reviews r where r.claim_id = old.id) then
      raise exception 'reviewed claims cannot be deleted; use a future withdrawal/archive workflow';
    end if;
    return old;
  end if;

  if new.entity_id is distinct from old.entity_id then
    raise exception 'claim entity_id is immutable';
  end if;

  if new.status is distinct from old.status
     and old.status not in ('self_declared','evidence_submitted')
     and not coalesce(v_is_staff, false) then
    raise exception 'reviewed claim status cannot be changed by the owner';
  end if;

  return new;
end;
$$;

revoke all on function private.protect_claim_review_history()
from public, anon, authenticated;

drop trigger if exists claims_protect_review_history on public.claims;
create trigger claims_protect_review_history
before update or delete on public.claims
for each row execute function private.protect_claim_review_history();

-- Preserve review rows independently from claim deletion attempts.
alter table public.reviews
  drop constraint if exists reviews_claim_id_fkey;

alter table public.reviews
  add constraint reviews_claim_id_fkey
  foreign key (claim_id)
  references public.claims(id)
  on delete restrict;

-------------------------------------------------------------------------------
-- 2. Evidence review state is server-owned and reviewed content is immutable.
-------------------------------------------------------------------------------

create or replace function private.protect_evidence_review_integrity()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_is_staff boolean := private.has_staff_role(array['reviewer','admin']);
  v_has_review boolean := false;
begin
  if tg_op = 'INSERT' then
    if not coalesce(v_is_staff, false) then
      if new.review_status <> 'submitted' then
        raise exception 'owner-created evidence must start as submitted';
      end if;
      if new.retention_status <> 'active' then
        raise exception 'owner-created evidence must start as active';
      end if;
      if new.visibility <> 'private' then
        raise exception 'owner-created evidence must start private';
      end if;
    end if;
    return new;
  end if;

  if new.owner_entity_id is distinct from old.owner_entity_id then
    raise exception 'evidence owner_entity_id is immutable';
  end if;

  select exists (
    select 1 from public.reviews r where r.evidence_id = old.id
  ) into v_has_review;

  if not coalesce(v_is_staff, false)
     and new.review_status is distinct from old.review_status then
    raise exception 'evidence review_status is reviewer-controlled';
  end if;

  if (v_has_review or old.review_status <> 'submitted')
     and (
       new.storage_path is distinct from old.storage_path
       or new.source_reference is distinct from old.source_reference
       or new.evidence_type is distinct from old.evidence_type
       or new.title is distinct from old.title
       or new.issuer is distinct from old.issuer
       or new.issue_date is distinct from old.issue_date
     ) then
    raise exception 'reviewed evidence content is immutable; create a new evidence version';
  end if;

  return new;
end;
$$;

revoke all on function private.protect_evidence_review_integrity()
from public, anon, authenticated;

drop trigger if exists evidence_items_protect_review_integrity on public.evidence_items;
create trigger evidence_items_protect_review_integrity
before insert or update on public.evidence_items
for each row execute function private.protect_evidence_review_integrity();

-------------------------------------------------------------------------------
-- 3. A reviewed claim/evidence link cannot be silently removed.
-------------------------------------------------------------------------------

create or replace function private.protect_reviewed_claim_evidence_link()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if exists (
    select 1
    from public.reviews r
    where r.claim_id = old.claim_id
      and r.evidence_id = old.evidence_id
  ) then
    raise exception 'reviewed claim-evidence links cannot be deleted';
  end if;

  return old;
end;
$$;

revoke all on function private.protect_reviewed_claim_evidence_link()
from public, anon, authenticated;

drop trigger if exists claim_evidence_links_protect_review_history
  on public.claim_evidence_links;
create trigger claim_evidence_links_protect_review_history
before delete on public.claim_evidence_links
for each row execute function private.protect_reviewed_claim_evidence_link();

-------------------------------------------------------------------------------
-- 4. Storage bytes for reviewed evidence cannot be replaced or deleted.
-------------------------------------------------------------------------------

create or replace function private.can_owner_mutate_evidence_object(p_object_name text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, auth, public
as $$
  select case
    when not exists (
      select 1
      from public.evidence_items ei
      where ei.storage_path = p_object_name
    ) then true
    else exists (
      select 1
      from public.evidence_items ei
      join public.craftid_entities e on e.id = ei.owner_entity_id
      where ei.storage_path = p_object_name
        and e.owner_user_id = (select auth.uid())
        and ei.review_status = 'submitted'
        and not exists (
          select 1 from public.reviews r where r.evidence_id = ei.id
        )
    )
  end;
$$;

revoke all on function private.can_owner_mutate_evidence_object(text)
from public, anon;
grant execute on function private.can_owner_mutate_evidence_object(text)
to authenticated;

drop policy if exists "evidence owners can update files" on storage.objects;
create policy "evidence owners can update files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and private.can_owner_mutate_evidence_object(name)
)
with check (
  bucket_id = 'evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and private.can_owner_mutate_evidence_object(name)
);

drop policy if exists "evidence owners can delete files" on storage.objects;
create policy "evidence owners can delete files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'evidence'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and private.can_owner_mutate_evidence_object(name)
);
