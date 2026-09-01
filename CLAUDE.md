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
   everywhere — every screen header via `components/ui/Badge.tsx`, favicon, share card.
   Nothing re-draws it. `scripts/brand/badge.py` rebuilds the six sizes from
   `brand/source/badge-original.png` and rotates the ~280 dark edge pixels that land in
   the yellow band onto a warm brown at the same S and V; `Badge.tsx` renders it
   `unoptimized`, because Next's WebP/AVIF re-encode subsamples chroma and put yellow
   back into a 62px render of a file that scanned clean. Both are asserted in
   `tests/brand.test.ts`.
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
    **And say WHOSE block it is.** This file recorded for days that wiki.red-fans.com
    "returns 403 to automated reads". It does return 403 from here — but so does
    `he.wikipedia.org`, with `Host not in allowlist`. The build container allowlists
    outbound hosts, so what was reported as the source refusing us may be this
    environment refusing the source. A blocked source is documented with the evidence
    that identifies which side blocked it, or it is documented as unknown.
12. **One file knows MediaWiki:** `scripts/ingest/adapters/mediawiki.ts` — the API
    client AND the `Special:Export` XML reader. A provider field name anywhere else is a
    defect. The corpus importer (`sources/wiki-corpus.ts`, `docs/07-wiki-corpus.md`)
    reads the WHOLE wiki: `list=allpages` past the 500/5,000 cap, one namespace at a
    time, with paginated property lists MERGED rather than truncated — a page with 700
    links answers with 500 and a cursor, and dropping it stores a page that looks
    complete. Idempotent on the wiki's own `page_id`. 403 and 404 are never retried:
    a refusal is an answer (rule 11).
    **On songs:** the raw wikitext is stored because provenance and idempotency need the
    original, but a question is built from a song's METADATA — title, tune, subject.
    No question, explanation or share card prints verses.
13. **A derby means Maccabi Tel Aviv. Nothing else.** It is a `club.is_derby_rival` flag
    and a DB trigger that derives `match.is_derby`. Never hand-set it, never widen it.
14. **A question is never cross-sport. A ROUND may be.** Every sport-bearing table
    carries `sport`, a trigger rejects a cross-sport match, and aliases are scoped by
    sport — so a football question can never draw a basketball distractor, and "how many
    championships" can never answer with the other sport's count. That was always what
    this rule protected. Maor then asked for a general trivia round that includes the
    basketball, and that is not a breach: `lib/game/topics.ts` gives each TOPIC a list of
    sports, `general` admits both, and every other topic is football. The wall is the
    `sport` field on the question, not the absence of basketball from the app. The
    Hapoel Ussishkin chapter is basketball and lives in its own wing.
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

18. **Maor is a SOURCE, not a claim to be checked.** He founded Hapoel Ussishkin, he
    stood as a capo of Ultras Hapoel, and on what the terrace feels and remembers he is
    the primary source in this project — cite him as one (`sourceTitle: "מאור הראל —
    ידע אישי, <date>"`) rather than dressing his knowledge up as a press citation or
    quietly leaving it out because a search did not surface it. Research EXPANDS what he
    gives; it does not overrule it. The rules that stay absolute are the ones about
    fabrication: never publish a factual claim about a named person that no source
    supports, and never invent a date, a fee or a fixture. Those are compatible — when
    he names a figure the terrace hates, the figure goes in and the CHARGE is written
    from the record. Gate 11 is what that looks like in practice.
    A previous version of this file recorded a "correction" that scoped his hate game
    down to a transfer quiz on the grounds that three of his six names were not
    documented crossers. That was the wrong call twice over: it answered a request about
    FEELING with a quiz about records, and it treated the club's own capo as a witness
    to be fact-checked.

19. **Sharing is a first-class surface, not a button.** `lib/share/story.ts` draws the
    1080×1920 card on a canvas at true story size and hands it to
    `navigator.share({ files })`; there is exactly ONE share system and it is this one.
    Every card carries the badge, the address and a `?seed=` link, because a share that
    only announces a result recruits nobody — the link has to hand over the identical
    round. `components/share/ShareRow.tsx` is the only place a game reaches for it.

20. **A shirt is eight layers, never an image.** `lib/kit/spec.ts` + `KitShirt.tsx` +
    `KitStrip.tsx`, off the Kit Builder handoff: base, cut, sleeves, collar, crest,
    maker, sponsor, nameset — drawn as a full STRIP, because every reference Maor sent
    shows shirt, shorts and socks and a shirt alone reads as a mockup. One JSON object
    in, SVG out, no asset files. `PRESETS` is the rack the designer opens on: eight real
    Hapoel kits read off his references, because a blank designer is a blank page.
    `colours-of-football.com` returns 403 to automated reads and was NOT circumvented —
    documented here like any blocked source (rule 11).

