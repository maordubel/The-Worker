# 19 · Red Voice, Result Context, Universal Exit

ONE RED WORLD master plan (`docs/specs/ONE-RED-WORLD-MASTER-PLAN-2026-09-27.md`) §2–§6, §27–§29,
§37, §38, §40, §41. Built 28.9.2026 as shared primitives; gates 2 (Trivia) and 10 (Blind Cow)
are the reference adoptions. Every other gate adopts with the recipe at the end.

## The tone (§2.2)

A long-time supporter who does not talk down to you. Poetic without kitsch, rough in
measure, loving, remembering, able to laugh at itself, sometimes sad. Not corporate, not
FIFA, not gamification copy. The four sentences that define the product:

| sentence | family | gates |
|---|---|---|
| "זאת הפועל שלי" | identity | 1 XI · 5 wardrobe · 9 Rumble |
| "אתה עוד זוכר?" | memory | 2 · 3 · 4 · 6 · 8 · 10 · 13 |
| "מה אתה אומר?" | opinion | 7 terrace · 11 hate wall |
| "שלח ליציע" | the one share label | every gate |

The share label is always **"שלח ליציע"** — never "Share Result". A result must be complete
with no second person in the system (§1.1): share is layer 3, closed by default, never
primary by force (§51).

**Only gate 11 may be harsh** (§20): black, rough, angry. Even there: no "real fan", no
defamation, every charge from the record, opinion labelled as the terrace's opinion.

## The forbidden list

`tests/voice.test.ts` reads **every** `messages/*.json` and the code of `lib/voice`:

- beat · crush · loser · real fan · awesome · destroy · prove (any case, word forms)
- תביס · תנצח את · אוהד אמיתי · אוהדים אמיתיים · לוזר · תוכיח
- guilt-streak phrasing: "אל תשבור את הרצף", "הרצף ייעלם/בסכנה", "תאבד את הרצף",
  "נשארת מאחור", "don't break your streak", "falling behind"

Exemptions are listed **by key**, gate 11 only, each with its reason (`GATE_11_EXEMPT`):
`derby.fileCta` and `share.msg.file` — the black file's own dare, about knowing a sourced
file, not about being a real supporter. The test fails if an exempt key stops needing its
exemption, or if a new key needs one. Adding a key there is a decision, not a fix.

This pass changed one existing string to pass the guard: `market.lede` said
"בארון של אוהד אמיתי" and now says "בארון של אוהד, לא על מדף של חנות".

## Red Voice — `lib/voice/`

| file | what |
|---|---|
| `types.ts` | `GateNo`, `Moment` (intro/result/correct/wrong), `ResultTier` (perfect/near/high/mid/low/done), `VoiceOut` |
| `messages.ts` | `VOICES` — every gate's pools as message keys (grammar below) |
| `contexts.ts` | gate → family/mood, `HARSH_GATES`, `TIER_FALLBACK`, `tierFromShare`, `tierFromClues` |
| `select.ts` | `voice()`, `microFeedback()`, `voiceAction()`, `whatsappLine()`, seeded `pick()` |
| `songs.ts` | Song Context Registry |
| `index.ts` | the one import |

All words live in `messages/he.voice.json` (merged by `lib/i18n.ts`). Key grammar:

```
voice.g<N>.intro.<i>.{title,body,cta}
voice.g<N>.<tier>.<i>.{eyebrow,title,body}     tier ∈ perfect near high mid low done
voice.g<N>.correct.<i>[.sub]   voice.g<N>.wrong.<i>[.sub]
voice.g<N>.act.<name>   voice.g<N>.cta.<name>   voice.g<N>.whatsapp
voice.next.*            (the Universal Exit's door labels)
```

A pool grows by adding keys to the JSON and raising the count in `messages.ts`; the test
resolves every key the registry can hand out and rejects a `voice.*` key nothing reaches.

**Selection is deterministic.** `pick(pool, seed, salt)` hashes the seed with a salt naming
the moment (FNV-1a). Same run, same line — a shared `?seed=` link opens on the words the
sender read. `microFeedback(gate, kind, seed, index)` walks the pool by question index so
twelve answers do not repeat one line. A missing tier falls **down** (`TIER_FALLBACK`), never up.

## Song Context Registry — the songs situation

`lib/voice/songs.ts` is built **only** from `content/manual/songs.json` — 18 songs
(8 player songs, 9 terrace songs, 1 club song), metadata the team's research brought from
ויקיפועל. Rule 12 / §3.2: no lyrics are stored anywhere, `shortExcerpt` stays undefined and
the validator fails the build if one is filled.

What is **not** known: no song page was ever read from here (rule 11 — the sandbox proxy
refuses the wiki, Cloudflare challenges automated readers). The rows carry the wiki root
as their source, and a page title is not guessed from a display title. So every row's
`sourceUrl` is the category page the plan names,
`https://wiki.red-fans.com/index.php?title=קטגוריה:שירים`, with `pageKnown: false`.
Rows below confidence 2 (the terrace titles the source names without describing) are
surfaced in the archive only. Moods per song type are this file's classification, stated
as such.

**Owner step to complete it (click-only, in a browser):** open
`https://wiki.red-fans.com/index.php?title=Special:Export`, add the categories `שירים`,
`שירים מהיציע` and `שירי שחקנים`, tick "include only the current revision", export, and
send the XML file. `sources/wiki-export.ts` / `scripts/ingest/songs-cli.ts` read it; each
song then gets its real page title and `pageKnown: true`.

## Result Context — `lib/results/`

