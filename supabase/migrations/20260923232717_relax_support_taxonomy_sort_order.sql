-- Taxonomy sort order is presentation metadata, not an identity.
-- Multiple support categories may legitimately share the same sort position.

drop index if exists public.support_interest_taxonomy_sort_uidx;

create index if not exists support_interest_taxonomy_sort_idx
on public.support_interest_taxonomy(sort_order);
