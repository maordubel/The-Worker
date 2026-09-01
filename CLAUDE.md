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
8. **Design tokens only, in TWO scoped systems.**
   - **The shell** is **שערי הפועל** — a two-plate screenprint. Vermilion `--red`
     and navy `--sign` on ageing cream, drawn in `--ink`. **There is no third ink:**
     what looks like a third colour is the two plates overlapping. Misregistration is
     a CONSTANT 3px right-and-down (`.plate-shift`), never random — a random offset
     reads as a bug, a constant one reads as a press. Radius 0. Six faces: Suez One
     (display), Karantina 700 (poster/figures), Miriam Libre (sign), Heebo (body),
     Courier Prime (mono), Archivo (Latin caps).
   - **The press layer** is the DUBID DNA — "a printed 90s sports page" — declared in
     the marked block in `app/globals.css`. It owns the pitch, the drawn player, the kit
     rack and the share cards, and ONLY those. A shell component reaching for a press
     token is a defect.
   **No yellow is ABSOLUTE**, in both systems, with no exemption for artwork or for
   "the pictures". The one definition lives in `lib/isYellow.ts` — a HUE test, because
   every channel-inequality version caught the grass, the badge's skin, or the edge
   where vermilion meets cream. The unit test and the screenshot scanner import it, so
   they cannot drift. Never a raw hex in a component. The checklist runs as
   `tests/brand.test.ts` — it fails the build, not the review.
   The **badge** (`public/brand/logo*.png`) is Maor's own artwork. It is the identity
   everywhere — masthead, favicon, share card. Nothing re-draws it.
9. **RTL-first.** Logical properties only — no `left-*`/`right-*`, not even inside a
   comment (the guard reads source). Wrap mixed-direction runs in `<bdi>`.
   The navigation is **שערי הפועל**, Bloomfield's real gate plan (`lib/gates.ts`): a
   player does not pick a mode from a list, they walk in by a gate. The numbers are the
   ground's own, which is why they are not 1..9. Gate 5 is the curva and gets the full
   bill — rays, flag, the big number. **Gate 11 is the away end and carries no
   vermilion at all**: whoever walks in is looking at somebody else's poster.
10. **No user-facing string in code.** Everything through `messages/he.json` + `t()`.

11. **The ingestion layer never invents.** Unreadable field → null. Unusable row →
    reported as skipped/rejected with a reason. Blocked source → documented, not
    substituted. See `docs/03-ingestion.md`.
12. **One file knows MediaWiki:** `scripts/ingest/adapters/mediawiki.ts`. A provider
    field name anywhere else is a defect.
13. **A derby means Maccabi Tel Aviv. Nothing else.** It is a `club.is_derby_rival` flag
    and a DB trigger that derives `match.is_derby`. Never hand-set it, never widen it.
14. **Football and basketball never mix.** Every sport-bearing table carries `sport`,
    a trigger rejects a cross-sport match, and aliases are scoped by sport. The Hapoel
    Ussishkin chapter is basketball.
15. **A question must have exactly one right answer, four real options, and no open
    conflict behind it.** Questions are grouped by prompt and a prompt with two correct
    answers is dropped whole; a template that cannot field three real distractors is
    dropped rather than padded; a fact recorded in `fact-conflicts.json` with no
    resolution is never asked. All three run in `tests/game.test.ts`.
16. **Always expand the research.** Project rule from Maor: never stop at the first
    answer — bring sources and additional information. Verdicts and sources for the
    current data live in `docs/04-verified-research.md`.
17. **Maor Harel, founder of Hapoel Ussishkin, appears only where a source names him.**
    At most one such question per session, never as a distractor, never in football
    records. His role is stored as `association_role` rows with sources, like anyone
    else's. Do not distort history to personalise it — the Ussishkin story does not
    need help.

## Commands

```
npm run dev · npm run lint · npm run typecheck · npm run test · npm run build
npm run ingest -- --source all --dry-run     # stage + report, no database
npm run ingest -- --source wiki --fetch      # network; needs wiki access
npm run db:types
```

## House skills that apply

`dubel-guidelines` · `brand-concept` (done) · `frontend-standards` · `football-data`
· `supabase-server-authority` · `responsive-qa` · `dubel-credit` (in the footer)
