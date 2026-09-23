-- Enforce the multi-entity ownership invariant at database level.
-- One account may own one active Professional and one active Workshop, but
-- never two non-archived CraftID records of the same entity type.
--
-- Application/RPC checks remain for clear user-facing errors; this partial
-- unique index closes the concurrent-creation race at the database boundary.

create unique index if not exists craftid_entities_one_active_type_per_owner_uidx
on public.craftid_entities(owner_user_id, entity_type)
where owner_user_id is not null
  and public_status <> 'archived';
