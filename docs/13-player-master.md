# Player Master

`content/generated/player-master.json` is the canonical generated player index for archive/search/gates/trivia/squad/shirt-number features. Rebuild with `npm run players:master`.

## Source rules

- `player-facts.json` and VikiHapoel are the identity/role backbone.
- VikiHapoel `origin` is stored as `foreignSlotStatus`; it is **not nationality**.
- Birthplace never implies citizenship or nationality.
- Date precision is preserved: `1988` remains year precision; no month/day is invented.
- `shirt-numbers.json` keeps season-specific historical numbers; conflicting holders remain separate evidence.
- `squads.json` may add explicitly declared current nationality, shirt number and captain status.
- `match-scorers.json` contributes only `archiveGoals.documentedGoals`; it is explicitly incomplete and is never promoted to a career goal total.
- No historical shirt number is inferred.
- Every merged record retains provenance paths.

Consumers should import `lib/archive/player-master.ts`, not duplicate parsing logic or hard-code archive totals.
