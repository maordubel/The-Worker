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
6. **Strict sport isolation.** Red-Fans contains both football and basketball. Football
   ingestion may accept only records explicitly classified as `football`; basketball
   ingestion may accept only records explicitly classified as `basketball`. `unknown` or
   mixed records enter neither. The two sports must never share canonical match, squad or
   competition records. THE WORKER LIFE may consume both sports through explicit
   sport-scoped canonical references.
   **The gate runs before every route, not before most of them.** `acceptFootballPage`
   sat in front of the schedule, season and round parsers and not in front of the squad
   categories, on the reasoning that a category page has no body to classify. A corpus
   containing `קטגוריה:סגל הפועל ת"א (כדורסל) 1980/81` walked past it and put a
   basketball player into a football squad — eleven characters in a page title. The gate
   classifies on title, categories AND body, so it catches this; what it cannot do is
   catch a route that never calls it.
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
   it, when, and why. `tests/brand.test.ts` asserts every entry carries an approver and a
   date, that the path is matched exactly so a folder can never be exempted by accident,
   and that the exempt file is referenced by `Intro.tsx` and nothing else.
   **This line said "exactly one entry long" until 17.9.2026, and the test it described
   said `toHaveLength(1)`** — which did its job: it went red the moment the opening film
   was registered, which is what a decision made out loud looks like. The assertion now
   NAMES the approved paths instead of counting them, so the next widening says
   which asset it added rather than that the number moved (the fifth, 22.9.2026, is the
   1997–2000 crest `public/brand/crests/keter-color.png` — *"שהיה עם צהוב. וזה מאושר! זה
   ההיסטוריה"* — rule 90 §4). A count in prose is a claim
   about the code and goes stale exactly like a manifest row does (rules 45, 73). Widening it is a decision somebody has to make out
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
    **Resolved on 2.9.2026, and the answer was BOTH.** The sandbox proxy denies
    `wiki.red-fans.com` with `connect_rejected (organization policy)` — so nothing here
    can ever reach it. Anthropic's own fetcher, on a different network path, gets a real
    `403` from the target: Cloudflare bot protection. Maor's browser reaches the site and
    is served `Just a moment...` — the JS challenge, which a human passes and an agent
    must not. So the corpus can only come from a HUMAN BROWSER, and the importer must be
    built around a file the owner exports, never around a command he runs.
    The site has no `/wiki/` path: every page is `index.php?title=<encoded title>`.
    Three attempts to drive the challenge through the desktop browser pane killed the
    bridge at the same point each time. Three is where that stops being bad luck.
    **`Special:Export` is therefore the route, not the fallback** — see
    `sources/wiki-export.ts`. It costs the owner a form and a download and it yields page
    id, namespace, revision id, timestamp and complete wikitext, which is every field a
    corpus row needs; the same store, the same idempotency on `page_id`. What it cannot
    give is the API's RESOLVED category, link and image lists, which are parsed out of
    the wikitext instead — a template-added category is invisible, and that is stated,
    not hidden.
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
    the primary source in this project — cite him as one (`sourceTitle: "ידע אישי —
    צוות The Worker, <date>"`) rather than dressing his knowledge up as a press citation or
    quietly leaving it out because a search did not surface it. The label is neutral
    because the owner ruled that his name is not presented as one of the archive's
    sources (spec §0.2, 22.9.2026) — his knowledge stays a source, his name stops being a
    credit, and `tests/owner-source.test.ts` fails on any source-like field that carries it. Research EXPANDS what he
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
    **21.9.2026 — the engine.** The renderer for gates 4 and 5, the archive and every
    `KitShirt` caller is now the kit engine: `resolveKitRender()` in `lib/kit/engine.ts`,
    drawn by `components/kit/KitEngineShirt.tsx` in two looks — `vector` (the period
    silhouettes of `body-templates.ts`) and `photo` (the same layers on a template's
    photographed garment: greyscale shading/highlight maps and traced masks from
    `scripts/kits/build-photo-templates.py`, never a crop of a real shirt). Its facts come
    from the Kit Master (`content/generated/kit-master.json`, `npm run kits:master`).
    `KitPlate` stays for the XI and ballot minis.

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
    **Exception, 21.9.2026 — Maor, answering "real logos or rule 25?": "REAL LOGOS."** In
    gates 4 (`/kits/build`) and 5 (`/kits`) — and only there — the maker and sponsor may print
    as the real logo where `lib/kit/mark-library.ts` has one; the engine takes
    `marks: 'granted' | 'rule25'`, defaults to the rule, and the Kit Master records the grant
    per kit (`render.marks`). A logo whose colours cross rule 8 (Arkia's stripes) is recoloured
    into palette tones and measured on the decoded file (`content/manual/kit-templates.json`).
    The CREST is not part of the grant: it is always the printed artwork (`crestArt()`).

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

35. **A natural key deduplicates. A stable id is what gets PERSISTED.**
    `MatchNaturalKey` is `sport|season|competition|home|away|stage` — the tuple the
    schema already declares unique and `match-events.json` already keys on. It is derived
    from the record's own fields, which is what makes it right for ingestion and wrong
    for anything stored: normalise a club slug, correct a misread stage, and the key
    changes.
    `CanonicalMatchId` (`lib/canon/matchId.ts`) is opaque and minted once. On a
    correction the id stays, the new key becomes `naturalKey`, and the superseded key
    joins `aliases` — so re-importing the uncorrected source resolves to the same match
    instead of minting a duplicate. `scripts/ingest/lib/matchIds.ts` is the only thing
    allowed to mint one, `content/manual/match-ids.json` is the registry, and
    `--write-ids` is opt-in because minting is one-way.
    **`sport` leads the natural key** because a club slug is unique only within a sport
    (`club_slug_sport_idx on club (slug, sport)`) — `הפועל-תל-אביב` names two clubs.
    **THE WORKER LIFE persists ids, never keys.** A saved life outlives many corrections
    to the archive under it; a life holding `football|1980/81|ליגה-לאומית|…` would lose
    that memory the day somebody fixed the competition slug. `m_9f2c0a41b7d3` cannot.

36. **The corpus is not the canon, and the step between them is a parser pass over
    disk.** `sources/wiki-corpus.ts` fetches pages; `sources/redfans-canon.ts` routes
    them to parsers and produces canonical rows; nothing in that second pass touches the
    network, so a parser change re-runs for free and a fact is always traceable to the
    revision it came from. Routing is by TITLE, because on this wiki the title states the
    shape: `לוח משחקים (כדורגל) 1980/81` is a schedule table,
    `קטגוריה:סגל … 1980/81` is a squad whose members are pages (not a table — the brief's
    headline finding, and the reason the old table parser would have reported all 98
    squad categories as unreadable), `עונת 1980/81 (כדורגל) מחזור 12` is one match.
    **Home and away are never defaulted.** A schedule that names only the opponent must
    mark בית/חוץ; a row that does neither is skipped and reported. Putting Hapoel at home
    by default would invent the half of a match's identity that decides which fixture it
    is.
    **And the title that sounds like the schedule is a HUB.** The first real export
    (2.9.2026) showed `לוח משחקים (כדורגל) 1980/81` to be five words and three links —
    the actual fixtures live in `לוח משחקי ליגה …`, `לוח משחקי גביע …`,
    `לוח משחקים גביעי אירופה …`, `לוח משחקי אימון …` and a merged
    `לוח משחקים מלא …`, and which of those exist differs by season. 1980/81 also calls
    `{{שליפת לוח משחקים פשוטה}}` and `{{1980/81}}`: the wiki runs Semantic MediaWiki
    (namespaces `טופס`, `Widget`, `יחידה`), so part of a schedule is a QUERY over
    per-match pages, not a table in the page. A parser that reads only tables will
    report those seasons as empty and be wrong about why.
    So the next export is never guessed: `wantedPages()` in `sources/wiki-export.ts`
    lists every page the exported pages LINK to and the export did not contain, and that
    list — the wiki's own words — is what gets requested next.
    **And two exports in, that chain reached the real answer: the wiki runs CARGO, and
    the matches are a DATABASE TABLE.** `תבנית:שליפת טבלת משחקים פשוטה` is a
    `#cargo_query` over `tables=Games` with
    `day, month, year, stage, host, oponent, homescore, awayscore, ona, department,
    mifal, shootout, comments, liga, result`. So a schedule page holds no fixtures at
    all; it holds a WHERE clause. Parsing schedule wikitext for matches was the wrong
    plan against the right-looking pages.
    Three consequences, and the third is the one that matters:
    · `Special:CargoExport` answers that table as JSON to any reader with a browser —
      structured rows, no wikitext, no table parser, every season in one request.
    · **`department` IS the sport**, stated by the source on every row (`כדורגל`,
      `כדורסל`, and `הפועל אוסישקין` as its own value). Rule 6 stops being a
      classifier's judgement and becomes a filter on a field the wiki itself wrote.
    · Friendly matches are the exception: `לוח משחקי אימון …` carries a hand-written
      wikitable, so both readers are needed and the table parser is not retired.
    **`Games` is 26 columns and the first export asked for 15.** The eleven that were
    missing are not filler: `stadium` is the venue, `hour` the kickoff, `coach` who
    managed, `shofet1..3` the officials, and `homegame` (1 / 0 / **x**) marks a tie
    played on NEITHER ground. `Special:CargoTables/Games` states the schema, so the
    schema is read before the export is written — never inferred from the columns a
    template happened to query.

37. **A squad is read from the PLAYER, not from the category file.**
    The brief treated the 98 squad categories as the obstacle. The real export showed the
    way through: every player page carries its own `סגל הפועל ת"א (<ענף>) <עונה>`
    categories — משה סיני's lists thirteen — so one export of the player pages yields
    every season each player belonged to, and the sport is INSIDE the category name, so
    rule 6 is enforced by the same read that finds the season.
    Membership taken from the file a page arrived in would be an artefact of how the
    operator ran the export; membership taken from the page is what the wiki says, and
    the same three files in any order produce the same rows.
    **`מספר בהפועל` is not a per-season shirt.** It is one value on a page covering
    thirteen seasons — the number the player is remembered by. Writing it into every
    season's squad row would state thirteen facts from one, and would let two players
    "share" a number they never shared. It becomes a single shirt-number holding; the
    squad rows keep `null`.
    **An unreadable value the source DID write is reported, not nulled.**
    `parseIsoDate` answers `null` rather than throwing, so the obvious try/catch caught
    nothing and a birth date vanished silently — the exact shape rule 11 forbids. It is
    now reported (`19.5.63` — a two-digit year, and the century is not guessed).
    **One export of `קטגוריה:שחקני הפועל תל אביב (כדורגל)` closed the whole thing:**
    645 pages, 624 players, 1,787 memberships across 99 seasons, 1927/28 → 2026/27. The
    three-season run done earlier from three separate category exports produced 19/17/17
    for 1980–83; this one produces the same three numbers from a different file. That
    agreement is the design being right, not a coincidence.
    `1967/98` appears as a season label on one page — a typo for 1967/68 in the source. It
    is reported and left alone; correcting a source is not this layer's job.

38. **`הפועל אוסישקין` is a `department` value, and the wiki says which sport it is.**
    `Games` holds 5,766 rows: 3,193 football, 2,483 basketball and **90 Hapoel
    Ussishkin**. Rule 6 forbids a mixed or unknown record entering either walk — and
    Ussishkin is neither: `תבנית:שליפת טבלת משחקים פשוטה` queries basketball as
    `department='כדורסל' OR department='הפועל אוסישקין'`, so the SOURCE states the
    relationship and the walk reads it. `DEPARTMENT` is a list per sport for exactly this.
    `תבנית:שםקבוצה` bolds `הפועל ת"א`, `הפועל תל אביב` and `הפועל אוסישקין` — the wiki
    declaring who "we" are — which is where the basketball club records in
    `content/manual/clubs.json` come from. They carry **confidence 1**: one source, read
    off a template, not yet reviewed, so rule 2 keeps them out of the trivia generator
    until somebody checks them.
    **`comments` is a football convention.** Reading it as scorers in the basketball rows
    invented twenty goals in a sport that does not record them that way; the scorer read
    is gated on football and the column is kept as a note elsewhere.
39. **THE WORKER LIFE is a GAME RUNTIME, not a fourteenth gate.**
    `/life` is the vertical slice of the life simulation: 1980, a child of eight, one
    Saturday in south Tel Aviv. It is not on the gate wall (rule 24 — the numbers are
    Bloomfield's and Maor's), it hangs above it as its own plate.
    The architecture is four layers and the boundaries are the point, because each one is
    a rule this repo already has, expressed as a module edge:
    - **`lib/life/` — the Life Engine.** Pure TypeScript, no React, no Phaser, no canvas.
      The save is an **append-only `LifeEvent[]`** and `LifeState` is what you get by
      folding it: that is what lets a chapter be rewritten without breaking a save, what
      makes "you went to Bloomfield alone at eight" a row rather than a stat, and what
      makes the eventual move to Supabase an insert rather than a migration. An unknown
      event from a newer build folds to a no-op; `tests/life.test.ts` asserts it.
    - **`lib/life/runtime/` — Phaser.** Scenes, placeholder art, physics, camera. Imported
      **dynamically, client-side only** — Phaser touches `window` at module scope. One
      `WorldScene` reads a `MapDef`; there is ONE scene class, which is what makes a 1990
      version of the same street a second layer list rather than a second scene. This
      sentence used to begin "there are nine locations" — there are twenty-one
      `LocationId` members today, and the half that mattered is the half still true.
      is what makes a 1990 version of the same street a second layer list rather than a
      second scene.
    - **`lib/life/content/` — the authored fiction.** A family, a friend, a kiosk. It
      states **no date, no opponent, no score and no scorer**, and the test suite fails on
      a scoreline or on any year but the two the chapter is set in.
    - **`lib/life/anchor-server.ts` — the ONLY bridge to history.** `server-only`,
      resolved in the route, handed to the client as a plain object. THE WORKER LIFE never
      reads `content/manual/*`, never parses anything, never sees Red-Fans. Asserted.
    **The anchor is the 1980/81 championship** — a sourced row in `trophies.json` at
    confidence 2 — and the deciding MATCH is not in the archive, so the game shows a
    marked `DEVELOPMENT PLACEHOLDER` on the historical card instead of inventing one
    (rule 11, brief §24). When a curated 1980/81 match row lands, `placeholder` goes null
    and the scene gets a scoreline. Nothing else changes.
    **All art is placeholder and generated, never shipped.** `runtime/figures.ts` draws
    the cast from a spec and `runtime/textures.ts` hands out texture keys, so production
    PNGs replace the drawing without touching a scene. The canon that is already fixed is
    encoded as data and tested: **Ofir has a buzz cut and nobody else does; Kobi keeps his
    approved direction; there is no glasses layer at all, so Amit cannot get a pair by
    accident; the child wears Hapoel red.** Every colour comes from `runtime/palette.ts`
    and every value in it is run through `lib/isYellow.ts` — rule 8 does not care that a
    pixel came from a `Graphics` call.
    **All text is DOM, never canvas.** Hebrew in WebGL has no bidi, no selection, no
    screen reader and no reflow. Scenes emit intents on a bus; React renders the words.
    **`npm run life:play` is the acceptance script** (rule 29, applied to a game): it
    opens the real build at three widths, plays the prologue, walks the child, leaves the
    room, talks to Kobi, takes a choice, and scans every frame for yellow and the document
    for overflow and page errors. Two bugs it caught that no screenshot would have:
    `scene.restart()` REUSES the instance, so every mutable field must be reset in
    `init()` or the pause set during a fade leaks into the next room and the child can
    never move again; and letting the keyboard and the thumb pad write the same axis meant
    releasing an arrow key left the child walking forever — they are separate channels now.

40. **THE WORKER LIFE is drawn with Maor's concept boards, not around them.**
    On 2.9.2026 the approved Stage A boards arrived — the cast, the 1980 home, the Jaffa
    street, the stones pitch, the whole Bloomfield approach, Ussishkin — and the game
    stopped drawing rectangles. Every backdrop and every person on screen is now a
    RECTANGLE OF A BOARD, cut by `scripts/life/build-art.py` from
    `scripts/life/art-manifest.json` into `public/life/art/`. That file is the record of
    which crop of which board became which asset; re-cutting one is a number, and dropping
    in a final production painting later is the same number.
    **The world model changed with it.** The boards are painted 3/4 interiors and streets,
    so a location is a painting plus a WALK BAND (`lib/life/world/scenes.ts`): the child
    moves in the band, scales with depth, and sorts against the people standing in it.
    Everything in a scene is a FRACTION of the backdrop, never a pixel, so a better cut
    moves no door and no person. `world/maps.ts`, `runtime/painter.ts`,
    `runtime/figures.ts` and `runtime/textures.ts` are tombstones (rule 26).
    **Three things the pipeline does, and each is an existing rule applied to artwork:**
    - **De-yellow.** Rule 8 is absolute and rule 27 gives artwork no exemption. 1980 Jaffa
      is warm and dusty, so a lot of sunlit pixels sit in the yellow band. The build
      ROTATES them to hue 26 at the same value — the badge's own treatment — over a band
      much wider than the scanner's (hue 30–80 at 0.18 saturation), because a pixel that
      is legal in a file can be pushed over the line on screen by a vignette, a particle
      or the browser's own resampling. `tests/life.test.ts` asserts every shipped asset
      reports zero.
    - **Palette PNG, never lossy.** Rule 27, and it is what keeps the whole art folder
      near six megabytes while a room costs a hundred and thirty kilobytes; scenes load
      their own backdrop, so opening the game costs a room and not a stadium.
    - **De-fringe.** A keyed cut-out's edge pixels still carry the board's cream, so a
      dark child arrives wearing a bright outline. Every partly-transparent pixel is
      repainted from its opaque neighbours. Without it every character looks stuck on.
    **The canon is enforced by the cut, not by a promise.** Ofir keeps his buzz cut, Amit
    never gets glasses and Kobi keeps his approved direction because nobody is redrawing
    them — `tests/life.test.ts` asserts the seven core characters come out of the cast row
    of the approved board and that the children are cut full-length.
    **Kobi and Rachel are half-figures on the board**, so the scenes put them where that is
    the truth: Kobi seated on the sofa, Rachel behind the kitchen table, Kobi in a packed
    terrace. When full-length parents are drawn they drop into the same slots.
    **On a phone the painting is FRAMED, not cropped.** A room painted across the frame
    cannot fill a 9:19 screen without losing its composition, so the camera viewport
    shrinks to the picture and the band underneath carries the dialogue box and the thumb
    pad — the layout the concept board's own UI panel shows. `bus.frame` publishes where
    the picture ends.
    **`npm run life:play` now also TOURS every location** by writing a real save into
    `localStorage` and reloading, which is simultaneously the strongest save/restore test
    in the project: if the save format drifts, the tour lands in the bedroom and the
    screenshots say so.

41. **A door you cannot see is not a door.**
    THE WORKER LIFE's first playtest failed in ninety seconds and it was not the player's
    fault: he stayed inside the flat because leaving was not obvious, and the clock took
    Kobi to the match while he was still working out the controls. Everything in this rule
    exists so that cannot happen again, in this chapter or in 1990.
    - **Every exit is LIT.** `ExitDef.light` paints a soft glow over the doorway in the
      painting, always on, breathing. `tone: 'daylight'` is reserved for the way OUT of a
      building; interior doors are warm. That one distinction is what stops the front door
      looking like the bedroom door, and `tests/life.test.ts` asserts the living room has
      exactly one daylight exit and that it goes to the street.
    - **Every interactive thing carries a VERB and a NAME.** `לגעת` told the player
      nothing; `דבר עם קובי`, `לך לרחוב`, `קח את הבקבוקים` tell them everything. The verb
      is a key in `messages/he.json` (`life.verb.*` long, `life.verb.short.*` for the
      phone button), the name is content. One button does all of it: **E**, with Space and
      Enter accepted and the touch button showing the short verb.
    - **Walking into a door works AND the button works.** A dwell keeps a passing step
      from throwing you into a room; a shop door dwells nearly a second because a shop is
      somewhere you stop. Two rules protect arrivals: no auto-exit fires in the first
      700ms of a room, and the door you just came through will not take you back until you
      have stepped off it. Without the second, holding a direction through the front door
      walked the child straight back inside, because the browser never re-sends a keydown
      for a key that is still held.
    - **The keyboard is owned by the SHELL, not by a scene.** `scene.restart()` builds new
      Phaser Key objects and the document does not re-announce held keys, so crossing a
      doorway used to leave the child frozen until the player let go. `app/life/LifeStage.tsx`
      holds the key set and writes `ctx.input`; scenes only read.
    - **The clock does not start until the child is in the street** (`onboard:street`).
      Time stays the chapter's antagonist — but it may not bill the player for learning
      which key moves. "I stayed with Ofir and missed the newspaper" is a life; "I could
      not find the door and Dad left" is a bug with a stopwatch. There is no "tutorial
      paused" sign; the day simply begins when the day begins.
    - **Two sentences of teaching, then never again.** `onboard:moved` and `onboard:acted`
      live in the save, so a returning player is not taught to walk twice.
    - **The room notices when you are lost.** 30s brightens every door, 50s puts a line in
      somebody's mouth (`SceneDef.stuckHe`), 70s points at the best exit from the edge of
      the glass. It all backs off the instant the player moves.
    - **No spawn may sit inside an exit.** That is an infinite bounce, it existed in three
      scenes, and it is now a failing test rather than a bug report.
    Every one of these is asserted twice: as data, in `tests/life.test.ts`, and as
    behaviour, in `npm run life:play`.

42. **THE WORKER LIFE — the console, the locks, and the way out of a conversation.**
    Three failures were reported by the person who owns this game, in one sentence each,
    and each one has a rule now.

    - **"לא ברור איזה מקש מפעיל" — the controls are a PLACE on the screen.**
      `components/life/ControlDeck.tsx` is the only console, and it draws two different
      ones: on a touch device a visible stick and a labelled action button, on a keyboard
      a legend of keycaps — arrows/WASD, E, Shift — lit exactly when the game is listening
      to them. It is never a shrunken copy of the other. It sizes off the band left under
      the painting, so a 360×640 phone gets a smaller but complete console rather than a
      clipped one, and it pads for `env(safe-area-inset-bottom)`. Every touch target is at
      least 44px, measured in the harness on every viewport. `TouchPad.tsx` and
      `Prompt.tsx` are tombstones (rule 26).
    - **"אין שום אתגר" — a door may have NEEDS.** `ExitDef.needs` plus `ExitDef.blockedHe`:
      the flat's front door needs the house key from the drawer, the road east needs to
      know there is a match on. A locked door is never hidden and never silent — it keeps
      its light at low alpha, keeps its name in the prompt, and pressing the button gets a
      sentence saying what is missing. `autoExits` skips locked doors, so nobody is walked
      into a refusal. There must always be at least one unconditional way through a gate
      (the veteran at Bloomfield takes the child in and charges twenty-two minutes for
      it), because a chapter that can dead-lock is not a chapter.
    - **"המשחק נתקע כשפונים למישהו שכבר דיברת איתו" — leaving is ALWAYS allowed.**
      Every line of every conversation draws an X in the same corner, and Escape does the
      same thing. `DialogueRunner.leave()` closes the box and applies NOTHING — no `then`,
      no chained node, no time — so the conversation can simply be started again from its
      first line. A branch the player no longer qualifies for is a normal thing to reach;
      a box with nothing left to press is not.

43. **THE WORKER LIFE — one cast, several ages, and no year on the caption.**
    The 1980 cast, the nineties cast (`kobi90-*`, `ofir90-*`, `amit90-*`) and the player's
    own three later ages (`hero80-*`, `hero90-*`, `soldier-*`) all ship at once, under
    decade-suffixed names; nothing replaces anybody. Stage A walks around as none of them.
    They are for showing a day as one point on a life — the ending's `after` pair and
    `components/life/LifeLine.tsx` — and for the chapters that come next. Captions there
    say ages and spans (`כעבור חמש־עשרה שנה`), never dates: the archive has no nineties
    match on file and a caption is not the place to invent one (rule 11).

44. **THE WORKER LIFE — de-yellow desaturates before it rotates.**
    `scripts/life/build-art.py` now has three bands, not one. The PAINT band (hue 30–80,
    S ≥ 0.18) is what gets touched. Inside it, only a TRUE yellow — hue 38–70 at S ≥ 0.55,
    which is gold, mark yellow, hi-vis — has its hue rotated to 26°. Everything else keeps
    its hue and is desaturated to S 0.26: olive, khaki, brass, dry grass, warm skin. The
    SCAN band the build reports against (hue 34–74, S ≥ 0.30) sits between the paint band
    and the canonical scanner in `lib/isYellow.ts` (hue 38–70, S ≥ 0.35), so a legal pixel
    keeps margin against a browser's resampling without being counted as a fault. This
    rule exists because the first pass shipped an IDF uniform in brown.

45. **THE WORKER LIFE — the master timeline, and the one place it is written down.**
    The protagonist is born in **1978**. He is five in 1983 (the prologue), eight in 1986
    (the Stage A climax), twelve in 1990, eighteen and conscripted in 1996, twenty-two in
    2000, thirty-two in 2010, forty-eight in 2026. There is no other timeline; a file that
    disagrees with this paragraph is the file that is wrong.

    Consequences already applied, and the pattern for the rest:
    - `DEFAULT_IDENTITY.birthYear` is 1978 and `loadLife(..., 1986)` sets the chapter year.
    - The chapter anchor is the **1985/86** league title and the prologue anchor is the
      **1982/83** State Cup — both real rows in `content/manual/trophies.json`, both at
      confidence 2 with a source. The archive holds no MATCH from this decade, so the
      deciding game stays an explicit placeholder. A brief that names a date, an opponent,
      a scoreline or a scorer does not override rule 11: put the match in the archive and
      the scene picks it up with no code change.
    - `lib/life/content/chapter1980.ts` is a tombstone; the content lives in
      `chapter1986.ts`. **Never re-date a file in place** — a file named for a year it no
      longer contains is how a codebase starts lying about itself.
    - A version-1 file is DROPPED rather than migrated. A v1 save describes somebody six
      years older than the game now believes, in a year that no longer exists. Silently
      reinterpreting an impossible age is worse than starting again. (`SAVE_VERSION` is
      now **4** — Stage B added fields and the routes pass added five more. Every file
      from version 2 up is READ rather than migrated, because the append-only log always
      recorded what HAPPENED. This line said **3** across two format bumps: a number in
      prose is a claim about `lib/life/save.ts` and goes stale exactly like a manifest
      row does — 16.9.2026.)
    - `tests/life.test.ts` allows exactly the years **1978 / 1983 / 1986** in authored
      content. Adding a year to that list is a decision, not a fix.

46. **THE WORKER LIFE — the real game systems pass, and the one thing it is for.**
    Stage A was a coherent world you could walk through once. This pass is what makes it
    a GAME you would start again, and the test it was built against is not a checklist —
    it is one sentence: *after finishing 1986, does the player believe a substantially
    different version of that Saturday was possible?*

    - **The state grew and NOTHING had to be migrated.** `LifeStateV2` adds resources,
      wellbeing, an eleven-axis personality, the Red Heart, six-axis relationships,
      relationship memory, the Red Box, live opportunities and a seeded random cursor —
      and a save written before any of it existed folds straight into the new shape. That
      is not luck, it is the append-only log paying for itself: the events always recorded
      what HAPPENED, so a richer reducer reads the same rows and produces a richer life.
      `SAVE_VERSION` is **4** (see rule 45) and every file from version 2 up is READ, not dropped.
    - **The old vocabulary routes into the new model.** A hundred lines of authored
      dialogue say `trait: 'footballAffinity'`; `TRAIT_ROUTE` sends it to the Red Heart.
      Rewriting the content to reach the new systems would have been a hundred chances to
      change what a scene means. Content keeps its words; the engine learned what they are.
    - **`CharacterId` is a string.** The union `'kobi' | 'rachel' | 'ofir'` meant every new
      person in 1996 was an edit to a type the whole engine depends on.
      `lib/life/characters.ts` is the registry; adding somebody is adding a row.
    - **Relationship 2.0, because one number lied.** Bond high and trust low with tension
      high is a real state — it is exactly a child who has just broken a promise to his
      father — and the reunion reads it. NPC memory is one queryable structure
      (`relationshipMemory`), never scene flags scattered through a Phaser file.
    - **The collision is PLACES, not a menu.** Six windows in
      `content/opportunities1986.ts` are open at once, in different rooms, and their costs
      together exceed the afternoon. Nothing on screen ever says "choose Ofir, Amit or
      Efi": Ofir is at the wall, Amit is outside the kiosk with a newspaper, Efi is on the
      pitch and gone by two. Walking somewhere IS the choice. A window that closes says
      nothing at all — you find out by going to look and finding an empty step.
    - **The street drains east, and that is the navigation.** `content/schedules1986.ts`
      moves people by the clock and `content/ambient1986.ts` fills the pavement with
      figures who are not there for the player. Before ten past three the street has a
      neighbour on it; after it, supporters, all walking one way, more every twenty
      minutes. The child works out where Bloomfield is from traffic, not from an arrow.
      **The timetable applies when the room is DRAWN**, not on the next minute tick —
      building from the scene definition and correcting a second later is how a player
      sees somebody who is not supposed to be there.
    - **Randomness is seeded and stored.** `lib/life/rng.ts` is a seed plus a cursor, both
      in the save, so QA can be handed a seed and see what the player saw, and a reload
      cannot re-roll a moment you did not like. Encounters are a weighted data pool with
      cooldowns. **Canonical history is never in a pool.**
    - **Four ways into the ground, and one of them still needs nothing.** Information
      (Amit's newspaper, gate seven), social (Ofir, the veteran), street (streetSmarts and
      the nerve to ask a family at the turnstile), resource (a ticket). Nobody climbs
      anything: the protagonist is eight, and §26 of the brief means what it says.
    - **PURE HAPOEL LOVE has an owner and it is `lib/life/pure-love.ts`.** No content file
      may set it, no effect may add to it, and `percent` is null and stays null for
      decades — a number here would immediately become the thing players optimise.
      `tests/life-systems.test.ts` asserts nothing else writes it.
    - **The PROFILE CARD has no bars and no numbers.** The Red Heart is SET, not
      plotted: each pull is a word printed at a size that says how much. A relationship is
      a distance on a rule with a slash for friction. `lib/life/profile.ts` is the only
      translator, so `ProfileCard` cannot accidentally render a value, and
      `tests/life-systems.test.ts` holds it to that. The debug panel — the one screen that
      shows the engine's own truth — is behind `NODE_ENV`.
      **This sentence used to say "the profile screen", and that was no longer true.**
      `components/life/Gauges.tsx` prints `{value}%` with a `<Bar>` and is mounted in
      `app/life/LifeStage.tsx` with no `NODE_ENV` gate at all — so a numeric screen has
      been shipping to players while this file said none existed. Found on 15.9.2026 while
      checking the life spec against the repo. See rule 63 for which one Maor kept.
    - **`tests/life-systems.test.ts` is the second suite, and it fails for design
      reasons.** A broken door is an art problem and belongs in `life.test.ts`; a chapter
      with only one solution, or two saves that come out the same, is a design problem and
      should say so in its own words.
    - **`scripts/life/index-sheets.py` rebuilds `sheets.json` from what actually shipped.**
      The index was written as a side effect of slicing, so it described one round of art
      while 213 figures sat on disk — and the guard reads the index, not the folder. Forty
      six names in `FIGURE` had no PNG at all; they are in `PLANNED_FIGURE` until their
      files are uploaded, because a runtime that names a figure it cannot load will 404 in
      front of a player.

47. **`lib/ingest/` was three stale copies, and the evidence is what settled it.**
    The production directive (§3.3) says not to delete importer files just to make a
    suite green — an ingestion capability destroyed as a side effect of Life QA is a bad
    trade at any price. So they were inspected rather than swept:
    · `guards.ts` is byte-identical to `scripts/ingest/lib/guards.ts`.
    · `dedupe.ts` is 303 lines against the live file's 324; `types.ts` is 425 against 611.
      Both are strictly OLDER, strictly SMALLER copies.
    · All three import `./normalize`, which exists at `scripts/ingest/lib/normalize.ts`
      and has no counterpart beside them — so they could never have compiled where they
      stood.
    · Nothing in `app`, `components`, `lib`, `scripts` or `content` imports the path.
      `tsconfig.json` already excluded it and `tests/imports.test.ts` already asserted
      the directory must not exist.
    They are duplicates of live files that live in `scripts/ingest/lib/`, and the
    importer keeps every capability it had. That is the difference between "delete it,
    the test is red" and "here is why nothing is lost".

48. **`THE WORKER LIFE` — the living pass: purpose-drawn art, and a street that is
    somewhere rather than something.**
    The systems pass gave the chapter its machinery. This one gave it a face. The rules
    that came out of it, in the order they will bite somebody next:
    - **`scripts/life/ingest-2026-09.py` is the pipeline for finished frames, and
      `build-art.py` is the pipeline for concept boards.** They are different jobs. A
      board arrives as a page of panels and is CROPPED; a delivery arrives as finished,
      correctly-proportioned frames and green-screen sheets and is taken WHOLE. The new
      script imports the old one's helpers rather than re-implementing de-yellow, because
      two definitions of yellow is one too many.
    - **Resample BEFORE de-yellowing, then de-yellow the PALETTE too.** LANCZOS averages
      a legal olive with its neighbour and lands the result inside the band, and
      quantising does the same thing to the 768-byte colour table. Rule 44 warned about
      the first; the second is why `clean_palette()` exists and why "no yellow in this
      file" is a proof rather than a sample.
    - **Key props by DISTANCE from the sampled background, not by a channel ratio.**
      `key_green` asks whether green beats red and blue by a third, which is right for a
      figure and wrong for a string of pennants: every edge pixel there is half cloth and
      half studio, the ratio says "not green enough", and the object arrives wearing the
      screen. `key_flat` + an opt-in `despill` fixed a bunting line that was a third
      moss by pixel count. `propPlanter` opts OUT of despill, because its green is real.
    - **A `LayerDef` is dressing as well as occlusion.** It gained `when` (the same
      `Condition` vocabulary everything else in `world/` speaks), `foot` (anchor by the
      point the object stands on — the top-left of a car plate is a point in the sky),
      and `flip`/`alpha`/`tint`. Conditions are read once at `create`, never on a tick:
      dressing that pops in while you are looking at it reads as a bug.
    - **Two guards in `tests/life.test.ts` make dressing safe, and they only look at
      dressing that is ON THE GROUND** — `foot` and a depth that reaches the walk band.
      That is exactly the set that can silently break a game: a car parked across a
      doorway is a door the player cannot use, and nothing in the engine would complain.
      A banner on a wall and pennants over a road are neither, and are not their business.
      Both guards caught a real fault the first time they ran.
    - **Ship no art that nothing places.** `propPylon`, `propHorn` and `propDrum` were
      cut cleanly, looked good, and were deleted — a pylon in the street's sky gap read
      as a sticker and a third pylon on the route read as a mistake. `PLANNED_FIGURE` is
      for names WITHOUT files; this is the opposite case and has no list.
    - **`scripts/life/playthrough.mjs` wrote `version: 1` saves for three passes.** v1
      has not been readable since the systems pass, so the loader dropped every one of
      them, the tour never left the landing page, and eight screenshots of the same
      photograph passed a yellow scan eight times. A harness that cannot fail is not a
      harness: the tour now writes the CURRENT save version and asserts the place it
      landed in by name.
    - **A schedule row OVERRIDES the scene's own actor position, so it has to stand inside
      that scene's walk band.** Three street rows were a few hundredths below it after the
      September backdrops moved the band from 0.9 to 0.86, which left Ofir in the kiosk
      doorway and Amit and Keren in the traffic: no prompt, no conversation, and nothing
      anywhere that said so. `tests/life-systems.test.ts` now asserts band and doorway
      clearance for every row, so re-framing a backdrop fails a test instead of emptying
      a street.
    - **`setScrollFactor(0)` pins a thing to the camera; it does not exempt it from zoom.**
      Phaser draws a scroll-locked object at `(p − half) × zoom + half`, so a full-screen
      overlay sized `cam.width × cam.height` only covers the glass when zoom is exactly 1.
      The street zooms past 1 on every viewport and looked perfect; gate seven zooms to 0.9
      and wore a visible pale box across two thirds of Bloomfield. The grade is now sized
      `cam.width / zoom` and offset by half the difference.
    - **A browser harness cannot police an invariant that two different causes satisfy.**
      "The clock ran indoors" and "a conversation charged the player twelve minutes" both
      arrive as `clock.advanced`, and three attempts at settling the race each reported a
      working game as a broken one on some viewport. The tick's `onboard:street` gate is
      now asserted on the SOURCE in `tests/life.test.ts` — and asserted to be the first
      statement in the method — while the harness checks only the part it can see: from
      the first frame to the first thing the child speaks to, the clock does not move.
    - **The tour reused one tab, and a running game autosaves.** Writing the next stop's
      save while the previous stop was still playing let the engine put its own state back
      before the reload, so the tour reloaded the stop it had just left. It now parks on a
      page with no game on it before writing. Same lesson as the save-version bug above:
      every one of these made the harness quietly agree with itself.
    - **פוגי is the protagonist and has three ages on disk**; the character formerly
      called "שלום" is **יוסף**, because שלום תקוה is a real footballer and two people
      with one name is a bug in the fiction. `KID_POSE` and `KID_WALK` in
      `runtime/art.ts` are the only place the runtime names his frames.

49. **THE WORKER LIFE — the final of Stage A, and the day the placeholder retired itself.**
    Rule 39 said it in 2026's words: *when a curated match row lands, `placeholder` goes
    null and the scene gets a scoreline; nothing else changes.* On 3.9.2026 Maor supplied
    the row — a ticket kept for forty years (משחק 15, ילדים, 7 ש"ח, מס' 053) and four
    dated pages of מעריב ספורט — and that promise was tested. It held.
    - **The match is in the archive, so the game may state it.** 24.5.1986, בלומפילד,
      הפועל תל אביב 1 מכבי חיפה 0, גילי לנדאו בדקה 86 מבישול משה סיני, שופט צבי שריר, both
      XIs, the red card at 90 — as rows in `matches.json`, `match-events.json`,
      `lineups.json`, `goals.json`, `moments.json`, `clubs.json` and `people.json`, at
      confidence 2 with sources. `resolveChapterAnchor` reads them; no scene has a date,
      an opponent or a score written in it, and none may.
    - **`decidingMinute(anchor)` is why the eighty-sixth minute is not a constant.** The
      scene holds its breath on whatever minute the archive says the goal went in. Change
      the row and the drama moves with it; delete the row and the scene plays a final
      whistle instead and states nothing.
    - **The scoreboard freezes on the archive's minute the moment it goes in.** The tick
      that notices `minute >= 86` can be on 87 by the time it fires; a board reading 87
      for a goal history records at 86 is a small lie in the one place this chapter spent
      three passes earning the right not to tell one.
    - **The count under אלופת המדינה is counted, not typed.** `countTitles()` filters
      `trophies.json` — ten league titles at or before 1985/86 — and the sources
      independently call this one the tenth. Agreement between a row count and an article
      is worth more than either.
    - **A time-lapse that does per-minute work is not a time-lapse.** At 26× the clock
      produced ~20 game minutes a second and each one folded the whole event log, re-ran
      the NPC timetable and ticked every opportunity window; the frame budget went, Phaser
      clamped `delta` to stop the loop spiralling, and the fast-forward ran at about one
      times speed. Neither job means anything inside a stadium, so `onMinute` returns
      early during the match.
    - **`watchMatch` was reachable from ONE place: the end of the reveal card.** A player
      who had already seen that card — a second run, a reload inside the ground, the QA
      tour — stood in a stadium where no match ever kicked off. `beginMatch()` asks a
      question about the world (this is the ground, the match is not over, nothing is
      running) and both entry paths ask it. A sequence reachable from exactly one code
      path is a sequence that has not happened yet for somebody.
    - **This container renders at 2 FPS**, headless and software-rendered, on every scene
      including the street. Anything timed in real seconds will therefore appear ~30×
      slower here than in a browser; measure the FPS before believing a pacing bug.
    - **`EndingCard` closes a Saturday; `StageFinale` closes a chapter of a life.** Two
      screens, in that order. Collapsing them was tried: the private ending and the public
      celebration undercut each other and the player reads a scoreline over a sentence
      about their father's hand. `buildFinale` in `lib/life/finale.ts` is pure, prints no
      number, and gives three different afternoons three different endings — with no best
      one, because §26 means what it says.
    - **The documents are their own art class.** `DOC` in `runtime/art.ts` is separate
      from `PROP` because a prop can be redrawn and a document cannot: nothing in this
      game may write on one, crop a point out of one, or print a gloss across one. The
      `{ e: 'doc' }` effect accepts only a declared `DOC` key, so a dialogue file can hold
      up a document and cannot name an arbitrary image.
    - **A guard that names its subjects protects only those subjects.** The QA-harness
      exemption test listed two files by hand while its own comment said "every harness
      under app/qa/". The finale harness was the third page in that folder and nothing
      would have noticed it shipping. It walks the directory now.

50. **THE WORKER LIFE — הצבעה: the game-feel pass, and the one sentence it came from.**
    Maor's note was *"התנועה מזייפת"* — the movement fakes it — with six games named as the
    floor, not the ceiling: Day of the Tentacle, Sam & Max, Full Throttle, The Curse of
    Monkey Island, Space Quest IV, Leisure Suit Larry 7. What those share is not an art
    budget. It is three pieces of craft, and each one is now a module edge with a test.
    - **You point, and he walks there.** `lib/life/runtime/walk.ts` owns the geometry and
      knows nothing about Phaser or about a scene, so `tests/life-walk.test.ts` holds it to
      arithmetic instead of to a screenshot. Ellipse blockers, because a walk band is
      foreshortened and a circle round a bin either clips its side or steals a metre of
      floor. A tangent detour that takes the shorter hand, recomputed every frame rather
      than searched once — which is also what recovers instantly when the obstacle is a
      person who has since moved. **The destination is never an obstacle**: the place you
      stand to talk to somebody is beside them, which is inside their own footprint, so the
      walk was blocked by its own destination and the child circled his father forever. And
      a walk that stops getting closer for a second and a half ENDS, because a steering
      behaviour can get stuck where a path search would have failed loudly.
    - **His feet do not slide.** The walk cycle advanced at `(delta / 1000) * 7.5` — frames
      per SECOND — so at the far end of a band, where the child is half the size and covers
      half the ground, his legs ran on the spot. `strideAdvance()` divides ground covered by
      0.84 of the figure's DISPLAY height, which is correct at both ends of any band without
      the scene knowing anything about it. That one line is most of what "the movement fakes
      it" meant.
    - **The ground is a ground.** A band's near/far scale ratio is decided by where the
      camera is: about 1.3× for a room, up to 1.8× down a corridor. The dirt pitch shipped at
      2.31×, which is not perspective, it is a dolly zoom, and crossing that yard read as
      being pushed towards the camera. Every scene's ramp is now a failing test.
    **התמונה היא לא ג'ויסטיק.** Half the lower painting was an invisible drag pad. Teaching
    it to tell a tap from a drag made it work and did not make it right — in a point-and-click
    the painting means one thing and means it everywhere. The stick is hardware on the deck
    below, where it cannot eat a tap on the world.
    **A camera viewport is not a canvas.** On a phone the viewport shrinks to the picture and
    the canvas stays the whole box, so `cam.width / rect.width` — right on every desktop —
    squashed the world into the top of the glass, and a thumb on the boy's feet arrived at
    his chest. Two rules came out of it: a client point converts through `scale.width` and
    only then subtracts the viewport origin, and `onPicture()` refuses a pointer that is not
    on the painting at all, because Phaser will happily answer `worldX` for a thumb on the A
    button.
    **Arriving is a meeting, not a distance check.** `turnTo()` faces the target before the
    first line — that frame is frozen for the whole conversation. And a narration line gets
    no talking head: the box drew its ink strip for a speaker who was not there, and 54px of
    empty black above a sentence reads exactly like a portrait that failed to load.
    **`serve.sh` is not a convenience.** Twice in one session a probe called a working game
    broken because a stale `next start` still held port 3000 and served a build from before
    the fix. The chunk hash in the HTML is the only honest witness, and the script refuses to
    report success unless it matches the chunk on disk. (Related, and cheaper to learn here:
    `pkill -f next` matches the shell's OWN command line and kills the caller.)

51. **A delta is built from `origin/main`, never from the last commit.**
    Maor: *"מרגיש לי שיש מצבים שהקוד מושך תמונות ישנות ולא מעודכנות."* He was right, and the
    cause was not the code. Deltas were being cut from the previous LOCAL commit while
    `origin/main` sat twelve commits behind — so every upload carried one commit's worth of a
    twelve-commit gap, and the site kept loading art from before the September ingest.
    `scripts/life/delta-zips.py` cuts against `origin/main` by default, splits at 99 files
    AND at 45MB (a browser upload takes 100 files; a chat attachment does not want 140
    megabytes), keeps the repository's own folder structure inside each ZIP so a drag lands
    every file where it belongs, and prints the deletions separately — because GitHub's web
    upload adds and overwrites but never deletes (rule 26), so a retired path is a manual
    step stated in text or it is a broken deploy.

52. **THE WORKER LIFE — full-bleed, camera-framed: the picture is the glass (3.9.2026).**
    Maor's word for the framed picture with a console under it was "cut", and the bar he
    named was Very Little Nightmares: the room fills the phone, the child is small in it,
    you touch and he goes. Four things carry that, and each has a reason it is shaped the
    way it is.
    **Cover, not contain — but of the WORLD, not the painting.** Our rooms are 16:9 and
    wider; a phone is 9:19.5. Covering the glass with the painting alone shows a quarter of
    the street with a child a third of the screen tall; keeping the width leaves black bars.
    So `scripts/life/finish-backdrops.py` continues every painting: a `--sky` strip above
    and a `--ground` strip below, the picture's own edge rows stretched, blurred and faded
    fast into the ink. The room stands in the dark like a diorama — which is how VLN lights
    its rooms — and every coordinate in every scene file is still a fraction of the ORIGINAL
    painting. `fillCamera` covers the tall world; in portrait the zoom then aims to show ~42%
    of a 16:9 room's width (`WorldScene.frameWorld`), the camera follows with the child's
    feet at 68% of the glass (`followPlayer`), and the shell is told `frame: 0` — no frame.
    **The picture is the controller.** On a phone the arcade deck is OFF by default; the
    `TapChip` at the foot of the glass names what a tap would do and is itself the button.
    The deck is one toggle away in ☰ and the choice lives in `localStorage`, not the save.
    **Housekeeping lives in ☰ (`LifeMenu`), because the strip under the glass no longer
    exists.** `100dvh` + `overflow-hidden` pushed autosave/reset below the fold; a control
    nobody can reach is not a control. The menu pauses the world. Restart-mission and
    restart-day are NOT in it yet — they need the checkpoint layer over the event log, and a
    menu entry that lies about what it can do is worse than one that is missing.
    **An arrival card is direction; its consequences belong to one room.** `playArrival`
    raised `went:alone`, opened the 1986 anchor card and started the match for ANY scene
    with a card — and the outside of Bloomfield and the Ussishkin hall had just been given
    cards. Walking up to a ground is not arriving at the final; the side effects are gated
    on `bloomfield-inside`.
    **Finishing is a pass, not a hope.** Six backdrops landed at 2048×1152 and ~3MB each,
    skipped `build-art.py`, and the manifest still described the files they replaced — so
    the room-budget test and the yellow scan were both blind. `npm run art:finish` shrinks to
    1600, quantises, de-yellows, writes the strips and rewrites the manifest; `tests/life`
    now fails if any backdrop is missing its strips. Two lessons inside it: de-yellowing a
    sunlit pitch by rotating it to the badge's brown made a RUST field — grass leaves the
    band upward, to green (`GREEN_SPLIT`, and `GREEN_BELOW` for the one painting whose
    grass is genuinely ochre); and a walk sheet of a DIFFERENT boy (shorts, no badge) is
    worse than two frames of the right one — `KID_WALK` rolled back until a matching sheet
    arrives.
    **A door is placed by looking, not by reading.** Two doors in one day were placed by
    numbers: one on a graffiti wall where two children stand, one on a corner pillar with
    three painted men. `npm run life:boards` draws every scene with its exits, lights, band,
    actors, hotspots and spawns onto the painting (`docs/life-shots/board-*.png`), and that
    picture is the definition of "placed".
    **The boards are NOT committed** (16.9.2026). Ninety-three of them had been, and they
    are ninety-three megabytes — a generated diagnostic, rebuilt by one command, sitting in
    every delta and pushing it past the size limits rule 51 exists to keep. `npm run
    life:boards` makes them; `.gitignore` keeps them out. What travels is the tool.

53. **THE WORKER LIFE — the map is a list, the day restarts from the log, the HUD says the date (3.9.2026).**
    Maor asked for two things on top of the full-bleed pass: the day's date in the top bar,
    and a "מפה" button to move between screens. The date is `longDateHe(anchor.match.playedOn)`
    — the archive's own date, never typed in — so the bar reads `24 במאי 1986 · הרחוב`.
    The map (`LifeMap`) is deliberately a LIST and not a drawing: a drawn neighbourhood
    invites reading the world off a diagram, and "going somewhere is the choice" is a rule
    here. `WorldScene.places()` walks the door graph breadth-first from the current room
    through the doors that exist right now; a place behind a door that `needs` something is
    still listed, shut, with that door's own label as the reason (`סגור — מזרחה, אחרי
    האנשים`). Choosing charges `hops × 4` game minutes as a `clock.advanced` event and plays
    the door's own fade — nothing teleports, the log stays honest. Restart-day is
    `LifeEngine.restartDay()`: the log cut back to the last `chapter.entered`, then a page
    reload, because a scene restart over a rewritten engine is a second save system in
    disguise. Restart-mission is still not offered — the 1986 log has no mission markers.
    `scripts/life/map-probe.mjs` proves all three in a browser.

54. **THE WORKER LIFE — Stage B, first movement: 12.5.1990, and the four years before it (4.9.2026).**
    The chapter is DATA now. `lib/life/content/era.ts` is one record per chapter —
    timetable, opportunities, encounters, ambient, endings, objective, cutscene, player
    figure, portraits, memory prefix — looked up from `state.chapter`; `WorldScene` asks
    the record and imports no 1986 file by name. Rooms are shared and redressed: an actor,
    hotspot or layer carries `era` (`'1986'` by default, `'1990'`, or `'*'`), and doors are
    geography (`exitInEra`, default every year). `arrivalByEra` / `stuckByEra` let a room
    play no card and say a different sentence in a year the boy already knows it.
    **The four years are a scene** (`PassageScene`): the same bedroom, four objects, and
    each look moves time — the ball goes, the bag grows, the wall fills, and between the
    second and third look he is drawn older (`hero80`). It writes ONE event,
    `year.entered`, which resets the day and keeps the person — memories, Red Box,
    relationships, seed, and every `life:` / `onboard:` / `cutscene:` / `prologue:` flag.
    (The first cut dropped `prologue:done` and replayed 1983 on the terrace.) The 1986
    finale's button starts the passage — the roadmap's bug; it used to `travel('bedroom')`
    into the Saturday that had just ended — and `BootScene` reopens a finished-1986 life in
    the passage, not the Saturday.
    **The match is an information game** (`runtime/match1990.ts`, brief §15–§20): three
    states kept apart — canonical (Hapoel's goals from the anchor; Yavne in the SOURCE's
    words, level/ahead/further, never a number), known (what he heard, from whom, how
    stale), rumour (the kids, off the seed, recorded as `rumor:*`). Sources have latency,
    so a boy can bring his father news the father's radio has not played (`net:toldKobi`).
    The director owns the clock while it runs (`timeScale = 0`) and jumps the afternoon to
    full time as an EVENT at the whistle — the first run let the old `FULL_TIME` trigger
    end the match from the day clock. No minute is ever shown for a goal, because the
    archive holds none. The parallel match's score is in `matches.json` as NULL at
    confidence 1 — the brief's 4–0 is unverified, and `findDecider` cannot read a row with
    no score, which is the point.
    **The archive rows came first.** `ליגה-ארצית`, three clubs, the 6–0 with its walla
    source, the scorers as a recorded CONFLICT (walla: Jano ×2 + Albez; the brief: Jano
    ×3) — and so no line in the game attributes a goal to a name.
    **Headless is 6 fps.** Every probe that walks by key must hold a key for several frames
    (340 ms) and wait for the box after E, or it re-triggers the person it just left. And
    `pkill -f <pattern>` kills the shell that ran it.

55. **THE WORKER LIFE — the feet are a number the bob never touches; a person's size is absolute (4.9.2026).**
    Two things the second pass over delta 16 found by walking, not by reading.
    **The drift.** The walk bob wrote `player.y = ny - bob` and the next frame read
    `player.y` back as the ground, so every side-on walk crept toward the horizon — a
    third of a per cent a frame — until the boy stood on the band's far line and the door
    zones he walked through (drawn to that same line) missed him by a rounding error.
    `groundY` is the feet; the sprite bobs above it; `autoExits` reads `groundY` with a
    hair of tolerance on every edge. It had been there since the bob was added and was
    invisible in the 1986 probes because those walk short distances. **Any movement
    change is verified with `gate-probe` (walk through a door zone in BOTH directions,
    log `where()`), not by eye.**
    **The size.** `ActorDef.size` is absolute — the band scales the BOY, not the people —
    so a man "at the table" on the far line drawn at a near-line size sits on the floor
    in the middle of the room at the size of a wardrobe. `ERA=1990 npm run life:boards`
    draws every room with its people at the size the runtime draws them and the boy at
    both ends of the band (the 12-year-old is `PlayerFigure.scale` = 1.12 taller than the
    rooms were measured for); `ERA=1990 npx tsx scripts/life/actor-sizes.ts` prints the
    ratio of every person to the boy standing on his line. A placement is not done until
    its board has been looked at. Props that live on furniture use `prop.at` — drawn on
    the tabletop, reached from the floor.
    **The probe hook.** `window.__life` exists only when `localStorage` holds
    `the-worker:life:probe = 1`, and `debug.where()` answers for the world scene or the
    passage, never for a scene that is not running (`getScene` returns instances that
    were never initialised; calling into one reads `ctx` of undefined).

56. **THE WORKER LIFE — planes, popups, a voice, and the third delivery (4.9.2026, delta 17).**
    **Planes.** `PARALLAX` in `art.ts` names the rooms that have `--far/--mid/--near`;
    `buildParallax` hides the flat painting and draws the three at 0.86 / 1.0 / 1.16 of
    the camera on X only. MID is pixel-aligned with the flat painting, so every fraction
    in `scenes.ts` still means what it meant; NEAR is drawn over the child, scaled by the
    same 1.16 and pulled 7.5% left so the object painted at the left edge does not cover
    the first door. Vertical never parallaxes — the camera roams the extension strips.
    **Popups are one component** (`Stamp.tsx`): a toast with `art` is a ticket, without
    is a strip; `PlaceCard` names every door after the first; `TitleCard` is the film
    card. The DialogueRunner attaches the art of the last `give`/`memory` in a `then`
    list to the toast that follows it — content does not name art.
    **The dialogue box types.** `TYPE_CPS = 42`; a tap while typing prints the rest,
    E goes through the box's `[data-life="continue"]` so the keyboard gets the same two
    beats. Under `the-worker:life:probe = 1` (or reduced motion) it prints at once — the
    probes read whole lines and press E once per line. The complete line is always in
    the DOM (`sr-only`, `data-life="line"`).
    **Sound is synthesised** (`audio.ts`): no files, no licences, one `LifeAudio` in the
    shell, woken by the first gesture. Scenes emit `sound` bus events (`step`, `door`,
    `whistle`, `roar`, `radio`) and `place` carries `ambience`; the shell maps them. Muted
    is `the-worker:life:sound = off`. A room's `ambience` now also picks its air and
    grade (`hall` is new: dust in window light, a deeper vignette).
    **Doors lock by chapter** (`needsByEra`, `needsFor`): the 1986 key and the 1986
    "you don't know there's a match" gate were both applied to 1990 for a week, and no
    probe caught it because every probe seeded its scene. Seed the FIRST room of a
    chapter and walk out of it, once, before calling a chapter playable.
    **Ingest** is `ingest-2026-09c.py`: green sheets even when the PNG has an alpha
    channel (the delivery's RGBA was opaque green); walk sheets drawn facing left are
    mirrored on the way in; alpha planes are quantised WITH alpha and their palette is
    de-yellowed in RGBA (`clean_rgba_palette`).

57. **THE WORKER LIFE — first person, three ways and no fourth (4.9.2026, delta 18).**
    The engine stays a side-scroller; the boy's own eyes are borrowed for MOMENTS, and
    only three shapes of moment exist. (A) `Panorama.tsx` — a 4:1 cylindrical painting
    (`PANORAMA` keys, 4096×1024, horizon 48%) turned by drag / momentum / gyro, with
    marks (`PANO_SPOTS`, yaw + pitch → an `act`) that start a conversation from
    `dialoguePanoramas.ts`; opened by an `act: 'pano:<key>'` hotspot (verb `gaze`,
    label "סביב" → "הסתכל סביב") or by the scene itself (`openPano` — the reveal at the
    tunnel mouth, the morning after). (B) `TunnelWalk.tsx` — a raycaster for the ONE
    corridor whose meaning is what is at its end: 3 cells wide, fog ink→cream by
    progress, people ahead at nearly the boy's pace so he walks BEHIND them, `dt`
    capped at 0.1 s so a 6-fps phone still arrives; `travel()` intercepts
    `bloomfield-tunnel → bloomfield-inside` in 1986 once (`saw:tunnelWalk`). (C)
    `CloseUp.tsx` — `Say.closeUp` puts a face under the line with a slow push-in;
    until a plate is in `CLOSE_UP_PAINTED` the portrait stands in, pixelated on
    purpose. No hands, no gun, no free-roam 3D — a fourth mechanism is a new game.
    Stand-in panoramas (`make-panoramas.py`) are mirrored backdrops ROLLED so the
    first painting's centre is yaw 0; the yaws in `PANO_SPOTS` are placed for the
    painted ones (`ART-BRIEF-FIRST-PERSON.md`) and get nudged when they land. Probe:
    `firstperson-probe.mjs` (`DESKTOP=1` for 1440×900) — holds a key and polls,
    because 600-ms bursts never get past the walk ramp on a wide stage.
    `pack-delta.sh` now drops files byte-identical to `origin/main`, so a delta is
    only what Maor has not uploaded yet.

58. **THE WORKER LIFE — ליל אוסישקין, ומה שהופך יום לחובה (5.9.2026, דלתא 19).**
    **הפרק השלישי הוא נתונים, כמו השניים לפניו.** `ERA_1991` הוא רשומה: לוח זמנים, חלונות,
    מפגשים, סופים, מטרה ופנים. שני חדרים חדשים (`classroom`, `schoolyard`) ושער בית ספר
    ברחוב שקיים רק ב-1991 — הפעם היחידה שקובץ הסצנות מכופף את הכלל "דלת היא גאוגרפיה",
    כי הפער שבו הוא נמצא הוא בדיוק המקום שבו 1990 מעמידה את הוותיק עם הרדיו.
    **הבמאי של הערב לא שם מספר על המסך.** `derby1991.ts` מריץ ארבעים דקות של משחק כמצב-רוח
    של אולם — עשרה ביטים, ריצפת רעש, שקט מוזר — ו**הלוח נשאר ריק עד הצופר**, כי הארכיון
    מחזיק תוצאה ולא מהלך. ההפרש ("עשר") מחושב מהעוגן ונאמר פעם אחת, בלחישה, בכיתה למחרת.
    שורת הכדורסל היא `content/manual/basketball-matches.json` עם פותר משלה — כדורגל
    וכדורסל לא מתערבבים בשום טבלה.
    **העוצר נעשה ברגליים.** הבמאי מזיז את שעון היום בקפיצות, כך שתשע וחצי *מגיעה* על ה-HUD
    בזמן שהאולם רועד; היציאה מהדלת היא התשובה, ו-`travel()` מיירט אותה. שלושה מסלולים
    שלמים: נשארת (`curfew:broken`), יצאת (`curfew:kept` + `heard:wall`), ולא היית
    (`DerbyFromAfar` — רדיו במטבח).
    **הכניסה לאולם היא המסדרון בגוף ראשון.** אותו ראייקאסטר של דלתא 18, `variant`
    שני: מפה קצרה, אנשים איטיים וקרובים, ואור חם בקצה במקום שמיים. בלומפילד אומר שהעולם
    גדול מהילד; אוסישקין אומר שהוא קרוב אליו מדי.
    **24.5.1986 הפך לחובה.** שבת שנגמרת בלי להיכנס לא סוגרת פרק — היא מחזירה את הבוקר:
    כרטיס לפי המסלול, בדיחה אחת ("החיים האחרים": השוטר, הכובע הצהוב-כחול, בית״ר), ואז
    `restartDay()`. **רק 1986 ורק `missed`** — "שמעת מהרחוב" ב-1990 ו"לא היית בדרבי" ב-1991
    הם סופים שהבריף מבקש בשמם.
    **דמות היא שורה לפני שהיא פנים.** כל הקאסט של ה-Character Bible רשום ב-`characters.ts`
    **בלי `portraitSet`**, ובדיקה נופלת אם מישהו מצביע על פלייט שלא קיים. `crowd.ts` בוחר
    מתוך שנים-עשר אנשים בלבד (`CROWD_POOL`), לפי עידן, בלי לחזור על אדם באותו חדר —
    ומי שהסיפור מחזיק (מישל, עומר, בארי) לא נמצא בכובע מלכתחילה, לא מתוך זהירות אלא
    בקונסטרוקציה. `day.entered` הוא המעבר הקטן: מאפס יום, שומר את הקופה, את החולצה ואת
    ההבטחות (`own:`, `promise:`).
    **המפרט לצייר נוצר מהקוד.** `node scripts/life/art-spec.mjs` כותב את
    `docs/life/ART-SPEC-GEOMETRY.md` — כל דלת, כל אדם, כל חפץ, במספרים של הציור. ציור
    שמזיז דלת מזיז מספר בקוד, לא להפך.

59. **מקור אחד לכל דבר — one runtime concept, one canonical file (7.9.2026).**

    `origin/main` carries 51 source files in the repository ROOT — `LifeStage.tsx`,
    `WorldScene.ts`, `dialogue.ts`, `dialogue (1).ts`, eleven chapter files — and 53 loose
    assets beside them. Every one is a flattened copy of a file that also lives under
    `app/`, `components/` or `lib/`. They came from the GitHub web uploader: dragging the
    FILES out of a delta zip instead of the FOLDERS drops them at the root.

    None of them is imported. `tsconfig.json` includes only `app/`, `components/`, `lib/`
    and `types/`, so a root copy is never typechecked, never bundled and never run — which
    is precisely what makes it dangerous. Maor's audit names the failure exactly: *"Claude
    reports the bug fixed; the root file contains the fix; production behaviour does not
    change."* A green test run on a repository with two `LifeStage.tsx` in it proves
    nothing.

    So, without exception:

    - **Never edit a root-level copy of a runtime source file** because its name matches
      the request. Find the file the application imports — `app/`, `components/`, `lib/`
      are authoritative — and edit that one. If evidence ever says otherwise, put the
      evidence in the commit message.
    - **Never deliver a `.ts`/`.tsx` to the repository root.** A delta ships folders. The
      upload instruction that goes with every delivery says *drag the folders*, because
      that is the difference between a file landing in `lib/life/` and landing in the root.
    - **`npm run repo:hygiene` is the enforcement** (`scripts/check-repo-hygiene.mjs`) and
      it runs first in `doctor` and first in CI (`.github/workflows/ci.yml`). It fails on
      source or assets at the root, on copy-marked names (`foo (1).ts`), and on any root
      file whose basename already exists in a production directory.
    - **Report the canonical path in every fix.** "Fixed `LifeStage.tsx`" is not a report;
      "fixed `app/life/LifeStage.tsx`, which `app/life/page.tsx` imports" is.

## 60 · היסטוריה היא נתון, לא קבוע בקוד

מ-7.9.2026 כל יום מתועד שהמשחק משחק — 12.5.1990, 2.5.1998, ואלה שיבואו — חי ב-`lib/life/history/days.ts`
כזרם אירועים, ולא כטבלה בתוך הקובץ שמנגן אותו. שלושה כללים, ושלושתם נבדקים ב-`tests/life-history.test.ts`:

1. **`minute` הוא מה שמקור אומר. `pacingMinute` הוא מה שהמשחק עושה.** שני שדות נפרדים כי אלה שתי
   טענות שונות. איפה שאין דקה במקור — `null`, ונשאר `null`. שום נוחות לא ממזגת ביניהם.
2. **`confidence: 'disputed'` ⟹ `speakable: false`.** אירוע שאף מקור פומבי לא נושא רשאי להריץ את היום,
   אבל אסור לו לשים שם בפה של אף אחד. מה שדמות אומרת נמצא ב-`lineHe`, ובו אין מספר, אין שם כובש ואין תוצאה.
3. **סתירות נשמרות, לא מוכרעות.** שני מקורות שחלוקים — שניהם ב-`conflictNote`, כמו ב-`fact-conflicts.json`.

הזמן, ההשהיה, השמועה, גל הידיעה ומדיניות הסיום שייכים ל-`ParallelHistoricalDirector` — מודול טהור, בלי
Phaser. יום חדש הוא תצורה (`presets.ts`), לא מנוע חדש. נקודת השמירה של אירוע־אב יושבת ליד היומן ולא בתוכו
(`lib/life/checkpoint.ts`), ואפקט שחייב לקרות פעם אחת בחיים עובר דרך `onceIn`.

## 61 · תיקיית הגרפיקה היא WebP, והצהוב נמדד על הפענוח

מ-13.9.2026 `public/life/art` כולה WebP ואין בה PNG אחד. `scripts/life/to-webp-2026-09-13.py`
הוא הממיר היחיד, והוא גם ההוכחה: כל קובץ מקודד, **מפוענח**, ונספר עליו צהוב על הבייטים שנשמרים;
מה שנשאר מנוקה בשכונה שלמה ומקודד שוב, וקובץ שלא מגיע לאפס נשמר ב-WebP חסר אובדן, שבו הפענוח
מדויק. זה מה שמתיר את הפורמט המאבד שכלל 27 אסר: הכלל שם חשש **שפענוח ממציא צהוב**, וזה נכון —
התשובה היא למדוד את הפענוח, לא להימנע מהפורמט. בלי המדידה הזו החזרה ל-PNG היא ברירת המחדל.

- **כל מי שכותב לתיקייה מסיים בממיר.** `art:finish` וסקריפטי הקליטה המתוארכים עדיין כותבים PNG,
  ו-PNG ב-`public/life/art` הוא מעכשיו תקלה: `tests/life.test.ts` ו-`tests/life-doors.test.ts`
  דורשים `.webp`, ו-`index-sheets.py` סופר `.webp` בלבד.
- **מנקים לפי פס רחב יותר מהפס שסופרים בו** — כלל 44, באותו היגיון: הניקוי עובד על
  hue 34–74 ב-S 0.30, וההוכחה נספרת על הפס הקנוני של `lib/isYellow.ts`. בלי המרווח הזה
  ההמרה עברה נקייה ו-`life:play` ספר 23 פיקסלים ביציע בלומפילד — קידוד מאבד מזיז פיקסל
  גבולי פנימה, ואז הדפדפן מקטין את הציור ומזיז עוד. `--index` מודד מחדש את התיקייה
  מהדיסק וכותב `bytes` ו-`yellowLeft` מהבייטים ששמורים, כי מניפסט שמדבר על ריצה ולא על
  התיקייה הוא בדיוק המספר ש-`tests/life.test.ts` קורא.
- **הפתיחה נשארה PNG.** `public/life/opening` ו-`public/life/docs` לא נגעו. לכן
  `OpeningSequence.tsx` בוחר סיומת לפי התיקייה ולא לפי הקובץ — `from === 'art'` הוא WebP, וכל
  השאר PNG.

**והמסירה הזו נחתה בשורש (כלל 59), וחצי ממנה לא הועלתה בכלל.** 498 מתוך 943 הקבצים הגיעו,
חתוכים לפי סדר אלפביתי ב-`ofir-walk`, והקוד המעודכן ישב כ-11 קבצים שטוחים בשורש בזמן
ש-`components/`, `lib/` ו-`tests/` עדיין טענו PNG. **מסירת פורמט שהוחלה חצי נראית כמו ריפו עובד**,
כי ה-PNG-ים שהיא אמורה להחליף עוד שם והקוד הרץ עוד מצביע עליהם. התיקון היה להריץ את הסקריפט של
המסירה עצמה על ה-445 שנותרו במקום לחכות לחצי השני של ההעלאה — המקור היה על הדיסק, אז ההמרה
הייתה אחת ולא שתיים. שלושה מקומות שהמסירה פספסה ולא היו מתגלים עד שמישהו יפתח מסך:
`CoinCard.tsx`, `lib/life/city/pano.ts` ו-`lib/life/city/slab.ts`.

## 62 · הוורמיליון הוכהה, והסיבה היא קריאוּת ולא טעם (15.9.2026)

`--red` היה `#E0401C` ועכשיו הוא **`#B02D10`**. זו החלטה של מאור, בשתי מילים —
"#B02D10 · אפשרות א׳" — אחרי שהוצגו לו שתי הדרכים זו לצד זו.

**המספר שהוליד אותה:** `#E0401C` על `--paper` נותן **3.22:1**. WCAG AA דורש 4.5:1 לטקסט
קטן ו-3:1 לטקסט גדול — כלומר הוורמיליון עבר בכותרות ונפל בכל טקסט קטן, ובקוד היו 50
שימושי `text-red` במידות 10–14px מול 38 במידות כותרת. `#B02D10` נותן **4.91:1** על נייר
ו-5.33:1 על לוחית, וכל 117 השימושים עוברים בלי לגעת באף קומפוננטה.

**האפשרות השנייה נדחתה, וכדאי לדעת מה היא הייתה:** לשמור את הצבע ולהגביל אותו לכותרות,
ולהעביר את הטקסט הקטן ל-`--ink`/`--muted`. היא שמרה על הוורמיליון המקורי אבל דרשה ~50
שינויים ידניים ושומר חדש, והיא מוותרת על הנגיעה האדומה בתוויות הקטנות. מאור בחר להכהות.

**האדום גר בחמישה מקומות ואין שישי:**
`app/globals.css` (הטוקן — מקור האמת) · `lib/brand.ts` (המראה בהקס, למי שלא יכול לקרוא
CSS custom property: כרטיסי השיתוף על קנבס ו-`theme-color`) · `scripts/brand/og-cards.mjs`
(מחולל כרטיסי ה-OG) · `lib/life/runtime/palette.ts` (`red` תחת `--- the club ---`, כלומר
החולצה במשחק הכדורגל של LIFE) · והדוגמאות המחושבות ב-`lib/isYellow.ts`.
`tests/brand.test.ts` מפרסר את הגיליון ונופל אם `lib/brand.ts` נסחף ממנו.

**ומה שהשינוי הזה חשף:** `ControlDeck.tsx` כתב `rgb(224 64 28)` פעמיים — הוורמיליון
הישן, מאוית לפי ערוצים, בתוך קומפוננטה. השומר של "בלי הקס גולמי" בדק `#` בלבד, אז זה
עבר חודשים, והקונסולה של LIFE הייתה נשארת באדום הישן בלי שאיש ידע. יש עכשיו שומר שני
שבודק **רוויה** ולא את עצם השימוש ב-`rgb()`: `rgb(255 255 255 / .55)` הוא הדגשה
ו-`rgb(0 0 0 / .45)` הוא צל — אין להם גוון והם לא צבעי מותג. לכל דבר שיש לו גוון אמיתי
יש טוקן, והקומפוננטה קוראת אותו.

## 63 · שתי הכרעות על מדידה, ומה שהן פותחות (15.9.2026)

מפרט החיים 1983–2026 ביקש לשנות שתי החלטות ותיקות. מאור הכריע בשתיהן, ושתיהן
נרשמות כאן עם התאריך — כי החלטה שלא כתובה נדונה מחדש בעוד חצי שנה.

**א · מספרים לשחקן — נשארים.** `GaugesSheet` מדפיס אחוזים וברים, והוא ימשיך.
זה גם מתאר את המציאות: הוא כבר בייצור בלי `NODE_ENV`, בזמן שכלל 46 טען שאין מסך
כזה. הכלל תוקן לתאר את הקוד. **`ProfileCard` נשאר בלי מספרים** — שני מסכים בשתי
שפות, בכוונה: הגיליון עונה "כמה", הכרטיס עונה "מי אתה". `tests/life-systems.test.ts`
ממשיך לשמור על הכרטיס.

**ב · הישגים — מותרים.** האיסור הגורף בוטל. אבל שני שומרים קיימים נוגעים בזה
ו**אסור למחוק אותם כשהם יאדימו**:
· `tests/life-story.test.ts` נופל על 'הישג','ניקוד','תג ','רצף','%' בתוכן.
· `tests/life-share.test.ts` אוסר score/percentage/badge על כרטיס שיתוף.
כשהישגים ייבנו, השומר הראשון **מצטמצם** לכדי איסור על **ציון יחיד** — שהמפרט עצמו
דורש ("אין ציון יחיד שמגדיר מי אוהד ראוי"). השני **נשאר כפי שהוא**: הוא על פרטיות
בכרטיס משותף, לא על הישגים, ואין לו קשר להכרעה הזאת.
**עד שהישגים נבנים, הבדיקות לא זזות.** לרופף שומר לפני שיש מה להראות בתמורה זה
בדיוק "תמחק, הבדיקה אדומה" שכלל 47 קיים נגדו.

## 64 · גשר בין אלפביתות — סירוב הוא תשובה, וההצלבה היא מה שתופס (15–16.9.2026)

מאור ביקש עמדה, מוצא ושנים **לכל** שחקן. הסבב הראשון הביא 342 מתוך 647 ממקור לועזי
אחד; מאור אמר "מעל 300 בלי עמדה?? תעשה עבודה יסודית", וצדק. הסבב השני הוסיף שלושה
מקורות והגיע ל-564. ואז מאור כתב *"יש לך ויקיפועל כמקור מידע מושלם, למה אתה עובד
קשה?"* — והמקור שלו נתן **653 מתוך 653**.

0. **כשמאור מצביע על מקור, הולכים לשם קודם.** ויקיפועל היא הרשימה שהארכיון שלנו נולד
   ממנה, והיא ענתה על שלוש השאלות ביחד: `|תפקיד=` בתיבת המידע, הקטגוריה "שחקנים זרים
   (כדורגל)" שהיא ההגדרה של המועדון עצמו למי שתפס מקום של זר, וקטגוריית "סגל" לכל
   עונה. ארבעת המקורות האחרים לא היו מיותרים — הם מה שאפשר להצליב מולו — אבל הם היו
   **אחרי**. כלל 18 חל גם על מקורות שמאור מצביע עליהם, לא רק על עובדות שהוא מוסר.
   ואם מקור חסום ל-Cloudflare: לא עוקפים (כלל 11), מבקשים דפדפן של אדם.
   מה שנקרא בדפדפן של אדם **מאומת בטביעת SHA-256 מול הדפדפן** לפני שהוא נכנס לריפו.

מה שנשאר משלושת הסבבים ביחד:

1. **שישה מקורות, ולכל שדה כתוב מי הכריע.** `squad` > `vikipoel` > `wiki-he` >
   `wiki-en` > `wf-all` > `wf-season`, ו-`positionFrom`/`originFrom` בקובץ אומרים מי.
   מקור חלש יותר אינו נמחק — הוא הולך ל-`conflicts` עם מה שאמר. 98 שורות שם.
2. **התאמה נכנסת רק כשהיא יחידה בשני הכיוונים.** שם עברי אחד, שם לועזי אחד. בלי
   הכיוון השני "יעקב כהן" לוקח את Yuval Cohen רק כי הגיע ראשון — וזה בדיוק מה שקרה
   בסבב הראשון, ונשלח.
3. **ההצלבה היא מה שתופס שורה שגויה, לא הדקדוק.** 99.1% הסכמה בין ויקיפועל לשאר על
   מוצא, 89.4% על עמדה; ו-99.6% על מוצא ו-85.6% על
   עמדה זה לא הממצא; הממצא הוא ארבע השורות שנחלקו: יעקב כהן (אדם אחר לגמרי), דוד
   קופרמן (אזרחות כפולה, לא סתירה), רז כהן (שוחרר מסירוב), לירון דיאמנט (הערך סותר
   את הארכיון). **מקור שני שווה יותר מכלל נוסף בשלד.**
4. **עברית-מול-עברית זו שאלה אחרת מעברית-מול-לועזית.** כששני הצדדים עבריים השאלה היא
   איזה איות, ומותר לקפל אימות קריאה ועיצורים שנשמעים זהה. כשצד אחד לועזי חוזרים
   לזהירות של הסבב הראשון — ול-39 זוגות שנקראו אחד-אחד, כל אחד עם הראיה בהערה.
5. **מעבר שם-משפחה בלבד נמדד ב-~50% טעויות ונמחק.** לא כוונון — מחיקה, עם הערה
   בסקריפט, כדי שמי שיחשוב על זה שוב ימצא את התשובה כבר שם.
6. **מה שאין — מוצג.** `unknown` ריק היום, אבל הפער לא נעלם — הוא **זז**: 23 שחקנים
   שהשדה `תפקיד` שלהם ריק גם בוויקיפועל נושאים `position: null` ומוצגים `לא מתועד`.
   (**20 מ-17.9.2026**: משפט הפתיחה של הדף נקרא כמקור בפני עצמו וסגר שלושה מהם —
   כלל 74. הפער לא נסגר, הוא שוב זז, ומי שנשאר עדיין מוצג.)
   `null` הוא הצורה הכנה לזה, ו-`refusedMatches` עדיין מדפיס בשמם את מי שסורב ולמה.
7. **הצינור רץ בלי רשת.** שלוש הטבלאות הגולמיות שמורות בריפו כפי שנקראו
   (`player-facts-wiki.json`, `player-facts-seasons.json`), ו-`pipeline.sh` מייצר את
   `player-facts.json` מחדש בדיוק. מקור שנקרא פעם אחת ולא נשמר הוא מקור שאי אפשר
   לבדוק.
8. **ויקיפועל חסום ב-Cloudflare** — מסך אימות שנתקע. זו בדיקת-בוטים ולא עוקפים אותה
   (כלל 11). היא ככל הנראה סוגרת את 91 הנותרים, בדפדפן של אדם.

`docs/09-player-facts.md` מחזיק את המספרים, את ההצלבה, ואת השיטה.

## 65 · שומר שנפל אחרי שינוי נתונים הוא שומר שצדק (16.9.2026)

שינוי הנתונים הזה הפיל שתי בדיקות שהיו ירוקות שנה. שתיהן היו ירוקות **במקרה**, ושתיהן
תוקנו בקוד ולא בבדיקה:

· `tests/game.test.ts` דרש "כל משפחת אוסישקין — שאלה אחת לסבב", בעוד `trivia.ts` תיעד
  במפורש ש-`ussishkin-replacement` **אינו** מוגבל (התשובה היא ארז זייצ'יק, לא המייסד).
  הדיל פשוט לא הוציא את שתיהן יחד עד עכשיו. הרחבה נכונה: סבב של 12 שאלות שמוציא שתיים
  על העמותה 2007–2013 אינו פרופורציונלי למאה שנה. **הקוד זז אל השומר.**
· `tests/game.test.ts` בדק `options.length === 4` על seed אחד — כלומר שאלות `multi`
  (שש אפשרויות, שלוש נכונות) **מעולם לא נבדקו**. הבדיקה הוחלפה בכזאת שקוראת את המספר
  מתוך `kind`, על עשרים seeds. הגנה רחבה יותר, לא צרה יותר.

זה כלל 47 בכיוון ההפוך: כשבדיקה נופלת אחרי שינוי נתונים, השאלה הראשונה היא לא "איך
מרפים אותה" אלא "מה היא ידעה שהקוד לא".

## 66 · סף שאי אפשר להגיע אליו הוא תוכן מת, ויש לזה עכשיו מכשיר (16.9.2026)

`deadend-audit` שואל אם דגל מורם אי-פעם. אף אחד לא שאל אם **מספר** ניתן להשגה, ולכן
מחלקה שלמה של באגים הייתה בלתי-נראית: שער, בחירה או ענף שמבקש ערך שהמשחק לא יכול
לייצר. הענפים האלה לא שבורים — הם פשוט אף פעם לא נלקחים, והם נראים בריאים במקור.

`npm run life:budget` (`scripts/life/budget-audit.ts`, ו-`tests/life-reachable.test.ts`
הוא החלק שאסור לו לסגת) עובר על הפרקים לפי הסדר ומחבר כל דלתא חיובית שפרק יכול
להצהיר, כאילו השחקן לקח את כולן, בחיים אחד, בלי שעון ובלי בלעדיות. זו הערכת-יתר
פרועה בכוונה: **סף מעל התקרה הזו הוא בלתי-אפשרי בהוכחה.** אין חיוביות שווא; יש שפע
של שליליות שווא, וזה בסדר.

**הטיוטה הראשונה דיווחה על עשרה ליקויים וששה מהם היו האשמה שלה**, וזה מתועד בראש
הקובץ כי כל אחד היה דרך אחרת למדוד שדה שהמנוע לא קורא:

1. התחילה כל מונה מאפס. `emptyState` לא: קובי ורחל על 50, `commanderTrust` על 50,
   `impulsiveness` על 30. שער על 60 נראה כמו חור של 46 והוא טיפוס של 10.
2. ספרה `bond.X` ו-`rel.X.bond` כשני מספרים. הם אחד — `withRelationship` כותב
   `bonds[who] = next.bond` בכל שינוי.
3. התעלמה מ-`{ e: 'trait' }`. `TRAIT_ROUTE` שולח אותו לאישיות או ללב האדום.
4. לא ידעה על הפחית. `savings` הוא כיס שני שאף תנאי לא רואה, ורק `withdraw` מעביר.
5. קראה רק שיחות. `entry` של פרק ו-`a: 'events'` של ביט משלמים גם הם.
6. התעלמה מה-clamp. שום דבר בחיים לא עולה מעל 100.

הכלל שמשותף לששתם הוא הכלל שהקובץ רץ עליו: **לקרוא מונה כמו שהרדיוסר קורא אותו,
מאותן טבלאות, או לא לדווח עליו.**

מה שנשאר אחרי התיקון היה אמיתי, ושתי הצורות שלו שוות זכירה. **אפי** נבדק על ציר
האמון בשלושה פרקים (1997 `max: 45`, 1999 `max: 44`, 2000 `min: 45`) ובכל המשחק יש
שורה אחת שמעלה אותו, בשלוש — כי הוא מעולם לא נזרע ב-`emptyState` בזמן שאופיר כן.
מספרים כמו 44 ו-45 הם הראיה: אף אחד לא מכייל סף מול סולם שהתקרה שלו שלוש. ו**הפחית**:
`goalA4` חיברה `savings + agorot`, אמרה "יש את ה־30, לרפי", ושלחה ילד לדלפק שקורא
`minAgorot` ויסרב לו.

## 67 · פורטרט נחתך מהאדם עצמו, וסיום כתוב חייב פולט (16.9.2026)

מאור שלח שתי תמונות של מישל בר־כליפא ומשפט אחד: לשים לב שמשתמשים בדמויות הנכונות.
`faceMichel` היה `cut from adultA6` בזמן ש-`michel99.webp` — האיש עצמו מהמסך הירוק —
היה על הדיסק. אותה צורה בדיוק נמצאה אצל **בארי**, **פרדי** ו**מלמד**.

- **פלייט של דמות בעלת שם נחתך מהפיגורה של אותה דמות.** `stageA2` הוא לוח הקאסט
  המאושר ולכן חוקי; `adultA7` הוא ניצב. `scripts/life/cut-faces-2026-09-16.py`.
- **וחיתוך שיצא מכוער מבוטל ומדווח.** פרדי ומלמד מצוירים ב-331 פיקסלים; ההגדלה
  פי 2.2 מפסטרת וה-de-yellow מוציא מהעור החם את הרוויה. **פנים שגויות שנראות כמו
  אדם הן טעות ליהוק שמישהו יתקן; פנים נכונות שנראות שבורות הן דוח באג על המנוע.**
  הם נשארים גנריים והפער כתוב בסקריפט.
- **de-yellow רץ אחרי ההגדלה** — כלל 44, ו-`freddy` הוכיח אותו שוב: חיתוך נקי לגמרי
  ייצר 303 פיקסלים צהובים ב-LANCZOS בלבד.
- **סיום שמוגדר ב-`endings` חייב שמשהו יפלוט אותו.** `ENDINGS.late` של 1986 —
  כותרת, גוף, פריט זיכרון וזוג `after` — לא היה נגיש לאיש, כי ה-`kobi-found` היחיד
  עומד ביציע בפנים ודורש `entry:granted`. הסופים נספרים עכשיו מול מה שהתוכן באמת
  פולט, ולא מול מה שהוא מצהיר.
- **וזנב הבלון מצביע על הדובר, לא על הצד שלו.** `anchor` הוא מרחב-מצלמה; הבלון חי
  ב-RTL ומוצב ב-`inset-inline-start`. ההיפוך הוא כל הסיכון, והוא נבדק
  (`tests/life-tail.test.ts`): היפוך חסר נראה סביר לחלוטין ומצביע על האדם השני.

## 68 · הארנק ממשיך עם הדמות (16.9.2026)

מאור, כשנשאל מה לעשות עם החולצה ב-a4:

> "כל הקטע בארנק זה שהכסף צריך להישמר ולהמשיך עם הדמות. והוא מחליט מתי ואיפה ועל מה
> להוציא. **הארנק לא מתאפס בסיום משימה אלא ממשיך איתך.**"

עד המשפט הזה גם `day.entered` וגם `year.entered` כתבו `agorot: 0`, וההערה מעל הראשון
אמרה שהמעבר "שומר את הקופה" — נכון לגבי `savings`, הפחית מתחת למיטה, ושקר לגבי הכיס
שלידה באותו אובייקט בדיוק. שתי מילים זו מזו.

**ומה זה עלה, במספרים:** `a4-shirt` קרוי על שם חולצה ב-30 ₪, וכל אחר הצהריים שלו —
הפחית, דמי הכיס, הבקבוקים, הארגזים אצל רפי — מייצר **27 ₪**. עם כיס שמתאפס בכל מעבר
יום זה היה כל התקציב, ולכן `own:heart:shirt85` לא היה ניתן להרמה בידי אף אחד, אי-פעם.
איתו מתו גם ההד ב-A6 שקורא את הדגל, החולצה `tveria85` בארון, וכרטיס הסיום `shirt` של
הפרק עצמו. זו לא הייתה הידוק — זו הייתה חולצה שאי אפשר לקנות בפרק ששמו החולצה.

- **`agorot` שורד `day.entered` ו-`year.entered`.** `tests/life-wallet.test.ts`.
- **`inventory` עדיין מתאפס, בכוונה.** בקבוקי פיקדון וכיכר לחם הם אביזרים של אחר
  צהריים, לא רכוש. מה שהוא **מחזיק** שורד ממילא בדרך משלו — דגלי `own:` ו-`clothing`
  (כלל 58) — ולכן חולצה שנקנתה ב-1985 עדיין בארון ב-2000.
- **שלוש בדיקות קיימות טענו את ההפך, והן שונו ולא נמחקו.** ההבחנה של כלל 47: "תמחק,
  הבדיקה אדומה" אסור; "ההחלטה השתנתה, בעל הבית אמר, השומר משנה צד" — זה מה ששומר על
  החלטה מלהיסחף חזרה בריפקטור חצי שנה מהיום.
- **ובדיקה בסוויטת חיים לא כותבת שנה** (כלל 45). `tests/life.test.ts` תפס את
  `year: 1985` שכתבתי, בדיוק כמו שהוא אמור.

## 69 · ארכיון תצלומים — צהוב שהוא עובדה, ותאריך שאינו ידוע (16.9.2026)

מאור נתן שני מקורות — ויקיפועל ו-footballkitarchive — וביקש "ארכיון חולצות מלא, תחתוך
מהתמונות בצורה יפה, תעבוד נקי ויפה". מה שיצא: 168 חולצות ב-`public/kits`, 1949–2026,
**רק חזיתות** (לבקשתו), וכל אחת חתוכה מהרקע ומרוכזת על בד שקוף 760×760. האגף הוא
`/kits/archive`, והקריאה היא `lib/kit/archive.ts`. מה שהעבודה הזאת קבעה:

1. **צהוב שאיש לא בחר בו הוא תכונה של החפץ, וניקוי שלו מזייף את הארכיון.** סמל
   היורופה ליג על השרוול, פס הזהב של ויזה על חולצת החוץ 1985, חולצת שוער כתומה — 71
   מתוך 168 נושאות צהוב, הגדולה 5.214%. שני החריגים הראשונים לכלל 8 היו על משהו
   שציירנו; זה על משהו שצולם, וזה הבדל במהות ולא במידה. מאור אישר אותו ב-16.9.2026
   **אחרי שהמדידה הוצגה לו**, וזה הסדר הנכון: מודדים, מראים, מבקשים.
2. **החריג הוא תיקייה, והתיקייה מוכיחה את עצמה.** `YELLOW_PHOTO_FOLDERS` הוא ההתאמה
   היחידה בקוד שהיא **קידומת** ולא נתיב מדויק, ולכן הוא הנצור ביותר: `tests/brand.test.ts`
   **מחשב מחדש** את "71 מתוך 168" ואת המקסימום מתוך `kit-photos.json` ונופל אם המספר
   בהצהרה ובתיקייה נפרדו. אישור שמצטט מדידה שכבר אינה נכונה הוא אישור למשהו אחר.
3. **הסריקה לא מדלגת על המסך — היא מסתירה את התצלומים.** `qa:sweep` נכנס
   ל-`/kits/archive` כמו לכל מסך, מסתיר כל `[data-archive-photo]` וסופר את מה שנשאר;
   ואם הסלקטור לא תפס כלום — זו תקלה, לא "נקי". מסך שסורק אפס פיקסלים ומדווח ירוק גרוע
   ממסך שלא נסרק בכלל, כי מאמינים לו.
4. **שני מקורות מתארכים אחרת, ולא מיישרים ביניהם.** footballkitarchive אומר עונה
   ("2016-17") וויקיפועל אומרת שנה ("Foot 2016") — והשוואה הראתה שהמיפוי אצלה אינו
   עקבי. לכן 114 שורות נושאות `yearRaw` ו-`seasonAmbiguous`, והמסך מדפיס **"1994 בערך"**
   באותה גופן כמו תאריך ודאי. ניחוש היה מייצר 114 עונות שגויות שנראות בטוחות.
5. **הבייטים שנשלחים הם הבייטים שנמדדו.** `<img>` רגיל ולא האופטימייזר של Next: קידוד
   חוזר ממציא כרומה (כללים 27, 61), וכל פיקסל שהוא ימציא יהפוך את המספר שמודפס על
   הכרטיס לשקר. `tests/kit.test.ts` בודק את גודל כל קובץ מול המניפסט — קובץ שהוחלף בלי
   `scripts/kits/build-archive.py` נתפס שם.
6. **צלם הוא מקור עם שם.** 114 מהתצלומים הם של **ישי צבי**, והקרדיט על המסך, לא בהערת
   שוליים (כלל 16). `content/manual/asset-provenance.json` מחזיק שתי שורות לתיקייה
   הזאת — זו התיקייה הראשונה שם שאינה חלק מ-THE WORKER LIFE, כי תצלום תיעודי בלי שורת
   מקור הוא בדיוק מה שהמניפסט נועד למנוע.
   **22.9.2026 — "על המסך" פירושו עכשיו `/credits`** (מפרט §0.3: קרדיטים ומקורות במקום
   אחד). ישי צבי עדיין בשמו, על כל אחד מ-114 התצלומים — כשורה הראשונה במדף התצלומים של
   `/credits`, שנספרת מ-`kit-photos.json` ולא מוקלדת (`lib/credits`). האגף, וכל מסך אחר
   שהדפיס שורת מקור, נושא רק `מקור מתועד` (`components/ui/SourceNote.tsx`) עם קישור למדף.
   הבדיקה ב-`tests/kit.test.ts` **התהפכה** ולא נמחקה (כללים 65, 80): היא דורשת את השם
   ואת הספירה ב-`/credits`, ואוסרת `creditHe` באגף; `tests/credits.test.ts` אוסר על כל
   מסך להדפיס `sourceTitle`/`sourceHe`/`creditHe` בעצמו.
7. **`<Num>` מבודד ספרה, לא משפט.** `<Num>{'168 מתוך 168'}</Num>` הדפיס "מתוך 168 168":
   כפיית LTR על משפט עברי מזיזה את מה שבתוכו. הבידוד הולך סביב הספרה בלבד —
   `1994/95` כן, `1994 בערך` לא.
8. **`net::ERR_ABORTED` על prefetch הוא הסורק מודד את עצמו.** הסריקה טוענת מחדש כל
   מסך כדי לדלג על אנימציית הפתיחה, והטעינה מבטלת prefetch-ים של Next שעדיין באוויר —
   10 מתוך 56 מסכים "נכשלו" ככה, תמיד על `_rsc=`, אף פעם על משהו שקורא רואה. החריג צר
   כמו הראיה (ABORTED **וגם** `_rsc=`), והמספר מודפס בשורה כדי שביטול חריג יהיה גלוי.

## 70 · מישור נמתח מהעולם, אף פעם לא מהקובץ של עצמו (16.9.2026)

`this.add.image(...)` מצייר טקסטורה בגודל הפיקסלים שלה, **ואף מישור פרלקסה לא נמסר
בגודל הרקע שהוא עומד במקומו**. המישור האמצעי — זה שכל שבר ב-`scenes.ts` נמדד מולו —
כיסה את הפינה העליונה של העולם, וכל השאר היה צבע הרקע של המצלמה:

| חדר | הציור השטוח | שלושת המישורים | כיסוי |
|---|---|---|---|
| `gate7` | 2728 × 1536 | 1600 × 900 | **58.6%** |
| `street` | 3936 × 1536 | 1600 × 625 | **40.7%** |
| `approach` | 4616 × 1536 | 1600 × 532 | **34.6%** |

החשבון חוזה את מה שדווח בדיוק: ב-360×740 המצלמה מראה 1720 פיקסלי עולם, המישורים של
gate7 נגמרים ב-900, כלומר ב-57.7% מהזכוכית, והשחקנים עומדים ב-85.7%. "הציור ממלא רק
את החמישים וחמישה אחוז העליונים והדמויות עומדות מתחתיו על שחור" — מילה במילה.
וה"חיתוך הכפול של הדלת בתחתית" היה המישור הקדמי: `setScale(1.16)` על טקסטורה
1600×900 עם `origin(0,1)` שם חיתוך 1856×1044 של הדלפקים מרחף בריק.

**ההשערה הייתה חצי נכונה, וזה הלקח החשוב.** חשדתי בפער **יחס**; אין כזה — כל מישור
תואם את הרקע שלו עד 0.1%. זה פער **קנה מידה** טהור, ולכן שום בדיקת נכס ושום מניפסט
לא התלונן מעולם.

**ומה שהסתיר את זה שנים־עשר יום: `street` ו-`route` נושאים שכבות חזית על כל העולם**
(`streetGround`, `streetFore`, שנמתחות ב-`layer.w * this.W` ב-`buildLayers`) שצובעות
את החור בחזרה מלמטה, אז הוא נקרא כצל. ל-`gate7` אין שכבה כזאת, ולכן רק היציע דווח —
**תקלה ששני חדרים מתוך שלושה מסתירים היא תקלה שמאבחנים כספציפית לחדר**, ושני סבבים
בסשן הזה בילו בתוך `frameWorld` בגללה.

`parallaxPlane(plane, W, H)` ב-`art.ts` הוא הגאומטריה, מחוץ להישג ידו של פייזר מאותה
סיבה ש-`walk.ts` שם. `tests/life-parallax.test.ts` בודק את **היחס** (יחס המישור שווה
ליחס הציור, מתוך `manifest.json`) ואת **החיווט** (לכל `this.add.image(` ב-`buildParallax`
יש `setDisplaySize(`, אין `.setScale(`), לעולם לא את המספרים.

## 71 · מסלולים והישגים — ההזמנה היא שיחה, והכרטיס הוא הדלת השנייה (16.9.2026)

מפרט החיים ביקש שבעה מסלולים, שלושים הישגים ושלושה עשר מדדים חדשים. שלושתם נבנו, ואז
התברר שהם לא נגישים לאיש. שלושה כללים יצאו מזה, ושלושתם על אותו הפער: **בין "נכתב" ל"אפשר
להגיע לזה".**

- **מזהה שנוצר בתבנית צריך מקום אחד שקורא לו בשמו המלא.** `lib/life/content/routes.ts`
  מייצר שמונה־עשרה שיחות הזמנה מתוך הרישום, עם `` id: `route-offer-${route.id}-${stage.stage}` ``.
  זה נכון לתוכן — שמונה־עשרה העתקות של אותו ביט הן שמונה־עשרה הזדמנויות שהסירוב יפסיק
  בשקט להיות מוצע — וזה בדיוק מה שהסתיר אותן מהשומר היחיד שקיים בשביל זה:
  `tests/life-keys.test.ts` סופר שיחה כנגישה אם המזהה שלה מופיע כמחרוזת מצוטטת במקור,
  ומחרוזת תבנית אינה כזאת. `OFFER_CONVERSATIONS` ב-`lib/life/routes.ts` היא הטבלה שסוגרת
  את זה, והיא מכוונת לא-חכמה: כל מזהה כתוב במלואו, ה-`Record` מקליד אותה מול הרישום, ובדיקה
  מוודאת שהטבלה ו-`DIALOGUE` מסכימות **בשני הכיוונים**. מפתח שנוצר ואי אפשר לקרוא לו בשמו
  הוא אותה תקלה בדיוק כמו פיגורה שאף אחד לא ממקם (כלל 48) — רק שהיא נכשלת בשקט במקום ב-404.
- **שתי דלתות, ולכל אחת תפקיד אחד.** ההזמנה מגיעה כ**שיחה** (`WorldScene.offerRoute`,
  ליד שלושת המכריזים האחרים, בחדר שבו פרק נפתח, ב-4200ms אחרי החולצה/האלבום/המנוי); הכרטיס
  (`RouteCard`, מ-☰ → המסלולים) הוא הדלת ה**מכוונת**, ועונה על שאלה שההזמנה לא צריכה לענות
  עליה — מבין שבעה, על מה הוא רוצה לקרוא עכשיו. `nearestRoute` היא התשובה. שתיהן שואלות את
  `eligibleFor`, ולכן הן לא יכולות לחלוק על השאלה אם הוא זכאי.
- **`route:offered:<ID>:<stage>` הוא דגל בלי תחילית ששורדת, בכוונה.** `personFlags` מוחק
  אותו במעבר פרק, כך שסירוב נשכח עד הפרק הבא וההצעה חוזרת. *"סירוב אינו מוריד אהבה"*,
  ו-`declineEvents` לא כותב כלום — הצעה שאפשר להציע רק פעם אחת הופכת את "לא עכשיו" ל"אף
  פעם", וזה ההפך ממה שהסירוב קיים בשבילו.
- **חמישה משישה אפקסים אינם ניתנים להשגה היום, וזה כתוב על הכרטיס.** הפרק האחרון הוא 2000
  והוא נולד ב-1978, כלומר תקרת הגיל היא 22; ארבעה אפקסים נעולים ב-25 ואחד ב-30.
  `stageOutOfReachFor` מחשב את זה מ-`CHAPTERS` ולא ממספר מוקלד, `life.route.outOfReach`
  אומר את זה בקול, ובניית פרק 2007 תזיז את כולם בלי לגעת בשורה. **והאפקס של המייסד אינו
  אחד מהם** — הוא `minAge: 18`, ומה שעוצר אותו הוא חלון 2007, שהוא `gap` מסוג `window`
  ומשפט אחר. לדווח על חלון כעל גיל זה כרטיס שאומר אמת-למראית-עין על ה**למה**.

## 72 · רוטציה היא שבוע, לא מאגר — והימור אינו עבודה (16.9.2026)

`ACH_SHIRT_SELF` מבקש חולצה ב-30 ₪ שנקנתה **בלי** חמשת השקלים של קובי. הבדיקה הראשונה
שאלה אם **העבודה הכי טובה בפרק** סוגרת את הפער, קיבלה "כן", ורשמה בהערה ששבוע שמציע רק
את סבב הבקבוקים משאיר את הילד **שקל אחד** קצר — ותייקה את זה כ"הרוטציה עובדת כמתוכנן".
זה לא היה כך. רוטציה היא שבוע שמשוחק אחרת; הישג שנקרא על שם הפרק שהוא יושב בו, שנעשה
בלתי-ניתן-להשגה לפי אילו עבודות הזרע חילק, הוא כלל 66 בצורתו הטהורה — סף מעל התקרה, על
חלק מהתקרות ולא על כולן, שזו הגרסה שאף אחד לא מבחין בה לעולם.

ושני המדדים הקלים שניסיתי לפני הנכון שווים זכירה, כי כל אחד מהם נראה סביר לחלוטין:

· **"העבודה הזולה במאגר"** בוחרת את `alley-coin` — ש"שקל להיכנס, חמישה אם קלעת", כלומר
  **הימור**. ילד שהוצע לו הטלת מטבע לא הוצעה לו עבודה. `opens: 'coin'` ו-`opens: 'toto'`
  הם הסימן.
· **"העבודה הטובה במאגר"** שגויה בכיוון השני, כי אף שבוע לא מציע את כל המאגר —
  `offeredIn` מחלק חמש מעשר מהזרע של השמירה עצמה.

המספר הכן הוא **ההצעה הטובה ביותר בשבוע הדל ביותר**, על פני 400 זרעים — הצורה של כלל 31:
לסרוק את הזרעים, לא לבחור ארבעה ביד. התיקון עלה לבדיה שני בקבוקים (`bottles-a4` עלה
משלושה לחמישה, ורפי סופר חמישה). שום דבר אחר לא זז — לא שכר, לא מחיר, לא רוטציה.
לפני התיקון: 2900. אחריו: 3100. הבדיקה מדפיסה את הזרע שמחלק את השבוע הדל.

## 73 · פריים לא-חתוך משקר על הגובה של עצמו (16.9.2026)

שמונת פריימי ההליכה של פוגי היו קנבסים 835×1264 בתיקייה שכל פיגורה אחרת בה חתוכה
לאלפא (~150×430). עם `setOrigin(0.5,1)` הרגליים נחתו בין **89.40% ל-99.68%** מהקנבס,
כלומר הילד ריחף מעל `groundY` ורעד 10.3 נקודות לאורך המחזור; `displayWidth` קפץ מ-0.356×H
ל-0.661×H, אז `shadow.setSize(displayWidth * 0.6)` הרחיב את הצל ב-**86%** ברגע שהתחיל ללכת.
שלוש תקלות, מקור אחד.

- **המניפסט הסתיר את זה.** `write_index()` ב-`to-webp-2026-09-13.py` עדכן `bytes` ו-`yellowLeft`
  ולא נגע ב-`w`/`h` מעולם, אז `sheets.json` עוד קרא לפריימים האלה 159×430 — והשומר קורא
  את המניפסט, לא את התיקייה (כלל 61, שוב, בצורה אחרת). 46 שורות תוקנו.
- **השומר החדש הוא יחס, ולא הוכחה, וזה כתוב.** כל פריים הליכה חייב לשבת בין 0.6× ל-1.6×
  מצורת העמידה שהוא משתלב איתה. פריים שרופד **באופן שווה מארבעת הצדדים** שומר על היחס
  ויעבור; לסגור את זה דורש עמודת כיסוי-אלפא במניפסט, וזה נרשם ולא נעשה.
- **והם היו מלכתחילה תצוגות גב** שנוגנו רק כש-`lastDir === 'side'` — כלומר ברחוב הילד
  הפנה את הגב והחליק הצידה. `KID_WALK` הוא עכשיו הזוג הפרופיל, `KID_WALK_AWAY` הוא הגב,
  והכיוון בוחר. **בדיקת פנים שלא בדקה כלום מאז 13.9**: `facing-check.py` חיפש `*.png`
  בתיקייה שהיא 100% WebP והדפיס `0 · 0 · 0` ויצא 0. כלי שמדווח הצלחה על אפס קבצים הוא
  אותה משפחה כמו הקרס שכתב `version: 1` (כלל 48) — **הוא לא יכול להיכשל, ולכן הוא לא כלי.**

## 74 · תפקיד הוא רשימה, חולצה היא עונה, ודעה אינה דירוג (17.9.2026)

מאור: *"אני מבקש דיוק בפרטים! לא יכול להיות ששמת את שייע פיינגבוים, החלוץ הגדול עם הכי
הרבה שערים בהיסטוריה של הפועל בתור שחקן הגנה."* הוא צדק, והשורה לא הייתה התקלה.

- **`תפקיד` בוויקיפועל הוא רשימה, וכל מייבא קרא אותו כסקלר.** 48 מתוך 605 דפים כותבים
  יותר מתפקיד אחד (`מגן שמאלי, חלוץ, מאמן`), ו-`parsePosition` החזיר את ה**קוד** הראשון
  שהוא בודק ולא את התפקיד הראשון שהמקור כתב: `parsePosition('חלוץ, בלם')` החזיר `DF`,
  כי `DF` נבדק לפני `FW`. `parsePositions()` מחזיר את כולם לפי סדר המקור, `parsePosition`
  הוא הראשון שבהם, ו-`retiredScalarPosition` נשמר ליד הלקסיקון **כדי שאפשר יהיה למדוד**
  את השינוי ולא רק להצהיר עליו — הדוח והבדיקה שניהם קוראים לו.
- **הגוף גובר על התיבה לשאלה "מה הוא שיחק **בהפועל**".** התיבה מתארת קריירה (כל תפקיד,
  בכל מועדון, כולל אימון); משפט הפתיחה מתאר את המועדון הזה. איפה שהם חלוקים — 16 דפים —
  הפתיחה מכריעה את התצוגה והסתירה נרשמת ב-`conflicts` (כלל 60 §3). `vikipoel-body` הוא
  מפתח מקור שביעי, כי זו טענה אחרת מאותו דף.
- **ותפקיד נקרא רק איפה שהמשפט מצהיר עליו.** סריקה של כל מילת-תפקיד בפסקה הפותחת ייצרה
  שלוש טעויות מאותו סוג: דף שמספר שמישהו **התחיל** כחלוץ ועבר **לתפקיד** המגן, ילד בן
  שש ששיחק כבלם, ועדות אוהד ארבע פסקאות למטה. שלוש צורות בלבד נחשבות — כותרת שפותחת
  בתפקיד, `בעמדת`/`בתפקיד`, ואוגד — ו-`כ<תפקיד>` נפסל **למרות** שהוא צודק על אדם אחד,
  כי צורה שצודקת על אחד ושוגה בשניים אינה כלל.
- **בדיקה שנופלת על המחלקה, לא על השורה.** `tests/players.test.ts` כמותית על כל הקורפוס:
  אף עמדה מוצגת לא מסכימה עם הקריאה שהוחלפה איפה שהפרסר לא, והפער בין השתיים נמדד
  (18 דפים). בדיקה ששמה רק את שייע הייתה מכשירה את 26 האחרים.

**חולצה היא עונה שהאיש באמת שיחק בה.** `lib/kit/playerKit.ts` מצמיד לכל שחקן חולצה
מ**עונה שטבלת הסגל מציבה אותו בה** ושיש לה מפרט בארכיון — לעולם לא העונה הקרובה ולא
"החולצה האופיינית לתקופה", כי חולצה היא טענה על אדם (כלל 11). הכלל כתוב ונבדק: העונות
נחתכות לרצפים, הרצף הארוך ביותר הוא ה**תקופה** שלו, ובתוכה עונה שבה המועדון זכה
(הכי הרבה תארים, ואז המוקדמת) ואחרת הראשונה שיש לה חולצה. **הרצף לפני התואר** — ערן
זהבי נמצא בסגל 2006/07 כנער, וזו עונת גביע עם חולצה בארכיון; "תואר קודם" היה מלביש אותו
בעונה שכמעט לא שיחק בה. 389 מתוך 661 מקבלים חולצה, **265 מקבלים `null` והמסך שותק**.

**ההרכב הגרוע בכל הזמנים הוא דעה, והאפליקציה אינה מדרגת איש.** כלל 18 מתיר למאור לנקוב
בשמות שהיציע שונא — זה שער 11, והוא בנוי על העברות מתועדות עם מקורות. רשימת "השחקנים
הגרועים" ש**האפליקציה** מייצרת היא עצם אחר: טענה עובדתית על אנשים בשם, שאין לה מקור.
לכן הלשונית השנייה בשער 1 היא בחירה חופשית מאותו גיליון שמות, בלי הצעה ובלי ניקוד,
והמשפט הזה כתוב על המסך ועל כרטיס השיתוף — לא רק בהערה בקוד.

**שער 12 נפתח, שער 9 נפתח כלוחית סגורה.** `href: string | null` הוא ההבדל: לוחית בלי
נתיב אינה קישור, והטיפוס מכריח כל צרכן (מפת האתר, האזור האישי, גיליון העזרה) להחליט מה
לעשות איתה במקום לקשר בשקט ל-404. 1,385 טורי עיתונות עם תאריך מלא הם מה שאיפשר את
"היום לפני"; **טור הוא יצירה של מישהו**, ולכן הקליטה שומרת כותרת, תאריך, שם וציטוט
**אחד** של עד 240 תווים — הטקסט המלא נשאר ב-`content/raw/` כרשומה, ולכן אי אפשר להרכיב
יצירה מחדש מכמה כרטיסים. זו ערובה מבנית, לא הבטחה בהערה.

**ושתי תקלות ותיקות שהתגלו רק כי שיחקו את המסך עד הסוף** (כלל 33): `npm run story:overlap`
היה **אדום ב-main** — שם שחקן בצ'יפ של כרטיס ההרכב הודפס דרך תווית העמדה (`xi.role.3 ×
xi.name.3`, 6px), כי השם הותאם ברוחב בלבד והמקום האנכי היה ניחוש; ו-`ArchiveWing` הדפיס
תוצאה כ-`2:1` בשורה עברית — בדיוק מה ש-`MatchLine` קיים כדי למנוע, ומה ש-`tests/seed.test.ts`
אוסר על **תוכן** ולא יכול לראות בקומפוננטה.


## 75 · אי אפשר להיתקע — וזה נמדד לכל פרק, בכל קו חיים (17.9.2026)

מאור פתח את 11.3.1991, המשחק אמר לו ללכת לאולם אוסישקין, **ולא הייתה דלת לאוסישקין
בשום מקום**. שלוש הביקורות היו ירוקות באותו רגע. זה הכלל שיצא מזה:

> *"תעשה כבר סדר בכל התסריט. שלא יהיו חורים ותקיעות בעלילה. שלא יהיה מצבים שאי אפשר
> להתקדם. אם לא בחרתי במסלול הזה אז המשימה הזו מדולגת ולא מפריעה לי להתקדמות."*

**מה שאף בדיקה לא שאלה.** `life:deadends` שואל אם דגל מורם **אי־פעם במשחק**;
`life:budget` שואל אם מספר ניתן להשגה **אי־פעם בחיים**. אף אחת מהן לא שואלת את השאלה
שהשחקן שואל: *בקו החיים שאני עליו, אפשר לסיים את הפרק הזה?* `life:knows:hall` מורם
רק ב-`a3-hall`, ול-`a3-hall` יש `when: ['life:a2:efi']` — כלומר חצי ממי שמתחיל חיים
הגיע לפרק שכל תוכנו ערב אחד באולם, בלי שהאולם קיים עבורו. הדגל **כן** מורם במשחק;
הוא פשוט לא מורם בחיים שלו.

`npm run life:worldlines` הוא המכשיר (`lib/life/world/worldline.ts` +
`scripts/life/worldline-audit.ts`, וב-`tests/life-worldline.test.ts` החלק שאסור לו
לסגת). הוא מריץ **סגירת מעגל מונוטונית** לכל פרק: החדרים פותחים דגלים, הדגלים פותחים
חדרים, עד נקודת שבת — ומודד עשרה קווי חיים: הריק, המלא, שבעת המסלולים כל אחד לבדו,
ודגל־הסתעפות בשני הכיוונים (`only:` ו-`sans:`). **הקו הריק הוא הקו החשוב**, כי שם גרים
כל החורים האמיתיים.

חמישה קודים, וכל אחד הוא צורה אחרת של אותה תקיעה: `GOAL_UNREACHABLE` (הפרק מצביע על
חדר שאין אליו דרך) · `AREA_UNREACHABLE` · `FLAG_UNRAISABLE` · `NO_ENDING` ·
`ROOM_ORPHANED` · `ENTRY_UNREACHABLE`.

**ומה שהתיקון לימד, ושווה יותר מהתיקון:**

- **מערכת שנבנתה ואיש לא קורא לה שווה לא-קיימת.** `lib/life/world/reach.ts` נכתב
  ב-7.9.2026 בדיוק בשביל השאלה הזאת, עם `canPlayerReach`, קודי שומר, `TEACHES`,
  `guided:` ו-`learnedOnArrival` — **ולא היה לו ולו קורא אחד מחוץ לבדיקות שלו.** הוא
  ענה `AREA_NOT_KNOWN · GUIDED_TRAVEL · efi` על המצב המדויק שמאור פתח, בזמן שה-HUD
  כתב "הדרך: לאולם אוסישקין — עדיין סגורה". זו אותה משפחה של כלל 71, שלב אחד מוקדם
  יותר: שם מזהה שנוצר בתבנית ואי אפשר לקרוא לו בשמו; כאן מודול שלם.
  `aimForGoal` הוא החיבור, ו-`WorldScene.aim2goal` הוא מי שקורא לו.
- **"עדיין סגורה" ו"אתה לא יודע איך מגיעים לשם" הן שתי אמירות שונות.** הראשונה שולחת
  לחפש מפתח; השנייה שולחת לחפש **בן אדם**. כשהחסם הוא ידע, החץ מצביע על המדריך —
  והמדריך נבדק שאפשר להגיע אליו, כי הצעה שאי אפשר לממש גרועה משתיקה.
- **פרדיקט אחד למושג אחד: `{ area }`.** הדלת שואלת "הוא יכול להיכנס לאזור עכשיו",
  שזה "הוא יודע **או** שמישהו לוקח אותו" — במקום שכל דלת עתידית תמנה בעצמה את רשימת
  המדריכים (כלל 59).
- **שומר שלא מכיר פרדיקט מאשר אותו בשקט.** `couldHold` במכשיר החדש הבין `flag`
  ו-`flagIs` בלבד, אז ברגע שהדלת עברה ל-`{ area }` הביקורת הכריזה על 1991 כנקי —
  בזמן ש-`canPlayerReach` עדיין ענתה `AREA_NOT_KNOWN` על אותו מצב. **מכשיר שנהיה
  עיוור בדיוק לבאג שנבנה בשבילו**, תוך שעה. זה הכיוון המסוכן מבין השניים, והוא הסיבה
  שכל תיקון תוכן כאן אומת גם מול probe ישיר ולא רק מול הדוח.
- **מודל שאינו מדמה את הרדיוסר מדווח על המודל של עצמו.** `learnedOnArrival` רץ
  ב-`events.ts` ולא בשום קובץ תוכן, אז סגירת המעגל הייתה חייבת ללמוד אותו במפורש.
- **ומי שמזמין אותך הוא מי שלוקח אותך.** אופיר זרק את הפתק "היום אוסישקין?" על השולחן
  בבוקר; "בא איתך. שש וחצי" של 1993 הוא נסיעה מודרכת במילים של ילד. שניהם מרימים
  עכשיו `guided:`, וזה לא תוספת — זה שם לדבר שהתסריט כבר אמר. לפתוח חצי עיר בגלל משפט
  של דמות זה מה שכלל 71 אוסר; זאת הדמות שכבר אמרה את המשפט.

**ושני ליקויים ותיקים שרק הקו הריק הראה:**
· `a5-first` — הביט `a5-in` יורה ב-`bloomfield-tunnel`, והדלת לשם נשאה `entry:granted`
  שהוא הפאזל של 24.5.1986 ולא נכתב מעולם ל-28.9.1985. הביט לא ירה מעולם, הדרך היחידה
  ל-`a5-close` נשארה ביט השעון שמרים `a5:late` **לפני** שהוא פותח את השיחה, וארבעת
  הסופים האחרים — שהם מה ש-a4 קונה — לא נראו בעיני איש. מנעול שעבר בירושה לחדר משותף,
  בדיוק כמו ב-כלל 54.
· `tests/life-reach.test.ts` ביקש `ussishkin-hall` כיעד של הזמנת אפי והיה ירוק **רק
  מפני שהוא מעולם לא עבר את הדלת הראשונה**. מרגע שהמדריך פותח אותה, ההליכה נתקלת
  בסדרן — שזה מה שהפרק אומר בקול. כלל 65: השומר שנפל ידע שהיעד היה חדר אחד עמוק מדי.

## 76 · הפורטל מדבר עם עצמו — קלפי בלי שם, וכרטיס שלא נמחק (17.9.2026)

מאור, בהודעה הראשונה: *"כל הפורטל צריך להחזיק את כל המידע, **לדבר עם עצמו**, להשתמש
בנתונים נכון וליצור סנכרון מדויק."* עד היום הוא היה חמישה `localStorage` נפרדים בלי שרת
ובלי זהות: מי שבנה חולצה בטלפון ומי ששיחק טריוויה במחשב היו שני אנשים.

(**מ-22.9.2026 השמות והקובץ השתנו — כלל 89:** הצד של האדם הוא `20260922090000_worker_shared_project.sql`, כל שם מתחיל ב-`worker_`, ואין טריגר על `auth`. מה שכתוב כאן על ההיגיון עדיין נכון.)
`supabase/migrations/20260917090000_portal_identity.sql` הוא הצד של **האדם**; שבע
המיגרציות שלפניו הן הצד של **הארכיון**. `docs/14-portal-identity.md` מחזיק את הצעדים
שמאור צריך לעשות — בלחיצות, בלי טרמינל.

**שלוש הכרעות שהן הכלל, ולא פרטי מימוש:**

- **לקלפי אין `user_id`, ואין לה מדיניות בכלל.** אותה בנייה שכלל 4 משתמש בה
  ל-`trivia_answer`, בשביל בעיה שנראית הפוכה: הספירה **חייבת** להיות ציבורית או ששער 7
  לא עושה את הדבר היחיד שהוא קיים בשבילו, והקול **חייב** להיות בלתי-ניתן לייחוס. לכן
  אין עמודה שמקשרת אדם לבחירה — לא מטעמי סדר: עמודה כזאת אפשר לקרוא, לדלות ולצרף,
  והגרסה היחידה של "אנחנו לא יודעים מי הצביע למה" ששווה לכתוב היא זו שבה **השורה לא
  יכולה לענות**. גם השורות אינן ציבוריות: שמונה שורות עם אותו `device_id` הן קלפי שלם
  של אוהד אחד, טביעת אצבע בלי שם. פנימה דרך `rpc_poll_vote`, החוצה רק כמצרף דרך
  `rpc_poll_tally`.
  **ולכן ההצבעה לא דורשת חשבון.** הבריף אמר "המפתחות קיימים **וגם** המשתמש מחובר";
  זה היה סותר את הטבלה שהקובץ הבטיח מאז שהאגף נבנה, והיה הדרך השקטה ביותר להפוך קלפי
  אנונימי למזוהה. החיבור שומר על ה**כרטיס**, לא על הקול.
- **`max()` למונים, `least()` ל-`since`, ו-`member_no` לא נדרס לעולם.** מיזוג שמחבר
  שני סכומים שכל אחד מהם כבר מכיל את השני מכפיל את הכרטיס בכל ביקור; `max()` לא יכול
  להמציא, ו"לפחות כך וכך" נשאר נכון אחרי כל מספר של סנכרונים בכל סדר. המחיר נאמר
  בקול: 40 סיבובים בטלפון ו-30 במחשב מתמזגים ל-40 ולא ל-70 — **חֶסֶר**, שזה הכיוון
  הכן מבין השניים, ולכן `gate_run` שומר **שורה לכל סיבוב** ו-`foldRuns()` בונה את
  המונים מחדש מהשורות. שורות הן הקנוניות, מונים הם נגזרת (כלל 1).
  `since` הוא המקום היחיד שבו `max()` הפוך: מחשב שנפתח היום נושא את היום, ו"האחרון
  מנצח" היה מאפס כרטיס בן שנה בכל חיבור ראשון ממכשיר חדש.
- **מספר מנוי הונפק מחדש בכל טעינת דף, במשך חודשים.** `readBook()` הטביע `TIK-…` חדש
  בכל קריאה למכשיר שלא שמר כלום, ורק עריכה מפורשת שמרה אחד — כלומר השדה היחיד בכרטיס
  שהמוצר מתאר כ**בלתי-ניתן-להשגה-מחדש** היה השדה שהשתנה הכי הרבה. הקריאה הראשונה
  כותבת עכשיו את הספר שהיא מטביעה, ו-`storedBook()` נוסף כדי שהסנכרון יוכל לשאול "האם
  המכשיר הזה **כבר** מחזיק מספר" בלי שהטבעה טרייה תענה לו "כן". טריגר בטבלה מקפיא את
  המספר ומחזיר את `since` אחורה בלבד, כי סירוב ב-TypeScript שווה בדיוק כמו האדם הבא
  שיכתוב נתיב סנכרון שני.

**ומה שנמצא ולא תוקן:** `@supabase/ssr@0.5.2` ו-`@supabase/supabase-js@2.112.4`
חלוקים על הגנריקה — הפרמטר השלישי הוא `SchemaName` ולא `Schema`, ולכן **כל `from()`
וכל `rpc()` באפליקציה הם שגיאת טיפוס**. איש לא הבחין כי עד הדלתא הזאת אף קובץ לא
השתמש בלקוח מטופס. התיקון האמיתי הוא `npm install` אחד — כלומר שינוי lockfile ופריסה,
ולכן הכרעה של מאור — והוא מבודד במקום אחד בלבד, `lib/portal/db.ts`, עם ההסבר המלא.

## 77 · הטור `comments` הוא כובשים, והבדיקה החינמית היא התוצאה באותה שורה (17.9.2026)

2,290 שורות כדורגל בוויקיפועל נושאות `comments`, והוא **רשימת כובשים** — לא תיאור
מהלך. ההבחנה הזאת היא הכלל:

> **רשימת כובשים אינה מהלך.** המשימה נוסחה במקור כ"עומק לשער 8 מתוך השורות האלה",
> וזה היה מנוסח לא נכון. שער 8 משחזר שער **נגיעה-נגיעה**; `comments` נותן שם ודקה.
> לבנות ממנו תוכן לשער 8 פירושו להמציא את המסירות — בדיוק האיסור של כלל 11, באגף שההערה
> שלו כבר אומרת *"שער שאף מקור לא מתאר את המהלך שלו פשוט אינו במשחק — שנים־עשר נבדקו
> ונפסלו בדיוק בגלל זה"*. **אף רשומה לא נוספה ל-`goals.json`**, ובדיקה נופלת אם הוא
> יצטט אי-פעם את המקור הזה. מה שהנתונים כן מזינים: טריוויה על מי כבש במשחק, ספירת
> שערים לשחקן, וכרטיסי משחק באגף הארכיון.

**ומה שהופך את הקליטה הזאת למדידה ולא לתקווה: התוצאה יושבת באותה שורה.** מספר השערים
שהפרסר מוציא מ-`comments` חייב להיות שווה לשערי הפועל לפי `homescore`/`awayscore` —
שתי אמירות בלתי-תלויות של אותו מקור. **99.29% מסכימות** (2,096 מתוך 2,111), והחמש-עשרה
שלא מקבלות `confidence: 1` ונשמרות כסתירה עם שני המספרים (כלל 60 §3), כך שכלל 2 מחזיק
אותן מחוץ למחולל הטריוויה.

**והפרסר לא מסתכל על התוצאה, בכוונה.** אפשר היה להשתמש בה כדי להכריע את העמימות
האחרונה — סוגר עם מספר חשוף, שהוא דקה לפי המוסכמה הרווחת (`דב רמלר (48)`) ומספר שערים
בכמה שורות משנות ה-30 — וזה היה הופך את הבדיקה לחסרת ערך. **בדיקה שווה משהו רק כל עוד
היא בלתי-תלויה במה שהיא בודקת.**

- **סוגר שיש בו ספרה חייב להתפרסר כשער, אחרת השורה נדחית.** טיוטה ראשונה נתנה לסוגר
  שנכשל ליפול ל"כינוי", ו-`יהושע פייגנבוים (33',54'-פ')` הפך בשקט לשער אחד של אדם
  שכינויו `33',54'-פ'`. **ערך סביר שנולד משדה בלתי-קריא הוא בדיוק מה שאיש לא בודק
  פעמיים.**
- **179 שורות נדחו עם סיבה ועם הטקסט הגולמי**, ו-`note-attached` היא מחלקה בפני עצמה
  כי שורה אחת בקורפוס כותבת את הכובשים **אחרי** המשפט — כלומר "טקסט אחרי הנקודה הוא
  הערה" אינו נכון על המקור הזה, ומי שיניח את זה ימחק שערים בשקט.
- **`homegame` מעולם לא ענה על "מי מאיתנו".** `host` ו-`oponent` **נוקבים בשם** שני
  הצדדים, ובכל 2,290 השורות בדיוק אחד מהם נפתר למועדון ש-`clubs.json` מסמן `isUs`,
  דרך רשימת הכינויים שלו (כלל 7) — ולא לפי איך שהוא נראה. `homegame` ו-`host` חלוקים
  ב-6 שורות, וזה בדיוק למה השם מכריע ולא הדגל. 53 שורות `x` נקראות ככל שורה ונושאות
  `neutralGround: true`.
- **78.86% מהשמות נפתרו, ו-293 שלא — רובם איות אחר של אותו אדם.** `גילי ורמוט` מול
  `גיל ורמוט`, `יהושע פייגנבוים` מול `שייע פייגנבוים`, `שימון גרשון` מול `שמעון גרשון`.
  **אף אחד מהם לא הותאם**: זו הכרעה של אדם שמאשר ששני איותים הם איש אחד, ומקומה
  ב-`aliases` ולא בניחוש של הפרסר (כלל 64 §5 — גישור על שם משפחה נמדד ב-~50% טעויות
  ונמחק). `אלי כהן` עם 61 שערים **אינו בארכיון בכלל** — זה הפער הגדול ביותר שנפתח כאן.
- **והלקסיקון של הפרוזה כלל שמות של שחקנים.** `אושר`, `פרץ` ו-`בני` הם אושר דוידה
  ועומר פרץ; הלקסיקון דחה בשקט שורות כובשים אמיתיות. `tests/scorers.test.ts` בודק
  מכנית ששום מילה בלקסיקון אינה מילה בשם של שחקן בארכיון, כדי ששתי הרשימות לא יזלגו
  זו לזו כשהן יגדלו.

## 78 · ראיה ששום חדר לא מייצר היא סף שאי אפשר להגיע אליו — והשלב שלפני הסף נספר גם הוא (20.9.2026)

כלל 66 שואל אם **מספר** ניתן להשגה, ו-`npm run life:budget` עונה עליו לכסף. השאלה שלא
נשאלה היא הצורה השנייה של אותו סף: תנאי שמבקש **ראיה בשם**, ולא סכום.

`lib/life/routes.ts` מבקש בשלושה שלבי כניסה ראיות ששמן כתוב — `verified_report` וגם
`written_account` לעיתונאי, `balanced_budget` וגם `adult_shift` לבעלים, `creative_work`
ליוצר. שמונה פעולות קטנות נכתבו בדיוק עבורן, שמונה שיחות נכנסו ל-`CONVERSATIONS_ROUTES`,
**ואף חדר לא פתח אחת מהן**. כל החוקים היו נכונים, שום דבר לא היה אדום, ושלושה שלבי
כניסה היו בלתי-אפשריים — לא קשים.

זו אותה תקלה שכלל 71 תיקן למשימות ההוכחה, שלב אחד מוקדם יותר, ויש לה צורה כללית:

1. **תוכן נגיש אינו תוכן שהגיעו אליו.** שיחה שקיימת במערך, עוברת טיפוסים ויש לה בדיקות
   היא עדיין מתה אם אין `act`, `talk`, `goto` או `talk` בתסריט משחק שמצביע עליה.
   `deadend-audit` הולך מהחדרים החוצה ולכן לא רואה את הכיוון הזה — הוא בודק שכל מה
   שמגיעים אליו שלם, לא שכל מה שנכתב מגיעים אליו.
2. **כשסף מבקש ראיה בשם, הבדיקה היא על היצרן ולא על הצרכן.** לספור כמה מקומות בעולם
   מייצרים `verified_report` היא שאלה שאפשר לענות עליה מכנית, ותשובה 0 היא באג בלי קשר
   לכמה יפה כתובה השיחה.
3. **ולכיוון הזה יש עכשיו מכשיר.** `npm run life:orphans`
   (`scripts/life/orphan-audit.ts`, ו-`tests/life-orphans.test.ts` הוא החלק שאסור לו
   לסגת) לוקח כל שיחה ב-`DIALOGUE` ושואל אם משהו נוקב בשמה — מבנים (`talk`, `act`,
   `goto`, פעימות, הזדמנויות, מפגשים, רקע, תסריטי משחק, פנורמות, טבלת ההזמנות) **וגם**
   כל מחרוזת בקוד מחוץ לקבצי ההגדרה, כי חצי תריסר שיחות נפתחות מתוך ריצה
   (`dialogue.start('derby:chant')`) ואין דרך מבנית למצוא אותן. שם שמופיע בהערה בלבד
   נחשב "נקרא", ולכן **אין חיוביות שווא** — כל מה שהוא מדווח אמיתי. בהרצה הראשונה:
   שלוש-עשרה.
4. **ותקרה נספרת ממה שהעולם פותח, לא ממה שהתוכן מצהיר.** `tests/life-routes.test.ts`
   הולך בדלתות מנקודת הפתיחה של כל פרק בוגר, אוסף רק נקודות חמות שבאמת בהישג יד,
   ומחבר. תוכן של פרק לא נספר בכוונה: מה שנמדד הוא הרצפה, וכשהרצפה מספיקה אין צורך
   לסמוך על שום שורת עלילה.

**ומה שנשאר בלתי-אפשרי חייב לומר את שמו.** אחרי התיקון כל שלבי הכניסה והאימון נגישים
חוץ מאחד — `USSISHKIN_FOUNDER.practice`, שמבקש `founding_proof`, ו-`PROOF_FOUND` היא
המשימה היחידה מתוך השש שבכוונה אינה מונחת באף חדר כי חלון ההקמה הוא 2007. הבדיקה
מונה אותו **בשם** ולא מאחורי הכללה, והפסגות נבדקות בכיוון ההפוך: פסגה שהמספרים שלה
נעשו פתאום ברי-השגה היא הודעה שאחד משני הדברים שגוי — התקרה או הגיל.

**ואותה שאלה על חפץ במקום על שיחה.** נקודה חמה יתומה גרועה משיחה יתומה, כי היא נראית
עובדת: מצוירת בחדר, `act` תקין, השיחה בקצה השני שלמה — והחדר אינו נגיש בשנה שהיא מתויגת
בה. תשע כאלה נמצאו באותו יום, כולן ג׳ובים, ושתיהן מאותה סיבה: `gigChapters` רץ מ-`from`
עד סוף הפרקים כשאין `until`, ולכן `platform-bags` הוצע בשבעה פרקים כשלרציף יש דלת באחד,
ו-`banner-gate5` בשישה כששער 5 פתוח בשלושה. **`until` של ג׳וב אינו קיצור של העבודה — הוא
תיאור של הדלת.**

**ותקלה נרדמת מתעוררת ברגע שמגיעים אליה.** `WORK_COMMITMENT` נשא
`{ e: 'money', agorot: 800 }` מהיום שנכתב, ושני דברים נשברו בו בשנייה שהיה אפשר לקחת
אותו: המספר לא ידע באיזה עשור הוא (`WAGE` הוא 10 ₪ לשעה בתשעים ו-18 באלפיים, ו-`gigPay`
גוזר ממנו כל שכר במשחק בדיוק כדי שלא יוקלד פעמיים), והוא עקף את `workDoneFlag` — עבודה
בתשלום אחת לפרק (מאור, 6.9.2026) — כלומר ברז שני באותו אחר־צהריים. המשמרת אינה משלמת
עוד. **הבדיקה של תוכן מת היא גם בדיקת התנהגות: מה ששכב ללא שימוש לא נבדק מעולם מול
הכללים שהוא חי בתוכם.**

**ולמה החפץ נשאר בחדר אחרי שעשית אותו.** `proof.recorded` אדיש לחזרה על אותו `proofId`,
אבל המיומנויות, הכסף והמוניטין אינם — בלי דגל, אותה נקודה חמה הייתה משלמת שוב ושוב
באותו אחר-צהריים. הדגל הוא `small:<ID>` בלי אף קידומת מרשימת ההישרדות של `personFlags`,
כלומר הוא נמחק במעבר פרק: **הראיה נשארת לתמיד והאחר-צהריים לא.** והחפץ עצמו נשאר על
הקיר עם ענף שיחה שני שאומר מה קרה לו — דבר שנעלם ברגע שנגעת בו הוא עולם שמוחק את
עצמו מול העיניים.

## 79 · תסריט ההמשך 2000–2026 — לקרוא, ואז להכריע, ואף פעם באותו מעבר (20.9.2026)

מאור מסר את תסריט ההמשך: 114 סצנות, 345 בחירות, 1,357 שורות דיאלוג, 2000 עד 2026.
המקור שמור בריפו כפי שהתקבל (`docs/life/SCREENPLAY-2000-2026.md`) ושני מעברים נפרדים
עובדים עליו — `npm run life:screenplay` קורא, `npm run life:screenplay-map` מכריע.

**ההפרדה היא הכלל, לא נוחות.** זו אותה הפרדה של כלל 36 — הקורפוס אינו הקנון והצעד
ביניהם הוא מעבר פרסר על הדיסק — ומיזוג שלהם הוא איך שפרסר מתחיל להחליט דברים בשקט.
בדיקה אוכפת את הגבול: אין ב-`scenes.json` אפקט אחד של המנוע.

**והראיה שהקריאה נכונה היא שהמקור סופר את עצמו.** משפט הפתיחה של המסמך אומר "114
סצנות, 345 בחירות ו־1,357 שורות דיאלוג"; הפרסר סופר לבד מהכותרות והציטוטים בלי לראות
את המשפט, והבדיקה קוראת את המשפט מהמקור במקום להקליד אותו. שתי אמירות בלתי-תלויות של
אותו מקור שמסכימות שוות יותר מכל אחת מהן (כלל 77), והיום שבו הן ייפרדו הוא היום שבו
הפרסר התחיל לאבד שורות.

**מה שלא נקרא מדווח ולא מנוחש:** 32 סצנות כותבות `זמן: לפי תחנת החיים והגיל` במקום
שנה, כי הן חלונות חיים ולא תחנות בציר. `year` הוא `null`, `yearRaw` מחזיק את מה שנכתב.

**1,067 מתוך 1,159 האפקטים נחתו על מנגנון שכבר קיים** — ספר הראיות, `flagValue`,
הארנק, הכישורים, היחסים. זה לא מזל: התסריט נכתב מול אותו מפרט שהמנוע נכתב מולו, ומה
שהחיבור הזה חשף הוא כמה מהמפרט כבר עומד. שלוש הכרעות מיפוי כתובות בטבלה ולא בפונקציה
שמנחשת — `documentation→knowledge`, `enterprise→business`, `mediation→communication`.
טבלה אפשר לקרוא, לחלוק עליה ולתקן; `includes('doc')` אי-אפשר.

**ושתי שאלות הוחזקו בחוץ עד שנענו, וזה החלק שכדאי לזכור.**

**א · `oli` מול `uli`.** ברישום יש `uli`, בתסריט כתוב `oli`. כלל 64 §5 מדד גישור על
שם ב-~50% טעויות ומחק אותו, ולכן ההתאמה **לא** נעשתה — היא דווחה, נשאלה, ונענתה
בשלוש אותיות: **"ULI"**. הבדיקה שהחזיקה את השתיקה מחזיקה עכשיו את ההכרעה באותה חוזקה.
מה שלא השתנה הוא מי מכריע.

**ב · הקהל `international`, וההבדל בינו לבין שער 7.** שלושה קהלים התמפו לקיימים
(`terrace→gate5`, `basketball→ussishkin`, `media→public`); הרביעי הושאר בחוץ, כי לקפל
קהל לתוך "הציבור" היא טענה על מי שמע ולא תרגום. מאור ענה: *"קהלים בינלאומיים שמזוהים
עם ארגון ANTIFA, כמו סט פאולי."* זו תשובה שמחייבת **קהל שישי**, כי יציע בהמבורג שמכיר
אותך אינו הציבור הישראלי — **וגם אינו שער 7: שער 7 הוא האוהדים שלנו בחוץ, וזה אוהדים
של מישהו אחר שעומדים אִתנו.** שתי הטעויות הקלות לעשות כאן, ושתיהן נבדקות בשמן.

**ומה שהוסף לרישום הדמויות לימד את אותו לקח פעם שלישית.** שבעה אנשים חדשים נקראו כל
אחד מהסצנה שמציגה אותו ולא מהשם — `I01` פותחת ב-*"זאת לינה, זה ניקו. הם מארגנים מפגש
נגד גזענות"* ולכן הם `supporter` עם `international`. השמיני, `ilan`, **לא נוסף**:
`neighbour` במרשם כבר נקרא **אילן השכן** מאז 5.9.2026. שתי האפשרויות סבירות — אותו
שכן עשרים שנה אחר כך, או אדם אחר — ושורה שנייה בשם אילן היא ההפך המדויק ממה שהמרשם
קיים בשבילו. `NAME_COLLISION` החזיק אותו ודיווח עליו עד שנשאל, **ומאור ענה באותו יום:
"אילן השכן זה אילן כן."** אדם אחד. השורה של `neighbour` קיבלה `aliases: ['אילן','ilan']`
ועידנים שמגיעים עד העשור הרביעי — ב-`A03` הוא עומד ליד **בתיה**, שכנה עם אותם עשורים —
ו-`CHARACTER_OF` נושא את המיפוי עם התאריך והמשפט. `NAME_COLLISION` נשאר **ריק ולא
נמחק**: הוא המקום שבו ההתנגשות הבאה תדווח, וטבלה שנמחקת אחרי שנפתרה היא כלי שלא יכול
להיכשל (כלל 73).

## 80 · העולם שגדל מפיל שומרים, והם מתהפכים ולא מתרככים (21.9.2026)

תסריט ההמשך התחיל להיבנות: `2000-bridge`, `2002-europe`, `2006-home`, שלושת פרקי 2007
ו-`2009-up`. תשעה־עשר פרקים נעשו עשרים־ושישה, והתקרה עברה מגיל 22 לגיל 31 — **ועשרה
שומרים נפלו באותו רגע, אף אחד מהם לא מפני שמשהו נשבר.**

זה הכיוון השלישי של כלל 65. שם: *"שומר שנפל אחרי שינוי נתונים הוא שומר שצדק."* כאן
השומר צדק **ואז הפסיק להיות נכון**, כי הוא תיאר מצב זמני — "הפרק האחרון הוא 2000",
"חלון ההקמה מעבר למה שנבנה", "שש פסגות סגורות". הצורה שכל אחד מהם קיבל היא אותה
צורה: **לא מחיקה, לא ריכוך — היפוך לשאלה הצרה יותר.**

- *"אין פרק אחרי הדאבל"* → *"ממשיך לגשר, והגשר הוא שלב אחר"*.
- *"חלון ההקמה מעבר לפרק האחרון"* → *"שלושה פרקים בתוך החלון, כי הפסגה מבקשת שלוש"*.
  התאריך לא זז; העולם זז אליו (כלל 11 עומד).
- *"חמש פסגות בלתי-נגישות"* → *"הרשימה ריקה, והיא נשארת"*. בדיקה שמוחקים אותה כשהיא
  ירוקה אינה כלי (כלל 73).
- *"שש שורות המתנה"* → *"שתיקה ממי שפתוח, ומשפט ממי שלא"*. **משפט המתנה על הישג פתוח
  הוא שקר לשחקן**, ושורה שנוקבת בחסם שנפל היא בדיוק אותו שקר-למראית-עין שכרטיס המסלול
  נבנה נגדו (כלל 71).
- *"שלושים הישגים"* → *"שלושים ועוד שישה, בשמם"*. לא `length > 0`: מספר מוקלד הוא מה
  שמפיל את הבדיקה כשמישהו מוסיף שורה בלי לומר על מה.

**ושתיים מהנפילות היו באגים אמיתיים, ושתיהן במודל ולא בתוכן:**

**א · `alwaysRaisedBefore` — דגל שאין חיים בלעדיו.** `seedFor` חתך את קו החיים במה
שפרק מוקדם יכול היה להוריש, וזה נכון — אבל הוא גם הניח שכל דגל שפרק מוריש הוא
**אופציונלי**. `2006-home` פותח **בתוך אולם אוסישקין** ומרים `life:knows:hall` בביט
הראשון; בכל זאת `life:worldlines` דיווח על `2007-registered` כבלתי-אפשרי בתשעה קווי
חיים. ההבחנה שחסרה היא בין "אפשר להרים" ל"בהכרח מורם", ושתי הדרישות נבדקות: פרק בלי
`when`, **וביט שה-`when` שלו מדבר רק על דגלי הפרק עצמו** — כלומר שומר-פעם-אחת ולא
הסתעפות. הניסיון הראשון פסל כל ביט עם `when` וקיבל רשימה ריקה, כי כמעט כל ביט במשחק
נושא `none: [{ flag: '<own>' }]`. זה **הידוק** של המודל: הקו הריק נשאר פסימי בכל מה
שהוא באמת בחירה.

**ב · פונקציה אטומה מחזירה למכשיר רצפה, לא תקרה.** `life:budget` מריץ `entry` של פרק
על מצב ריק. `entry` שמסתעף על דגל מראה לו **ענף אחד**, ולכן הוא המשיך לדווח על סף
בלתי-אפשרי אחרי שהכסף כבר היה שם. ההפרש עבר ל**ביט**, שהמכשיר רואה ויכול לחבר — וזה
גם הפך לרגע טוב יותר: הוא סופר את מה שחסך במקום לקבל אותו בשקט.

**ושלוש הכרעות על מספרים שהתסריט נוקב בהם:**
· **שכר נגזר, מחיר לא.** B02 כותב 180 ₪ למשמרת של שעה; `WAGE['00s']` הוא 18, ו-`gigPay`
  גוזר ממנו כל שכר במשחק בדיוק כדי שלא יוקלד פעמיים (כלל 78). מחיר טיסה, לעומת זה, הוא
  עובדה על העולם ונשאר כפי שנכתב — ואז `life:budget` דרש שיהיה ממנו דרך להגיע אליו.
· **עוגן חדש נקרא, לא הוקלד.** הדרבי של 8.3.2004 (96:71) לא היה בארכיון. כלל 49 אומר
  מה עושים, והמקור שנמצא הוא **האתר של מכבי תל אביב עצמה** — שתי אמירות בלתי-תלויות
  באותו עמוד, הכותרת ופירוט הרבעים, מסכימות על עשרים וחמש הפרש (כלל 77).
· **מה שאין תאריך לו נשאר בלי תאריך.** עליית 2009 היא *"22 ניצחונות ללא הפסד"* עם
  `happenedOn: null`, ולכן היא **עוגן סיכום** ולא משחק.

**ושלוש נקודות הוכחה, אחת בכל פרק.** `route-proof-found` היה היתום היחיד במשחק. שלוש
באותו חדר היו נראות כמו שלוש ראיות ונספרות כאחת — `proofId` הוא `founding_proof:{chapter}`
וספר הראיות אדיש לחזרה — כלומר השחקן היה עושה את העבודה ועומד מול פסגה נעולה. והתחייבות
שכבר נלקחה **נעולה ואומרת למה**, מאותה סיבה בדיוק.

## 81 · מכשיר שמדמה חצי מעבר מדווח על המודל של עצמו (21.9.2026)

`stage-c-probe` נכתב כדי לענות על שאלה אחת: **האם הפרק בכלל עולה בדפדפן.** הוא ענה
"כן" על תשעה פרקים, ובכל תשע התחנות המנוע חשב שזאת **שבת של 1986**.

השמירה הסינתטית כתבה `chapter.entered` ו-`moved`. המעבר האמיתי
(`WorldScene.toNextChapter`) כותב **`year.entered` לפניו** — שנה, יום ודקה של הפרק —
ובלעדיו `apply` משאיר את השעון של `life.started`. ה-HUD הראה "קיץ 2010" ולכן הכול
נראה תקין, אבל הוא קורא את `hudDateHe` **מרישום הפרקים** ולא מהמצב: הטענה על השנה
הייתה מחרוזת מהרישום שהושוותה לאותה מחרוזת מהרישום. שני כללים קיימים נפגשו כאן:
כלל 77 (*"בדיקה שווה משהו רק כל עוד היא בלתי-תלויה במה שהיא בודקת"*) וכלל 48
(*"כל אחד מהם גרם למכשיר להסכים עם עצמו בשקט"*).

**מה שתיקן את זה, ומה שלא:** הסעיף הרביעי — *השעון אומר את היום ואת השעה של הפרק* —
נקרא מה-HUD ונכתב **ביד** ב-`STOPS`, כמו הכותרות שכבר נכתבו שם ביד. מי שישנה אותם
ברישום צריך שהמסלול יראה את זה. השמירה עצמה כותבת עכשיו את שני האירועים **בסדר
שהמשחק כותב אותם**; שכפול חצי-מעבר אינו קיצור, הוא מודל שני.

**וההוכחה שהוא באמת מפעיל תוכן** אינה צילום המסך: הצילום נלקח ברגע שה-HUD תואם,
כלומר לפני שהפעימה הראשונה ירתה. ריצה קצרה שממתינה שש שניות וקוראת את
`[data-life="line"]` מחזירה *"קודם עולים."* ו*"זאת המנגינה."* — השורות הראשונות של
`C01` ו-`C03`. **חדר שעלה אינו פרק שמתחיל** (כלל 56).

**ושלושה דברים קטנים מאותו יום, כל אחד באותה משפחה:**

· **`{ e: 'own' }` הוא בגד.** הוא כותב `clothing.gained` — ולכן כרטיס וצילום שנכתבו
  איתו נכנסו לארון. `tests/life-bag.test.ts` תפס את זה מיד, והצורה הנכונה לחפץ שאינו
  בגד היא הדגל `own:<id>` שהתוכן כבר משתמש בו.
· **שומר שאדום ב-main אינו רקע.** `uses no raw hex in components` נפל על
  `KitAssemblyShirt.tsx` במשך שבועות ודווח בכל דלתא כ"קיים מראש". כשנפתח, הוא לא היה
  ליקוי סגנון: שני הפולבקים הקלידו **לבן טהור** במערכת שכותבת במפורש *"chalk — not
  pure white"*, ואפור קר בזמן שה-`--ink` של הדפוס הוא שחור-חום. `COLOUR_VAR` היא
  הטבלה שכל שאר מרנדרי החולצה כבר קוראים. **וההערה שמסבירה את התיקון אינה מצטטת את
  הקודים**, כי השומר קורא מקור (כלל 9).
· **"המקור אינו נוקב באצטדיון" היא הודאה שהבית הוא ברירת מחדל.** הפלייאוף של 2010 מול
  זלצבורג יושב ב-`matches.json` **פעמיים** — בית/חוץ הפוכים, תאריך שנבדל ביום — ושתי
  השורות מאותו מקור בשתי קריאות. ההערה על השורה הישנה אומרת את הסיבה בעצמה, וזה בדיוק
  מה שכלל 36 אוסר. שתי הסתירות נרשמו ב-`fact-conflicts.json` ולא הוכרעו מכאן; העוגן
  קורא את השורה שנושאת אצטדיון והערה, וזו **בחירת קריאוּת ולא פסיקה על הארכיון**.

## 82 · ציור שבמאגר ושום חדר לא מצייר הוא תקלה, ומקום שנבנה מחדש מביא רצפה משלו (21.9.2026)

מאור כתב שורה אחת — *"בלומפילד החדש למשל יש לך במאגר!"* — ובריף האמנות אפילו רשם
ש-R02 *"נסגרת מיד עם מה שכבר במאגר"*. היא לא נסגרה: שתים-עשרה מסגרות `bloomOld*` /
`bloomNew*` ישבו בתיקייה מחוברות לשום דבר, כל פרק אחרי 2000 עמד מול הציור של 1986,
והערה ב-`chapter2018return.ts` קבעה ש-`bloomNewPlaza` *"אינו במאגר"*. **ומתחת לזה שגיאה
גדולה יותר, של לוח שנה:** בלומפילד נסגר ב-2016 ונפתח בסוף אוגוסט 2019, ושתי סצנות
(`K03` ב-2017, `R02` ב-2018) עמדו מול אצטדיון שהיה אתר בנייה. שום מכשיר לא ראה, כי כל
מכשיר בודק שהחדר **קיים**, לא **שהוא החדר של השנה הזאת**.

**הכלל:**

1. **ציור ב-`BACKDROP` שאין לו חדר, `artByEra`, `repaints` או `arrival` — נבדק למה.**
   "יגיע מדידה" אינו מצב קבע; מדידה היא עשר דקות מול רשת על הציור (`life:boards`).
2. **`artByEra` הוא החלפת צבע; `repaints` הוא בניין אחר.** כשהקומפוזיציה זהה (`gate5`
   ו-`bloomOldGates` נחפפים פיקסל לפיקסל — נבדק במיזוג) מחליפים ציור ושומרים מידות.
   כשהמקום נבנה מחדש, ה-`Repaint` נושא band, taper, metre ו-spawns **שנמדדו על הציור
   שלו** — ובכיכר הרגליים של אדם בקו הקרוב והאופק צריכים לתת את גובהו (ב-`bloomNewPlaza`
   העיניים של מי שעומד ב-0.95 יושבות על האופק, 0.615 — וזו הבדיקה).
3. **למקום אמיתי יש לוח שנה, והדלתות מכבדות אותו.** שנים שבהן המקום סגור נועלות את
   הדלת עם `blockedHe` שאומר למה, ומבחן (`life-bloomfield.test.ts`) מחזיק את הלוח.
4. **תסריט שאומר "אל תחבר לארכיון" מחייב גם כשהעובדה מאומתת.** `V4-BLOOMFIELD` הוא
   *"מזהה הקשר לפעולה בדיונית"*; לכן `R02` יושבת ב"סתיו 2019", בלי יריבה ובלי תאריך,
   אף שערב הפתיחה (26.8.2019) נמצא ואומת משני מקורות. עוגן שנכתב ונמחק באותו מעבר.
5. **מכשיר שסופר חדרים סופר ביט-ביט.** `ROOM_ORPHANED` דיווח 56 חורים כשהדלת לבלומפילד
   ננעלה, כי ביט שיורה *"ברחוב או בבלומפילד"* נספר כיתום. ביט יתום רק כשאף חדר שלו
   אינו בהישג יד — כמו שהמפגשים כבר נבדקו.

## 83 · הסצנה שנבנתה חייבת להיות הסצנה שנכתבה (21.9.2026)

כל המכשירים שאלו *"האם הפרק עולה ונגמר"*. אף אחד לא שאל *"האם הוא הפרק שמאור כתב"*.
המעבר השני מצא, עם כל השאר ירוק: שתי בחירות שלמות של L06 שהוחלפו בפעולה שלא נכתבה
כבחירה; E04.2 (*"לשמור רגע אחד בשביל קובי"*) שהתקפלה לתוך המקום, כך שמי שטס לא יכול
היה להתקשר לאבא שלו; A04 שהוכרזה "התמזגה" בלי אף מילה ממנה במשחק; ושתי בחירות שהתסריט
נועל בתנאי — U02.1 (*"למסור את החלק שלי"* למי שלא לקח חלק) ו-Z07.2 (*"אני שם ממילא"*
למי שלא גר שם) — פתוחות לכולם.

1. **`npm run life:screenplay-coverage`** (`lib/life/content/screenplay/coverage.ts`,
   `tests/life-screenplay-coverage.test.ts`) בודק שכל שורת פתיחה וכל בחירה של התסריט
   נמצאות בתוכן. בלי חיוביות שווא: שורה בהערה נחשבת, ושורה קצרה (*"כן."*) אינה ראיה.
2. **מה שחסר בכוונה — בשמו.** `WAITING_SCENES` (חו״ל, מחכה ל-`flatAway`; Q09 מסך מערכת)
   ו-`REWORDED_CHOICES`, כל אחת עם הסיבה. והבדיקה הולכת בשני הכיוונים: סצנה שנבנתה
   **חייבת** לצאת מהרשימה.
3. **תנאי שהתסריט כתב הוא `when` במשחק.** `GATED` בבדיקה מונה כל בחירה נעולה ואת המקום
   שלה. תנאי שתמיד מתקיים (F03.1 — הקופסה לעולם אינה ריקה אחרי 1986) כתוב ליד הבחירה,
   לא נכפה.
4. **מיזוג הוא ענף, לא השמטה.** A04 היא עכשיו הענף הראשון של `z-up` (`life:armchair`):
   אותה החלטה, במילים שנכתבו לחיים האלה.
5. **תשובה לבחירה היא המילים של התסריט.** כרטיס קופץ שהומצא במקום השורה שנכתבה
   (*"אני רושם מספר. רגע חגיגי."* במקום *"הוא אמר כן?"*) הוא אותו פער, רק שקט יותר.

## 84 · מה שנמחק בחצות, מה שאף אחד לא כותב, וחדר בלי דרך החוצה (21.9.2026)

הסגור של `life:worldlines` מונוטוני: הוא שואל **לאן אפשר להגיע**. שלוש שאלות הוא לא
שאל, ולכל אחת יש עכשיו קוד משלה באותו מכשיר (`lib/life/world/worldline.ts`,
`tests/life-worldline.test.ts`):

- **`STALE_READ`** — תנאי חיובי על דגל יום שנכתב בפרק אחר ונמחק ב-`year.entered`.
  מצא: P05 מתה (`p:tillKind` → `life:till`); הצעיף שעובר עשור עצר ב-1986 (`scarf:` לא
  הייתה קידומת נושאת, אף שהקובץ של החוט טען שכן); רחל של 1998 דיברה את הערב של 1993
  עם שמונה שקלים מהארנק; הקיצור לבלומפילד היה נעול לגבר בן ארבעים ב*"אתה עוד לא יודע
  את הדרך"*. מה שמכוון נקוב ב-`STALE_BY_DESIGN`, עם הסיבה, ובדיקה דורשת שכל שורה בו
  עדיין מסתירה משהו.
- **`NEVER_RAISED`** — תנאי על דגל ששום דבר במקור לא כותב. `d:stadium` החזיק את הרגע
  השלישי של הצעיף מאז שנכתב. שמות מחושבים (`gig:`, `life:family:`…) ב-`COMPUTED_FLAG`.
- **`ROOM_TRAP`** — חדר שנכנסים אליו ואין בו יציאה פתוחה גם בסוף היום. מי שנכנס ליציע
  ב-2010 לבנפיקה לא יכול היה לצאת לליון, ומי שנכנס לבלומפילד ביום גמר ברמת גן נתקע:
  הדלת החוצה נשאה את `found:kobi` של 1986.

והלקח שמתחת לשלושתם: **הערה שאומרת "זה שורד" אינה ראיה שזה שורד.** `threads.ts` כתב
שהצעיף עובר שנה כמו `own:shirt:`, ואיש לא בדק מול `personFlags`. רשימת המנוע נוספה
לבדיקה (`scripts/life/engine-flags.ts`) כדי שהבדיקה והמכשיר יסגרו את אותו עולם.

## 85 · מי שמדבר — עומד. ומי שעומד — נראה כמו מי שמדבר (21.9.2026)

מאור: *"שיהיה באמת ריקוד וסנכרון מלא בין הסיפור לבין הנראה על המסך."* שבעה-עשר הציורים של
2000–2026 הם חדרים (`world/rooms2000.ts`), וכל מי שמדבר בחיים הבוגרים נמצא באחד מחמישה
מצבים, ש-`npm run life:sync` (`world/sync.ts`) סופר: **עומד בחדר** (`STAGED` — שותק, מחכה,
נשאר אחרי שדיבר) · **בטלפון/על מסך** (`Conversation.remote`, אייקון ולא זנב) · **במקום אחר**
(`Conversation.where`, תג אדום בתיבה) · **נכנס לצידו** לשיחת שעון (`WorldScene.summonSpeakers`)
· או **חסר** — וזה הכשל. ביט של כניסה לחדר שמסתמך על "נכנס לצידו" נכשל גם הוא: בחדר שהסצנה
כתובה לו, אנשים מחכים כשנכנסים.

**הגוף אחד, הפנים ממנו.** `castFigures.ts` הוא התשובה היחידה לשאלה "איך נראה X בשנים האלה",
ו-`FACES_2000` מלביש על כל פרק מ-2000 את הלוח שנחתך **מאותו גוף** (`cast-faces-2026-09-21.py`).
שני אנשים על גוף תחליף אחד לא נפגשים באותו פרק; `girlTeen` היא ילדה ולא תחליף לאשה.

**ובמסך — חמש בדיקות ב-`tests/life-rooms-2000.test.ts`, כל אחת על משהו שנראה בצילום:**
אף אחד לא עומד איפה שהוא נכנס (יוסף הוסתר מאחורי פוגי בסלון של 2025); שני אנשים לא עומדים
זה בתוך זה (חבר נעמד על "הגבר מהשולחן" באלנבי); אף עובר-אורח אינו גוף של הקאסט; כל עובר-אורח
הולך לכיוון שהוא פונה אליו; ו-`FACES_LEFT` (`runtime/art.ts`) יודע אילו גופים מגיליונות הקהל
מצוירים פונים שמאלה — `flip: true` היה נקרא כ"האמנות פונה שמאלה", וכל אדם כזה **הסתובב ממנו**
ברגע שפוגי ניגש.

**והמצלמה פוגשת את מי שמדבר.** בטלפון רואים 42% מהחדר; שיחה שנפתחת כשהקבוצה מחוץ לתמונה
מזיזה את המצלמה אליה (`frameSpeakers`), ו-`frameShot(null)` מחזיר אותה בסוף.

## 86 · גזירה היא טענה על גוף — השכן, העור, והמותן (21.9.2026)

שלוש תקלות שחיו חודשים בקבצים ולא באף מבחן, ונמצאו רק כשצולם חדר מלא אנשים:
- **שארית של השכן.** 78 גזירות נשאו חלק מהדמות שלידן בגיליון. `clean-strays-2026-09-21.py`:
  רכיב שנוגע בשפה ורחוק מהגוף הוא שארית; כדור, כדורסל ותוף הם חריגים **בשם**, אחרי שנבדקו
  בעין. חותכים מלמטה ומהצדדים, **לעולם לא מלמעלה** — תנוחת ישיבה נמדדת מול המשבצת.
- **עור שה-de-yellow הרס.** כתמי אפור-כתום (רפי). עור בגוון 21° אינו צהוב (הפס הוא 38–70),
  ומותר לצבוע אותו חזרה — מזרעים כתומים, רק דרך פיקסלים של עור, כי צמיחה חופשית צבעה חולצה.
- **פוזה שנחתכה במותן אינה שחקן על הרצפה.** `oldMan-lean` נשען על דלפק; כשחקן בגובה 1.70
  הוא היה פלג גוף עליון ענק; `oldMan-stool` ישב על כלום, כי אין שרפרף בציור. מה שנשען על
  משהו — או יושב על משהו — צריך את המשהו. רפי עומד.

## 87 · חלון בעלילה נפתח מהחיים — לא מהזמנה ולא מתפריט (21.9.2026)

מאור בחר מבין שלוש (חיים + הזמנה · חיים בלבד · תפריט בין פרקים): **"לפי החיים בלבד"**.
חלון (טורניר, קריירה, בינלאומי, חו״ל, כורסה, בעלות) הוא פרק שמתחיל כי מה שהשחקן כבר
עשה הוביל אליו — `when`/`whenAny` על דגל שבחירה בציר הראשי מרימה, או על דרגת מסלול —
**בלי שיחה ששואלת "אתה בפנים?"** ובלי כרטיס בחירה בין פרקים. ההזמנה היחידה שהייתה,
הטלפון של אופיר לליגת הקיץ, הוסרה: `life:team` מורם עכשיו מהבחירה *"הערב אני פנוי. בואו"*
בקיוסק של `2000-bridge`. חלון שייבנה מכאן והלאה נפתח מבחירה שכבר כתובה בתסריט — ומי
שלא הגיע אליו לא מאבד דבר בציר הראשי.

## 88 · חיים מציאותיים — צילום בתוך צילום, גיל בגוף, חפץ בשנה שלו (21.9.2026)

מאור: *"אתה מציג את פוגי כילד כציור — זו טעות."* הכלל שיצא מהמעבר, ו-`tests/life-realism.test.ts`
שומר עליו:

- **אין ציור בתוך צילום.** גוף, פנים או חפץ שמקורו לוח קונספט, תחריט או גיליון מצויר לא
  נכנס לחדר מצולם — גם לא כשהוא "רק" בכדור במשחק השכונה. `RETIRED_FIGURE` מחזיק את `kid`,
  והרשימה `ENGRAVED` במבחן מחזיקה את שנים-עשר התחריטים שיצאו מ-`PROP`.
- **פנים נחתכות מהגוף שעל הרצפה** (כלל 67, בהרחבה): גם שנות ה-80, וגם מי שעומד על תחליף.
- **גובה הוא של הגיל.** גוף שמשמש מ-1990 עד 2026 (`ofir90`, `amit90`, `keren90`, `efi96`)
  מצויר בגובה של הגיל בשנה ההיא (`heightAt`). חבר לכיתה אינו גבוה ממך בראש.
- **הבן אינו פוגי.** גוף ופנים של פוגי בכל גיל אסורים לכל דמות אחרת.
- **יושב — יושב על משהו.** מי שמצויר יושב מוצב על הרהיט המצויר (הכורסה, הספסל); מי שנשען —
  על מה שנשען עליו.
- **חפץ בשנה שלו, בשפה של המקום.** טלפון חכם לא לפני 2006; עיתון באנגלית לא בקיוסק בדרום
  תל אביב; עשן אדום לא ביום בלי משחק.
- **המצלמה פוגשת את מי שמדבר** — שורה-שורה (`meetSpeaker`), לא רק בפתיחה.

## 89 · הפרויקט ב-Supabase משותף עם DUBID — THE WORKER נוגע רק במה שהוא יצר (22.9.2026)

מאור: *"אני חולק סופרבייס עם האפליקציה הנוספת שלי DUBID."* הפרויקט הוא "Dubid"
(`afxpjfxwpdjvlmuoawda`), ו-DUBID כבר גר בו: הסכמות `core`, `game`, `shared`, וב-`public`
הטבלאות `arenas`, `bets`, `profiles`, `questions`, `system_configs`. נבדק במסד עצמו לפני שנכתבה
שורה, ובאותה בדיקה: אין אף טריגר על `auth.users`, ואף אובייקט של THE WORKER לא קיים.

1. **כל אובייקט מתחיל ב-`worker_`** — טבלה, פונקציה, טריגר, מדיניות, אינדקס. בתוך `public`,
   כי זו הסכמה היחידה שחשופה ל-API בלי צעד בלוח הבקרה (כלל "צעד שאף אחד לא עושה").
2. **שום דבר על `auth`.** לא טריגר ולא backfill מ-`auth.users`. הקובץ של 17.9 עשה את שניהם:
   `on_auth_user_created` — השם של התבנית הרשמית של Supabase, כלומר השם שהכי סביר שמישהו אחר
   כבר תפס — היה רץ על **כל הרשמה בפרויקט**, ותקלה בו הייתה מפילה את ההרשמה ל-DUBID. הכרטיס
   נוצר ב-`worker_profile_ensure()`, שהסנכרון קורא לה אחרי התחברות: משתמש של DUBID שלא פתח
   את THE WORKER לא מקבל שורה.
3. **ה-Site URL שייך ל-DUBID.** THE WORKER מוסיף רק Redirect URLs. אם הכתובת שלו חסרה ברשימה,
   Supabase שולח את האוהד ל-Site URL — כלומר ל-DUBID.
4. **קובץ אחד מריצים לכל שכבה, לפי הסדר.** `20260922090000_worker_shared_project.sql`, והוא
   מסתיים בשורת בדיקה (`worker_tables 7 · worker_functions 15 · auth_triggers 0`); אחריו —
   ורק אחריו, הוא בודק את זה בשורה הראשונה — `20260922120000_worker_collector_market.sql`
   (כלל 90). כל שאר הקבצים ב-`migrations`
   ריקים ואומרים את זה אם מריצים אותם; סכמת הארכיון עברה ל-`supabase/archive-schema/` כי היא
   יוצרת ב-`public` שמות כלליים (`source`, `club`, `match`) ואין לה מקום בפרויקט משותף.
5. **נבדק כמו שתוקפים.** Postgres 16 מקומי עם `auth` מדומה, ההרשאות ש-Supabase נותן כברירת
   מחדל, והטבלאות של DUBID לצד: הרצה כפולה של כל התיקייה, `anon` שמנסה לכתוב לכל טבלת
   `worker_` (לפי הקטלוג, לא לפי רשימה), וזרימה מלאה של כל פונקציה בשני משתמשים.
   **זה מה שמצא שההצטרפות לחדר של רויאל ראמבל חי לא עבדה מעולם:** `on conflict (room_id, …)`
   בפונקציה שאחת מעמודות הפלט שלה נקראת `room_id` הוא "column reference is ambiguous". בדיקה
   שקוראת את הקובץ לא יכלה לראות את זה; רק הרצה.
   `tests/portal-sync.test.ts` שומר את 1–4 על המקור: שום `create` בלי `worker_`, שום `on auth.`,
   שום `from auth.users`, ושום `alter`/`drop` על אובייקט שאינו של THE WORKER.

## 90 · הארון, שוק האדומים והמכירה הפומבית — הארכיון הוא הזהות, האנשים הם ההמשך (22.9.2026)

מפרט: `docs/specs/SHIRT-COLLECTOR-MARKET-AUCTION-SPEC-2026-09-22.md` · מפה: `docs/17-collector-market.md`.
מאור ביקש את כל שש השכבות: יש לי/מחפש, ארון, שוק, התאמות, שיחה, הצעות, השלמה, כרטיסי שיתוף,
אות ביקוש, התראות, חנויות, מכירה פומבית ותרומה אחרי השלמה. בלי עמלה ובלי תשלום דרכנו.

1. **החולצה היא שורה בארכיון, לא שורה במסד.** פריט מחזיק `archive_slug` (שם התצלום) ו-`kit_id`
   רק כשה-Kit Master מחזיק את התצלום המדויק. עונה, יצרן, ספונסר ותמונה לא מועתקים — ככה
   תיקון בארכיון מתקן גם את השוק. `/marketplace` לא קיים: הכול תחת `/kits` (מפרט §71).
2. **המסד הוא השרת** (הסקיל supabase-server-authority): אין grant לאף טבלה, כל כתיבה היא
   פונקציית `security definer` שמחזירה `{ ok }`/`{ ok:false, error }` כערך — כדי שמונה הניסיונות
   ישרוד — וכל `worker_admin_*` בודקת בשורה הראשונה. יומן ביקורת בטריגר על הטבלה, לא בפונקציות.
   **בפרויקט המשותף התחברות אנונימית של DUBID פעילה**, ומשתמש אנונימי הוא `authenticated`:
   `worker_market_uid()` מחזירה null לטוקן אנונימי, וכל כתיבה בשוק עוברת דרכה.
3. **אין מזהה משתמש, מייל או טלפון בשום תשובה.** אספן הוא `אספן #1842` (וכינוי אם בחר). חסימה
   ודיווח לפי המספר. השיחה היא הערוץ — כולל בין זוכה למוכר: הסגירה העצלה של לוט פותחת להם
   חיבור 'agreed', וההשלמה עוברת דרך הלוט גם כשלוחצים בשיחה (ביטול — רק מנהל).
4. **צבע של חפץ אמיתי אינו צבע של ממשק.** תמונות שאספנים מעלים מסומנות `[data-user-photo]`
   והסורק מסתיר אותן כמו תצלומי הארכיון — חולצה של 1997 היא צהובה כי היא הייתה. הסמל של
   1997–2000 הוא הנתיב החמישי ב-`lib/brand/yellowExemptions.ts`, באישור מאור במילים שלו. שום
   כפתור, תג או רקע בשוק לא צהוב/זהב/ענבר/כתום (מפרט §0).
5. **רפליקה נקראת רפליקה.** check במסד: `replica` לא טוען `original`; חנות רשמית רק
   `club_store` ורק `official`; אין פרמטרים של שותפים ב-URL. הזרע (`content/manual/merchant-offers.json`)
   נבדק ב-`tests/merchant-seed.test.ts`, ושורה נכנסת ב-`on conflict do nothing`.
6. **נבדק על Postgres.** `scripts/db/verify.sh`: שני הקבצים פעמיים, 85 טענות תקיפה וזרימה
   (`supabase/tests/20-collector.sql`). שורת הבדיקה בסוף הקובץ:
   `collector_tables 18 · collector_functions 72 · anon_can_write 0 · auth_triggers 0`.
7. **Vercel בונה רק כשמשהו שהאתר מריץ השתנה.** `vercel.json` → `ignoreCommand`
   (`scripts/vercel/should-build.mjs`): קומיט שנוגע רק ב-`docs/`, `tests/`, `scripts/`,
   `supabase/`, `brand/source/`, `data/reports|staging`, `content/raw` או `*.md` בשורש — לא בונה.
   כל העלאה ב-GitHub היא קומיט, וכל בנייה היא עוד ~300MB ב-Deployment Storage; לכן דלתא
   מסדרת את קבצי הריצה בכמה שפחות ZIP-ים.

