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
      `WorldScene` reads a `MapDef`; there are nine locations and one scene class, which
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
      now **3** — see rule 46; version 2 is READ, because nothing in it needed converting.)
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
      `SAVE_VERSION` is 3 and a version-2 file is READ, not dropped.
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
    - **The profile screen has no bars and no numbers.** The Red Heart is SET, not
      plotted: each pull is a word printed at a size that says how much. A relationship is
      a distance on a rule with a slash for friction. `lib/life/profile.ts` is the only
      translator, so no screen can accidentally render a value. The debug panel — the one
      screen that shows the truth — is behind `NODE_ENV`, not behind a flag somebody can
      flip.
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
