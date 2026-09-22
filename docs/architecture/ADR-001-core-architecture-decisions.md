# ADR-001 — CraftID Core Architecture Decisions

**Status:** Accepted for implementation planning  
**Date:** 2026-09-22  
**Scope:** CraftID platform architecture, trust model, entity relationships, public map, opportunities and impact layer

## Context

CraftID is evolving from a public professional registry into a European professional identity, skills and evidence infrastructure for craftspeople, workshops and craft-based micro-enterprises.

The current platform already contains:
- immutable CraftID identifiers with check digits;
- professional and workshop entities;
- claim-level trust states;
- private evidence storage and evidence review;
- a CraftID taxonomy with stable keys and external mappings;
- a public registry and public Craft Skills Map;
- privacy controls;
- observations, territorial units and aggregation/suppression foundations for future impact intelligence.

The next product phase introduces development pathways, opportunities, partner organisations, workshop relationships and impact reporting. Before adding these modules, the platform needs several foundation decisions to avoid weakening the current trust and privacy model.

## Decision 1 — CraftID remains claim-based, not globally verified

CraftID will not introduce a global status such as:
- CraftID Verified;
- Verified Professional;
- EU Verified Craftsperson.

Trust remains attached to a specific claim and its evidence.

Supported claim states remain conceptually:
- Self-declared;
- Evidence submitted;
- Document reviewed;
- Evidence reviewed;
- External source confirmed;
- Identity reviewed.

Identity reviewed is a parallel identity control, not the highest professional trust level.

Public language should prefer:
- evidence-supported professional profile;
- reviewed evidence;
- external source confirmed;
- identity reviewed.

CraftID does not certify professional quality, grant statutory qualifications, or replace national recognition systems.

## Decision 2 — Professionals and workshops are separate entities

A professional and a workshop are distinct CraftID entities.

A person may:
- own a workshop;
- work in a workshop;
- collaborate with several workshops;
- move between workshops without losing their personal CraftID.

A workshop may:
- have multiple members;
- have multiple owners/managers;
- exist independently of one individual professional record.

The platform should introduce an explicit relationship model:

professional entity ↔ workshop entity

Initial relationship roles:
- owner;
- co-owner;
- member;
- master;
- employee;
- collaborator.

The relationship must have:
- status;
- start/end dates where relevant;
- visibility;
- provenance/source;
- optional supporting evidence or attestation.

This relationship model is required before expanding Workshop / Enterprise Readiness and before opportunity/referral matching is tied to entity type.

## Decision 3 — Review governance must prohibit self-review

A reviewer or administrator must not be able to review a claim owned by their own CraftID entity.

Reviewer identity and reviewer role must be derived and enforced by the database.

Application-supplied reviewer_role must not be trusted as the source of authority.

Before partner attestation is implemented, the review layer must enforce:
- reviewer_user_id = authenticated user;
- current reviewer/admin role is resolved in DB;
- reviewer is not the owner of the claim's CraftID entity;
- review attribution is immutable;
- evidence must be linked to the reviewed claim;
- all review state changes remain auditable.

Partner endorsement/attestation will only be introduced after organisational actors and conflict-of-interest controls exist.

## Decision 4 — Partner attestation is not a trust shortcut

Partner organisations are a new actor type, not merely a public partners page.

The future organisation model should support:
- organisation identity;
- organisation type;
- country/territory;
- mandate/scope;
- craft/sector scope;
- status;
- agreement status;
- authorised users;
- attestation permissions;
- audit history.

A partner may attest only within an explicitly defined scope.

Public partner statuses such as invited or in discussion remain private/admin-only.

Only confirmed/active partners may be shown publicly.

## Decision 5 — CraftID taxonomy remains proprietary but interoperable

The canonical classification is:

**CraftID Craft & Skills Taxonomy**

It must not be described as an official European classification.

Architecture:
- stable language-independent term IDs/keys;
- hierarchy: craft family → specialisation/profession → skills/techniques;
- optional materials and products/services layer later;
- separate external mappings to ESCO and national terminology.

Foundation hardening required:
- stable_key immutability enforced at table level;
- taxonomy hierarchy must prevent cycles;
- external mappings must never redefine the canonical CraftID term.

## Decision 6 — Development Progress is private and non-ranking