21. **A gate is a GAME, not a form.** `lib/game/session.ts` is the loop every run uses,
    and its parts are not decoration: three escalating stages with a card between them,
    three lives so a wrong answer costs something, a combo multiplier so the fourth
    right answer feels different from the first, and a per-question clock so thinking
    turns into playing. **There is no "next" button** — a correct answer advances itself
    after 900ms of feedback, and a run never navigates: `TriviaRun` deals all twelve
    questions at once (answers stripped server-side) and plays them on one screen,
    because a page transition is a full stop and a game is a run-on sentence. Game
    screens run `<Screen chrome={false}>`: no masthead, no footer, the glass belongs to
    the run. Motion lives in the marked block in `app/globals.css` and every animation
    is off under `prefers-reduced-motion`.

22. **The story templates are the handoff's, including the safe zone.** Six grounds —
    `score` `grass` `ink` `kit` `year` — each built as headline · one graphic · credit
    strip, with **260px reserved top and bottom** where Instagram's own interface sits.
    Type is skewed and printed twice (ink under at a hard offset, colour over): that is
    the second plate, not a drop shadow, and the brand has no shadows.

23. **The product is called The Worker.** Not "The Worker · הפועל", not a bilingual
    pair, not the brand system. A name with something appended to it is not a name. The
    address is **theworker.dubelteam.com** (`SITE_URL`), printed on every share card.
    הפועל תל אביב is the CLUB and belongs on the second line, never in the name slot.

24. **The gate plan is Maor's, and gate 2 is a WING.** The map as he set it on
    1.9.2026: 1 `/xi` הרכב כל הזמנים · 2 `/trivia` אגף הטריוויות (five topics, each its
    own route) · 3 `/lineup` הרכב משחק היסטורי · 4 `/kits/build` חידון המדים ·
    5 `/kits` עיצוב חולצה אישית · 6 `/memory` משחק הזיכרון · 7 אגף הסקרים (replacing the
    crest game, which he cut) · 8 `/goal` שחזור שער · 9 חדר הלבשה · 10 `/tik` כרטיס פועל ·
    11 `/derby` משחק השנאה → התיק השחור · 12 ON TOUR · 13 `/timeline` ציר הזמן.
    `/ussishkin` is a memorial wing, not a gate. Naming the game types is what stopped
    them collapsing into each other:
    - **gate 4 `/kits/build`** — חידון מדים לפי עונה: you are given a season and you
      BUILD its kit. Stage 1 asks the cut, stage 2 adds the sponsor, stage 3 adds the
      maker. The difficulty rises in the ASK, not only in the clock.
    - **gate 5 `/kits`** — free design, no right answer, share it.
    - **gate 1 `/xi`** — הרכב כל הזמנים: eleven from all 640, free play, no grading.
    - **gate 3 `/lineup`** — חידון ההרכב: assemble the exact XI that started a match.
    A quiz and a toy are not the same screen and must never share a route.

25. **A shirt wears the crest of its era.** `crestForSeason()` resolves it from the crest
    timeline, so 1978 carries the worker mark, 2002 the one with KETER inside it, 2008
    the badge that said 1927 and 2018 the one that says 1923. The old slot drew a circle
    and two strokes meant to suggest the figure; a club crest is not a thing to
    approximate — print it or leave the slot empty. The sponsor is LETTERED on the
    fabric, not stamped in a black plate, because every reference shows it printed on
    the shirt.

26. **A retired file becomes a tombstone, never a deletion.** Deltas reach the repo
    through GitHub's web upload, which adds and overwrites but never deletes — so a
    retired file with a broken import keeps failing the deploy long after the local tree
    is clean. Every retired path keeps a valid, inert file that imports NOTHING (the one
    exception is `next/navigation` for a redirect). Enforced in `tests/guards.test.ts`:
    a tombstone that grows, gains an import, or disappears fails the suite.

27. **Lossy compression reinvents yellow. Ship artwork as a palette PNG.**
    Rule 8 has no exemption for artwork, and getting there took four attempts: JPEG at
    4:2:0 put it back (chroma averaged over 2×2 blocks), JPEG at 4:4:4 put it back (DCT
    ringing at hard edges), and h.264 put back a one-pixel seam wherever green met brown
    — generated at DECODE, so no amount of cleaning the source frames helped. A palette
    PNG is lossless with a finite, explicit colour set, which turns the check from a
    sample into a proof: no yellow entry in the table means no yellow pixel in the file.
    `scripts/brand/art.py` does it and asserts it. Same class as the badge coming back
    yellow after Next's WebP re-encode.

28. **An ad may never appear during a run.** `lib/ads.ts` owns that decision and no
    component may take it for itself. A banner that reflows the board mid-question costs
    the player the question; an interstitial between stages breaks the thing rule 21
    exists to protect. Ads go on the reading screens and on the result screen — a place a
    person is already stopping — one per screen, with the height reserved before the
    script answers.

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
