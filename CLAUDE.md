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
   **No yellow is ABSOLUTE**, in both systems — with exactly ONE named exception, and
   the shape of that exception matters more than the exception itself.
   On 1.9.2026 Maor was shown the frame and the hex and answered **"הצהוב הזה מאושר"**.
   It is the opposition's shirt in the opening animation (`#f2c500`): the yellow is on
   the other team, and they are losing. `lib/brand/yellowExemptions.ts` records it as a
   **file path**, not a colour — `#f2c500` anywhere else still fails — with who approved
   it, when, and why. `tests/brand.test.ts` asserts the list is exactly one entry long,
   that every entry carries an approver and a date, that the path is matched exactly so
   a folder can never be exempted by accident, and that the exempt file is referenced by
   `Intro.tsx` and nothing else. Widening it is a decision somebody has to make out
   loud, not a line that slips into a delta. **Only the owner grants one, in his own
   words, about a specific asset.** The definition lives in `lib/isYellow.ts` — a HUE
   test, because
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
    round. `components/share/ShareRow.tsx` is the only place a game reaches for it. A
    gate with no round (the polls wing) is in `SEEDLESS` and gets a link with no seed on
    it — a parameter the page ignores is a small lie in a URL people read.
    **A card whose content is a LIST gets its own template.** The XI card printed three
    of eleven names and the ballot would have printed one of eight: compressing a list
    into a hero line throws the card's whole content away. `xi` and `ballot` each draw
    every row they are given, sized to the number of rows.
    **Nothing on a card is positioned by a guessed multiple of the point size.** Every
    baseline comes from `measureText`/`actualBoundingBox*`, every block reports its ink
    (`recordInk`), and `npm run story:overlap` intersects the boxes across every
    template with the longest strings in the archive. It has already caught a caption
    printing through a 220px figure that four screenshots did not. `npm run story:cards`
    renders the same harness as pictures, which is what caught an ink panel drawn on an
    ink ground. Both drive `/qa/story`, which is `notFound()` in production and is the
    ONLY file exempt from the brand string guards — `tests/brand.test.ts` asserts the
    exemption stays sealed.

20. **A shirt is eight layers, never an image.** `lib/kit/spec.ts` is the contract:
    base, cut, sleeves, collar, crest, maker, sponsor, nameset. One JSON object in, SVG
    out, no asset files — which is what lets a shirt be recoloured per season and lets
    the archive state which LAYER a season got wrong.
    **`components/kit/KitPlate.tsx` is the renderer**, rebuilt to `Kit Game.dc.html` on
    2.9.2026. The garment is drawn on a 340×320 board with curved beziers, a drawn fold
    layer, dashed seams and a turbulence weave at 13% — the four things that separate
    cloth from a flat vector tee. Patterns are FULL-BLEED shapes the garment clips, so a
    hoop is a rectangle across the whole board and adding an eighteenth cut is a few
    lines. `KitShirt.tsx`/`KitStrip.tsx` still serve the free designer and the strip and
    are scheduled to move onto the plate when gate 5 is rebuilt.
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
    5 `/kits` עיצוב חולצה אישית · 6 `/memory` משחק הזיכרון · 7 `/polls` אגף הסקרים
    (replacing the crest game, which he cut) · 8 `/goal` שחזור שער · 9 חדר הלבשה ·
    10 `/tik` כרטיס פועל ·
    11 `/derby` משחק השנאה → התיק השחור · 12 ON TOUR · 13 `/timeline` ציר הזמן.
    `/ussishkin` is a memorial wing, not a gate. Naming the game types is what stopped
    them collapsing into each other:
    - **gate 4 `/kits/build`** — משחק המדים, rebuilt 2.9.2026 to Maor's mockup: one
      shirt, FIVE parts (body+cut · sleeves · sponsor · maker · crest), all open at
      once, and one **בדוק את החולצה**. The version before it asked the three layers as
      three multiple-choice questions in sequence, and that is a quiz about a shirt
      rather than the building of one — you cannot change your mind about the sleeves
      after the sponsor tells you which era you are in, and that reconsideration IS the
      game. Five shirts to a round, 40 a part, 100 for a perfect shirt.
      **A tap places.** The mockup offers drag OR select-then-tap; select-then-tap was
      built literally first and is wrong, because a part has exactly one home so the
      second tap carries no decision — it is a dexterity step charged for nothing, and
      on a phone it doubles every action in the game.
    - **gate 5 `/kits`** — אגף המדים, rebuilt 2.9.2026: **the collection**, the shirt
      card, and the free designer as a third view. All 33 archive kits are hangers; a
      shirt enters the collection when you ASSEMBLE it in gate 4, at any score. That
      seam is why the two gates are worth having separately — gate 4 is the act, gate 5
      is what the act leaves behind. `lib/kit/collection.ts` is the store, shaped like
      `lib/polls/store.ts`.
      **A locked shirt shows nothing.** The first version drew it as an outline in the
      grid and then printed its sponsor underneath, and opening its card drew the whole
      shirt plus sponsor, maker and crest — the complete answer sheet to that shirt's
      puzzle in gate 4, one tap away. A shirt you have not built shows its season, an
      outline, and the way in. `tests/kit.test.ts` asserts it.
    - **gate 1 `/xi`** — הרכב כל הזמנים: eleven from all 640, free play, no grading.
    - **gate 3 `/lineup`** — חידון ההרכב: assemble the exact XI that started a match.
    - **gate 7 `/polls`** — אגף הסקרים, built as a BALLOT rather than a bar chart. A
      poll is a count and a count needs voters; with one voter, bars are either
      meaningless or fabricated, and fabricating a baseline is the worst possible place
      to break rule 11. So the wing gives back the artefact — eight picks on a printed
      slip, shareable — and says on the screen, in the same voice a blocked source is
      documented in, that there is no count yet. `lib/polls/store.ts` is the seam: an
      async `BallotStore` with `countable`, local today, `poll_vote` keyed on
      `(device_id, question_id)` when the table lands. The screen never names a storage
      API — `tests/polls.test.ts` asserts that, and asserts no seeded vote exists
      anywhere in the wing.
      Six of the eight questions are answered from the WHOLE roster: the archive holds
      637 names and no positions, so a "goalkeepers" shortlist would have to be guessed,
      and one striker in it would make the wing untrustworthy. The supporter knows; the
      archive does not pretend to.
    A quiz and a toy are not the same screen and must never share a route.
    One roster sheet serves both gate 1 and gate 7 (`components/roster/RosterSheet.tsx`).
    The search ranking was tuned once against Maor's "it has to find a man by his family
    name"; a second copy would have drifted from it.