CraftID may provide an owner-only professional development checklist.

It must not:
- appear in the public profile;
- appear on the map;
- affect public registry sorting;
- be exposed to other users as a score;
- imply professional quality.

Prefer checklist semantics over a public percentage.

Example private milestones:
- profile completed;
- skills documented;
- evidence added;
- professional experience recorded;
- privacy reviewed;
- opportunity preferences completed;
- market-readiness information completed.

This is a development/readiness aid, not a quality score.

## Decision 7 — Use "Professional Record", not "Passport"

CraftID will avoid naming its record:
- Skills Passport;
- Evidence Passport;
- Development Passport.

Preferred terms:
- CraftID Professional Record;
- Skills & Evidence Record;
- Public CraftID Record.

The CraftID Mark/QR points to the canonical public CraftID record. It is not a verifiable digital credential and must not imply Europass/EUDI/eIDAS compatibility unless such interoperability is later implemented and verified.

## Decision 8 — Public Craft Skills Map is privacy-first

The public map is a skills visibility layer, not a production-capacity map.

Public map rules:
- published records only;
- city/region/country-level approximate geography;
- no private home address;
- no production capacity attached to public map points;
- no sensitive social attributes attached to public points;
- exact workshop/business addresses are stored separately from coarse geography; Workshop CraftID owners may explicitly opt in to publishing the exact address in the public Workshop profile, with revocable consent; Professional CraftID cannot publish an exact address through this mechanism; the Craft Skills Map remains aggregate/coarse and does not consume exact addresses;
- no disclosure of protected/private evidence.

The map should support:
- professional/workshop counts;
- craft/skill filtering;
- public profiles;
- coarse territorial visibility;
- clusters.

It should not expose:
- sensitive capacity data;
- vulnerable status;
- internal readiness;
- private addresses.

## Decision 9 — Suppress small public aggregates

Territorial/public aggregate reporting must apply a minimum disclosure threshold.

Initial design principle:
- sensitive or potentially identifying public aggregates are suppressed when group size is below a configured threshold;
- thresholds are configuration-driven; current general public aggregates use **k ≥ 5**;
- sensitive or potentially identifying aggregate views use the stricter configured threshold (**currently k ≥ 10**) where such data is lawfully introduced;
- if a subgroup is too small, the data/query layer suppresses it before client delivery; the UI may move to a broader territorial/category level or show "insufficient public data".

Suppression must be enforced in the data/query layer, not only via UI wording.

## Decision 10 — Ukraine requires additional geographic caution

For Ukrainian records, especially during wartime, public geographic intelligence must not expose:
- production capacity by point;
- critical/dual-use capabilities;
- vulnerable population attributes;
- infrastructure-sensitive concentrations;
- exact operational addresses where risk may arise.

Public Craft Skills Map remains focused on professional/craft visibility.

Institutional impact/intelligence views must be separated from the public map and may require stricter access control and aggregation.

## Decision 11 — Sensitive demographic attributes stay outside public profiles

Attributes such as:
- veteran-related status;
- displacement/IDP status;
- gender;
- age/youth group;
- other vulnerability indicators

must never become normal public profile fields.

If collected for programme monitoring:
- collection must be optional;
- purpose must be explicit;
- access must be restricted;
- reporting must be aggregated;
- data minimisation applies;
- future DPIA/privacy assessment is required before sensitive data collection.

Where possible, donor reporting should rely on aggregated programme datasets rather than linking sensitive attributes to public CraftID profiles.

## Decision 12 — Impact is split into outputs, outcomes and economic/social impact

CraftID impact reporting uses three levels.

### Outputs
Platform-generated and directly measurable:
- registrations;
- published profiles;
- countries/regions;
- craft domains;
- claims/evidence;
- workshops;
- opportunities;
- partner organisations;
- referrals.

### Outcomes
Require a traceable event:
- training completed;
- fair/exhibition participation;
- mobility participation;
- B2B introduction;
- opportunity application;
- referral accepted;
- partnership established.

### Economic/social impact
Usually self-reported or externally confirmed:
- order obtained;
- new market entered;
- revenue change;
- jobs created;
- apprentice engaged;
- skill/tradition transmission.

Economic/social impact must preserve provenance. CraftID must not automatically claim causality.

