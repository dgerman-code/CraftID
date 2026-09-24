-- Historical production migration ledger placeholder.
-- Production used this version for a one-time, environment-specific bootstrap
-- invitation for the initial Platform Admin.
--
-- The invitation fingerprint is intentionally not committed to source control.
-- Replaying this migration on a new environment is therefore a no-op; staff
-- bootstrap must be configured explicitly for that environment after the
-- schema migration 20260923233037_add_staff_bootstrap_invites.sql.

select 1;
