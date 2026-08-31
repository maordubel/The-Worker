# The Worker — working notes for Claude

Hebrew, RTL, single-club (Hapoel Tel Aviv) football history game.
Read `docs/00-architecture.md` before changing anything structural.

## Rules specific to this repo

1. **One shared data engine.** Game modes are read-models over the canonical tables.
   Never create a mode-specific dataset.
2. **Every fact carries `source_id` + `confidence`.** Only `confidence >= 2` may feed
   the trivia generator.
3. **`match_event` is append-only.** Corrections insert a row with `voids_event_id`.
   Read `v_match_event_effective`, never the raw table.
4. **Answers never reach the client.** `trivia_answer` has RLS with no read policy.
   Grading happens in `rpc_submit_answer` (`SECURITY DEFINER`, idempotency key).
5. **`media.usable_in_app` stays false** until rights are settled. The DB enforces it.
6. **Only `(כדורגל)` content.** The source wiki also covers basketball — filter and
   assert it in every ingest report.
7. **Hebrew names are matched through `entity_alias`, never fuzzily.**
8. **Design tokens only.** Territory and tokens: `docs/01-brand-concept.md`.
   No raw hex, no ad-hoc px, no shadows, radius 0.
9. **RTL-first.** Logical properties. Wrap mixed-direction runs in `<bdi>`.
10. **No user-facing string in code.** Everything through `messages/he.json` + `t()`.

## Commands

```
npm run dev · npm run lint · npm run typecheck · npm run build · npm run db:types
```

## House skills that apply

`dubel-guidelines` · `brand-concept` (done) · `frontend-standards` · `football-data`
· `supabase-server-authority` · `responsive-qa` · `dubel-credit` (in the footer)