25. **A shirt wears the crest of its era, and the crest is PRINTED.** `crestForSeason()`
    resolves the era from the timeline; `lib/kit/crestMarks.ts` says which of Maor's
    seven artworks prints for it. A club crest is not a thing to approximate — print it
    or leave the slot empty. I broke this once more building the kit plate, drawing a
    shield with a stroke for the hammer, and Maor's correction was the right one: the
    marks are the heart of the thing.
    **The variant follows the cloth.** The club drew its early mark in red and in white
    for the same reason every club does: a red crest on a red shirt is a texture, not a
    badge. `onRed` names the light artwork and the shirt picks by its own base colour —
    the difference between having the assets and using them.
    **The maker is the alternative set** (`components/kit/MakerMark.tsx`). A
    manufacturer's trademark is not ours to redraw, so Maor supplied six alternative
    marks (STRIKE, ADIO, CLASSIC, BLACK DOG, ROMBUS, MICRON) and the archive needed two
    more, drawn in the same idiom for Kappa and Diadora. They are monochrome vector, and
    the NAME on the card stays the real one from the archive — who made a shirt is a
    sourced fact about the shirt; only the artwork was never ours. adidas takes the
    trefoil before 1992 and the bars after, which is the distinction the club's own
    shirts make.
    The sponsor is LETTERED on the fabric, not stamped in a black plate, because every
    reference shows it printed on the shirt.

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
npm run story:overlap                        # needs a dev server; fails on any collision
npm run story:cards                          # the same harness, as pictures
npm run qa:sweep                             # 14 routes × 4 widths: overflow, errors, yellow
```

## House skills that apply

`dubel-guidelines` · `brand-concept` (done) · `frontend-standards` · `football-data`
· `supabase-server-authority` · `responsive-qa` · `dubel-credit` (in the footer)

29. **The three acceptance claims are a script, not a memory.** Every delta says "no
    overflow, no console errors, no yellow". `npm run qa:sweep` is what establishes it:
    14 routes × 4 widths, antialiasing off (subpixel rendering invented 23,643 false
    yellow pixels the first time), and the hue band read back out of the script by
    `tests/brand.test.ts` so the scanner and `lib/isYellow.ts` cannot drift apart.
    It separates **a page that threw** from **a host this sandbox refused**: the ad and
    analytics scripts fail to load here on all 56 screens, and counting that as a fault
    made every screen red and buried the real signal. The test is the REQUEST's origin,
    not the message text.
    The opening animation is dismissed before each screen is measured rather than the
    home route being skipped — the exemption covers one file, and a scanner that looked
    away from a whole screen would hide the next real defect on the most important one.

30. **The opening plays over the wall, never instead of it.** `components/ui/Intro.tsx`
    is an overlay on `/`; the gates are rendered and complete underneath, so a shared
    link, a crawler and a slow connection all reach the ground either way. Once a
    SESSION (`sessionStorage`), dismissed by a tap anywhere, the plate, Escape, the
    clip ending, or the browser refusing to autoplay — a frozen poster waiting for an
    `ended` event that will never fire is worse than no opening. Off entirely under
    `prefers-reduced-motion`.
    Two things this got wrong first, both worth remembering:
    · **The seen-flag was written when the intro was chosen**, so React's development
      double-invoke read back the flag its own first pass had written and the opening
      never appeared. It is written when the intro ENDS, which is also what the name
      says.
    · **The clip is 1:1 and a phone is 1:2**, so `object-cover` cropped away the goal,
      the crowd and the שער 5 banner and left one torso. It is CONTAINED, and the ink
      the letterbox leaves carries the mark above and the skip below — a title card made
      out of the dead space beats a crop that throws the animation away.
    The QA browser is open-source Chromium with no h.264 decoder, so the video ships as
    **both** VP9/WebM and h.264/mp4: the client takes whichever one it can play, and the
    opening is verifiable here instead of assumed.

31. **An id a run deals must be unique, and that is checked, not assumed.**
    The timeline keyed a match card on `season:awayClub`. It looked unique and was not —
    Hapoel is recorded as the away side four times in 2001/02 and the Salzburg tie has
    two legs — so nine cards collapsed onto three ids. The anchor was then removed by
    matching its id, one duplicate removed two cards, and **seed 95 dealt a nine-card run
    that could never be finished**: the last card had no verdict. Four hand-picked seeds
    in the suite never touched it.
    Three things came out of that and all three stay:
    · **A hashed key may carry the date.** `publicId()` is a sha256, so putting
      `playedOn` inside the key is what makes it unique WITHOUT leaking anything — the
      reason the date was left out in the first place does not apply to a hash.
    · **Uniqueness is enforced where the pool is built**, by id as well as by date, so no
      future key can reintroduce it.
    · **The anchor is removed by position, not by equality.** Two defences, because a run
      that cannot be finished is the worst failure a mode has.
    `tests/timeline.test.ts` sweeps 300 seeds; `tests/identity.test.ts` does the same for
    every other mode — hate, goal, memory, kits, lineup, trivia — because the assumption
    that concatenated fields are unique is made all over this codebase and was only ever
    checked by whether anything happened to look wrong. They are all clean; the test is
    what keeps them that way.

32. **A key that is asked for must exist.** A missing message renders as the key itself —
    Latin, mid-sentence, in a Hebrew screen — and nothing was checking. `tests/i18n.test.ts`
    resolves every literal `t('…')` in `app`, `components` and `lib`, and rejects an empty
    message or an unfinished `{}` placeholder. Keys built at runtime cannot be checked
    statically and are not pretended to be.
    Retiring a screen retires its strings: the timeline's old `submit`/`up`/`down` keys
    outlived the form they belonged to. A tombstone is for a FILE (rule 26); a dead
    string is just deleted.

33. **A modal goes above the navigation. Always.** The tab bar is `z-50`; every
    `role="dialog"` overlay is `z-[60]`, and `tests/guards.test.ts` fails the build if
    one is not. This is not a z-index nitpick: the kit game's reveal sat at z-40, so
    **"לחולצה הבאה" landed inside the tab bar's strip and the tap that should have
    advanced the round navigated to the trivia wing** — on every shirt, on every phone.
    The roster sheet and the polls picker had the same defect and were fixed with it.
    Found by playing a round end to end in a browser, which is the only way this class
    of bug is ever found. **Play the whole thing, not one screen of it**: the same
    playthrough also caught the fifth shirt skipping its reveal, because the round was
    ending on `log.length` rather than on the last reveal being dismissed.

34. **Derive what the wiki already told you; never re-ask for it.** Maor's research brief
    (2.9.2026) requires `redirect_target` and `backlinks[]` on every imported page, and
    the obvious implementation of each is another API call per page — thousands of extra
    requests against a source this project is deliberately polite to (rule 11).
    Both answers are already in hand. A redirect page's whole content is
    `#REDIRECT [[Target]]` and the importer stores every page's complete wikitext, so
    `redirectTarget()` is a parse (it accepts `#הפניה` too). Backlinks are the inverse of
    the `links[]` the walk already collects, so `backlinkIndex()` inverts the map once
    after the walk. **What inversion cannot know is inbound links from pages that were
    never imported — a partial walk yields partial backlinks, and that is stated rather
    than papered over.**
