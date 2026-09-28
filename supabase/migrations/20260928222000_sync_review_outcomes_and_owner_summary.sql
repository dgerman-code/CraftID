-- Keep claim/evidence review state synchronized with append-only review decisions
-- and expose a privacy-safe owner progress summary.
--
-- Review status describes the review process. It does not certify competence,
-- quality, legal identity, licensing, accreditation or institutional endorsement.

create or replace function private.submit_claim_review_impl(
  p_claim_id uuid,
  p_evidence_id uuid,
  p_decision text,
  p_resulting_status text,
  p_private_notes text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_role text;
  v_entity_id uuid;
  v_owner_user_id uuid;
  v_review_id uuid;
  v_evidence_review_status text;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select sr.role
    into v_role
  from private.staff_roles sr
  where sr.user_id = v_actor;

  if v_role not in ('reviewer','admin') then
    raise exception 'reviewer role required';
  end if;

  if p_decision not in (
    'supports_claim','does_not_support_claim',
    'unable_to_determine','needs_clarification'
  ) then
    raise exception 'invalid review decision';
  end if;

  if p_resulting_status not in (
    'evidence_submitted','document_reviewed','evidence_reviewed',
    'external_source_confirmed','identity_reviewed'
  ) then
    raise exception 'invalid resulting status';
  end if;

  select c.entity_id, e.owner_user_id
    into v_entity_id, v_owner_user_id
  from public.claims c
  join public.craftid_entities e on e.id = c.entity_id
  where c.id = p_claim_id
  for update of c;

  if v_entity_id is null then
    raise exception 'claim not found';
  end if;

  if v_owner_user_id = v_actor then
    raise exception 'self-review is not permitted';
  end if;

  if p_evidence_id is not null and not exists (
    select 1
    from public.claim_evidence_links l
    where l.claim_id = p_claim_id
      and l.evidence_id = p_evidence_id
  ) then
    raise exception 'evidence is not linked to claim';
  end if;

  insert into public.reviews(
    claim_id,
    evidence_id,
    reviewer_user_id,
    reviewer_role,
    decision,
    resulting_status,
    private_notes
  )
  values (
    p_claim_id,
    p_evidence_id,
    v_actor,
    v_role,
    p_decision,
    p_resulting_status,
    nullif(btrim(coalesce(p_private_notes,'')), '')
  )
  returning id into v_review_id;

  -- Claim status records the review/provenance stage, not whether a claim was
  -- positively endorsed. The review decision itself remains in reviews.
  update public.claims
  set status = p_resulting_status,
      updated_at = now()
  where id = p_claim_id;

  if p_evidence_id is not null then
    v_evidence_review_status := case
      when p_decision = 'needs_clarification' then 'needs_clarification'
      else 'reviewed'
    end;

    update public.evidence_items
    set review_status = v_evidence_review_status,
        updated_at = now()
    where id = p_evidence_id
      and owner_entity_id = v_entity_id;
  end if;

  insert into public.audit_events(
    actor_user_id,
    entity_id,
    action,
    metadata
  )
  values (
    v_actor,
    v_entity_id,
    'claim_review_recorded',
    jsonb_build_object(
      'claim_id', p_claim_id,
      'evidence_id', p_evidence_id,
      'review_id', v_review_id,
      'decision', p_decision,
      'resulting_status', p_resulting_status,
      'evidence_review_status', v_evidence_review_status
    )
  );

  return v_review_id;
end;
$$;

revoke all on function private.submit_claim_review_impl(uuid,uuid,text,text,text)
from public, anon, authenticated;
grant execute on function private.submit_claim_review_impl(uuid,uuid,text,text,text)
to authenticated;

create or replace function public.owner_review_progress(p_entity_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, auth, public, private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_owner uuid;
  v_claim_count bigint;
  v_reviewed_claim_count bigint;
  v_evidence_count bigint;
  v_reviewed_evidence_count bigint;
  v_needs_clarification_count bigint;
  v_last_reviewed_at timestamptz;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select e.owner_user_id
    into v_owner
  from public.craftid_entities e
  where e.id = p_entity_id;

  if v_owner is null then
    raise exception 'CraftID entity not found';
  end if;

  if v_owner <> v_actor
     and not private.has_staff_role(array['reviewer','admin']) then
    raise exception 'access denied';
  end if;

  select
    count(*),
    count(*) filter (
      where c.status in (
        'document_reviewed',
        'evidence_reviewed',
        'external_source_confirmed',
        'identity_reviewed'
      )
    )
    into v_claim_count, v_reviewed_claim_count
  from public.claims c
  where c.entity_id = p_entity_id;

  select
    count(*),
    count(*) filter (where e.review_status = 'reviewed'),
    count(*) filter (where e.review_status = 'needs_clarification')
    into v_evidence_count, v_reviewed_evidence_count, v_needs_clarification_count
  from public.evidence_items e
  where e.owner_entity_id = p_entity_id
    and e.retention_status = 'active';

  select max(r.created_at)
    into v_last_reviewed_at
  from public.reviews r
  join public.claims c on c.id = r.claim_id
  where c.entity_id = p_entity_id;

  return jsonb_build_object(
    'claim_count', coalesce(v_claim_count, 0),
    'reviewed_claim_count', coalesce(v_reviewed_claim_count, 0),
    'evidence_count', coalesce(v_evidence_count, 0),
    'reviewed_evidence_count', coalesce(v_reviewed_evidence_count, 0),
    'needs_clarification_count', coalesce(v_needs_clarification_count, 0),
    'last_reviewed_at', v_last_reviewed_at
  );
end;
$$;

revoke all on function public.owner_review_progress(uuid)
from public, anon;
grant execute on function public.owner_review_progress(uuid)
to authenticated;

comment on function public.owner_review_progress(uuid) is
  'Owner/staff privacy-safe aggregate review progress. Does not expose reviewer identity, private notes or review decision text.';
