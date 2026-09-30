# ADR-fanlife-0001: Deployment topology: control plane + per-club data plane

## Status
Proposed

## Date
2026-09-30

## Context
14 clubs on `<club>.fanlife.game`. The engine imports ~100 content JSON files statically; generated files sit at fixed paths; `ERAS/CHAPTERS/DIALOGUE` are global singletons. fanlife today is a full 810MB copy of The Worker kept in sync by lock + patch, which already conflicts (`package.json`) and cannot be resolved by the owner (no terminal).
## Decision
1. **Data plane = the engine repo (The Worker).** One deployment per live club, the club chosen at **build time** by `CLUB_ID`. Aliases `@/content/club/*`, `@/messages/active`, `@/theme/active` resolve to that club's pack. Server code derives the club from the deployment, never from the request.
2. **Control plane = fanlife**, slimmed to: portal home (from the registry), admin, research, approval queue, health checks. It **stops carrying a game copy**; upstream sync is retired.
3. Approved packs reach the engine repo as a **PR** exported by the control plane (`content/clubs/<id>/`).
4. Portal home is its own light deployment reading the registry (`lib/master/registry.ts`).
## Alternatives
- Runtime multi-tenant single bundle: all 14 clubs' data in one bundle or ~100 dynamic-import rewrites; blast radius = everything. Rejected.
- Keep fanlife as full copy + sync: drift, conflicts, 810MB. Rejected.
- Monorepo workspaces: clean, but a large one-time restructure of a live product. Deferred; revisit after M1.
## Consequences
+ Static imports stay; bundles hold one club; singletons and audit scripts work unchanged (run per `CLUB_ID`); isolation by construction.
− N builds per engine change (mitigated by path-based `ignoreCommand`, live clubs only); needs a plan suitable for commercial use and N projects (**unverified**).
## Dependencies
Depends on: none. Enables: 0002–0007. Blocks: M1.
## Validation
Hapoel built with `CLUB_ID=hapoel-tel-aviv` is byte-identical to today (generated files + tests). Second club builds and serves from the same commit.