Preferred wording:
reported outcome linked to a CraftID-supported opportunity

not:
CraftID created €X revenue.

## Decision 13 — Opportunity Navigator is the next product-value module

After foundation hardening, the next major user-facing module is Opportunity Navigator.

Initial opportunity data:
- title;
- organisation/source;
- URL;
- opportunity type;
- eligible countries;
- target craft/skills;
- target profile type;
- deadline;
- last_checked_at;
- expires_at;
- status;
- admin notes.

Initial opportunity types:
- training;
- mobility;
- residency;
- exhibition/fair;
- grant;
- business support;
- B2B cooperation;
- export support;
- competition/call.

The first version is a moderated catalogue with filters, not AI matching.

Later matching may use:
- country;
- craft/skills;
- professional/workshop type;
- cooperation interests;
- market-readiness data.

## Decision 14 — Market Readiness is opt-in

Commercial/business readiness information is not required for every professional.

The owner must first opt into commercial/B2B opportunities.

Possible market-readiness fields:
- legal form;
- workshop/enterprise type;
- production mode;
- capacity category;
- wholesale interest;
- export experience;
- communication languages;
- shipping/service countries;
- B2B interest;
- relevant certificates;
- international payment capability.

Visibility must be controlled independently.

## Decision 15 — Europe is the target architecture; Ukraine and Belgium are pilots

Official positioning:

> CraftID is a European professional identity, skills and evidence infrastructure for craftspeople, workshops and craft-based micro-enterprises. It connects structured professional records with learning, cooperation and market opportunities, while preserving claim-level evidence, privacy and transparent provenance. Ukraine and Belgium serve as the initial pilot environments.

CraftID should not be branded as CraftID Europe at this stage.

Country expansion should happen through national and sectoral partners rather than immediately declaring one exclusive national operator per country.

## Decision 16 — CraftID is permanent and entity-bound

A CraftID identifies one entity for the lifetime of that entity.

Core invariants:
- a CraftID number is never changed;
- a CraftID number is never reassigned;
- a CraftID number is never transferred to a different entity;
- Professional and Workshop are separate entity identities and therefore may have separate CraftIDs;
- closing an account archives the entity record but does not destroy or free the CraftID number;
- returning users recover the same archived CraftID rather than receiving a replacement number;
- recovery always returns the record as draft and does not silently restore previous public visibility;
- ordinary ownership mutation is prohibited.

Account control and entity identity are separate concepts.

For Professional CraftID, transfer of the identity to another person is prohibited.

For Workshop CraftID, future governance may allow a controlled change of authorised account administrator where the workshop entity itself remains the same. Such a change is an administrative-control transfer, not a CraftID transfer.

Automatic recovery may use a private continuity mechanism linked to the previously verified account identity. The raw login email must not be stored in the public CraftID registry. Recovery from a different email or disputed ownership requires a separate identity-review process.

## Implementation sequence

### Foundation Hardening
1. Professional ↔ Workshop relationship model.
2. Prohibit self-review.
3. Derive reviewer role in the database.
4. Make review attribution immutable.
5. Enforce taxonomy stable_key immutability at table level.
6. Prevent taxonomy hierarchy cycles.
7. Validate observation/provenance supersedes chains.
8. Enforce public aggregation suppression rules.
9. Finalise public map geography/privacy model.

### Product Layer
10. Opportunity Navigator.
11. Private Development Progress checklist.
12. Partner Organisations / European Network.
13. Optional Market Readiness module.
14. Impact Dashboard and donor reporting projections.

## Non-goals for the current MVP

Do not add now:
- marketplace/payments;
- global CraftID Verified status;
- quality scoring;
- AI product quality assessment;
- social network;
- blockchain credentials;
- country administrator hierarchy;
- full Europass/EUDI integration;
- logistics;
- automatic donor impact claims.

## Consequences

This architecture keeps CraftID:
- simple for end users;
- evidence-oriented;
- privacy-aware;
- scalable across countries;
- compatible with donor and institutional reporting;
- separate from marketplace liability;
- separate from statutory qualification/certification.

It also creates a clear distinction between:
- public professional identity;
- trust/evidence;
- private development;
- commercial readiness;
- institutional intelligence;
- donor impact reporting.