- `types.ts` (client-safe): `ResultContext` (§5), `NextAction`, `RecommendState`.
- `context.ts` (server-only): `recommend(ctx, state)` — §38, deterministic, **at most one
  primary and one secondary**, the secondary a different kind where one exists. Rules in
  order: goal → replay in gate 8 (from gate 8: its match's archive card) · weak topic →
  its teaching gate · match → gate 3 when a verified XI exists, its archive card, its AWAY
  DAYS stop · LIFE anchor → `/life` **only if `state.lifeUnlocked(chapter)`** · player →
  archive card, "הוא נכנס להרכב שלך?" · other archive ids. Never the asking gate's own
  door, never an href in `state.exclude`.
- Every href comes from `lib/links/index.ts`. New doors there: `gateHref(n)`,
  `awayDaysHref()`, `playableGoalHref(id)`, `lineupHref(matchId)`, `lifeHref(chapter, unlocked)`.
  `tests/results-context.test.ts` fails if `lib/results` or `components/result` spell a route.

## Universal Exit — `components/result/UniversalExit.tsx`

Three layers (§6): **emotion** (voice eyebrow/title/body) · **one or two doors** from
`recommend()` · **"שלח ליציע"**, which reveals the gate's OWN share (`ShareRow` or the card
chips, rule 19) — no second share system. Parts are exported for a phone-stage result:
`ExitEmotion`, `ExitNext`, `ExitShare` (all take `compact`). Shell tokens only, logical
properties only. Measures `result_view`, `entity_follow`, `share_open`.

## Events (§37)

`EVENT_NAMES` gained `run_start`, `run_complete`, `result_view`, `archive_open`,
`entity_follow`, `life_chapter_complete`, `share_open/created/joined`,
`challenge_created/joined/complete`, `stand_created/joined/daily_complete`,
`daily_open/item_complete/complete`. The plan's `gate_open` is the existing `gate_view`
(a second name would split one count). The table's check is widened by
`supabase/migrations/20260928090000_worker_events_taxonomy.sql` — standalone, runs after
`20260925090000_worker_events.sql`, touches only `worker_event`'s name check; DB assertions
in `supabase/tests/41-events-taxonomy.sql` (in `scripts/db/verify.sh`). **Owner step:** in
Supabase → SQL Editor, paste that file and run it; the last line must read
`event_names 36 · anon_can_read 0 · auth_triggers 0`.

## The adoption recipe (for the next gate)

1. **Words:** add the gate's lines to `messages/he.voice.json` under `voice.g<N>.*` and the
   counts to `VOICES[N]` in `lib/voice/messages.ts`. Run `tests/voice.test.ts`.
2. **Micro-feedback:** where the gate reacts to a right/wrong move, use
   `microFeedback(N, 'correct' | 'wrong', seed, index)` instead of a gate-local key.
3. **Result:** build a `ResultContext` (gate id, run id, score, the canonical ids that
   mattered, weak/strong topics). On the server, `recommend(ctx, { exclude, lifeUnlocked })`
   — in the engine that already builds the result (gate 10: `lib/game/blind-cow/engine.ts`)
   or in a server action (gate 2: `nextAfterRun` in `app/trivia/actions.ts`).
4. **Screen:** `voice({ gate: N, moment: 'result', result: tier, seed, vars })` →
   `<UniversalExit voice next from again share={<the gate's ShareRow/>}>{details}</UniversalExit>`,
   or the three parts for a stage-constrained screen. Emit `run_complete` once.
5. **Delete** the gate-local strings the voice replaced (rule 32).

References: `app/trivia/MatchReport.tsx` + `app/trivia/TriviaRun.tsx` (full exit, voice
micro-feedback for plain hits/misses; named reactions — deep/fast/fire/onit/timeout — kept),
`components/blind-cow/ResultPanel.tsx` + `GuessDrawer.tsx` + `BlindCowGame.tsx` (compact parts).

## Wave 2 — gates 7 · 8 · 9 · 11 · 12 · 13, the router and the LIFE bridge (28.9.2026)

- **Adopted:** 7 (the debate's words + a closing line; reasons are `voice.g7.act.why.*`), 8 (per-goal
  and run result: "הרגע היה שם." + the key mismatch from `lib/game/replay/mismatch.ts`, "ככה זה קרה."
  when clean), 9 (§18 lines; the kickoff frame reads `voiceAction(9,'kickoff')`), 11 ("זה מי שנשאר
  אצלך.", opinion tagged "דעת יציע", every black-file entry = מי · מה קרה · מתי · מקור · למה זה
  בתיק), 12 (landing "מה חזר היום?", "היום לפני", dig = preview then open, "היום הארכיון שקט."),
  13 (Red Thread "יש חיבור." / "החוט לא עובר כאן." / "מצאת דרך."; order "הסיפור חזר לסדר.").
  Each finished run emits `run_complete` and asks its gate's server action (`nextAfter…`) for
  `recommend()` doors. Replaced strings were deleted.
- **Cross Gate Router:** `lib/links/actions.ts` → `actionsFor(entity)`; drawn by
  `components/archive/GateRouter.tsx`. `tests/router.test.ts` returns every href through its gate.
- **LIFE bridge:** `lib/life/bridge.ts` (server-only, derived from the anchors + masters),
  `lib/life/memoryPassport.ts` (client-safe fold of the save: `livedIt(passport, id)` for other
  gates — gate 5 kits). LIFE → gates: the ending card's "הארכיון" block (≤2 doors). Gates → LIFE:
  the archive drawer's "חווית את הרגע הזה ב-LIFE" and gate 8's result door, only for a chapter the
  device's save COMPLETED. `tests/life-bridge.test.ts`.
- **Not done here (owned by Share V2):** a share for the archive item and the Red Thread run —
  `lib/share` has no `archive` kind and the `timeline` message is the order game's.
