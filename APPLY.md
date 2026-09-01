# The Worker — delta 2, 1 Sep 2026

Unzip over the repo root, then **delete the four files listed in `DELETE-THESE.txt`** —
two of them moved, two are a share system that has been replaced.

`npm run typecheck && npm run test && npm run build` · 211 tests · 0 yellow pixels
across 14 routes × 5 widths.

---

## 1 · משחק השנאה — gate 11 is a hatred game now

`/derby`. Eight enemies, a knockout, seven taps, no right answers. The verdict is YOUR
number one printed as a wanted bill, plus how far your bracket ran with the terrace's.
The old transfer quiz moved to `/derby/file` as the gate's second act.

- `content/manual/enemies.json` — 14 figures, football AND basketball. Ofer Yanai,
  Shaul Eisenberg, Eran Zahavi, Shimon Gershon, Gili Vermouth, Haim Ramon, plus Eli
  Taviv, the Nisanov brothers, Amir Gross Kabiri, Tal Ben Haim, La Familia, Mitchell
  Goldhar, Yam Madar, Yaniv Green. Each carries a `chargeHe` in the terrace's voice, a
  `detailHe` of what the record states, a stamped fact, a source URL and a
  `terraceRank`. **The ranking is one number per row in one file — argue with it and
  change it.**
- `sport` travels on every row, so no basketball name can reach a football question.
  The wall between the sports is a field, not an omission.
- `lib/game/hate.ts` (the seeded draw, server) · `lib/game/hate-run.ts` (the rules,
  client, so a tap resolves in the same frame) · `components/hate/EnemyPlate.tsx`.

## 2 · שיתוף — one system, everywhere

- `lib/share/story.ts` draws a **real 1080×1920 PNG on a canvas** and hands it to the
  phone's share sheet, which is how it reaches Instagram Stories and WhatsApp Status
  directly. Not a screenshot: the card has its own composition, its own type sizes and
  the badge and address printed on it.
- `lib/share/copy.ts` writes the WhatsApp and Telegram message, always with a `?seed=`
  link — **the receiver gets the identical round**, so a share is a dare and not a
  boast. That line is printed on the card too.
- `components/share/ShareRow.tsx` is now on: hate, trivia summary, kit designer, kit
  challenge, memory, lineup, timeline.
- The old SVG-foreignObject share card is deleted. Two share systems was one too many,
  and that one could not embed fonts reliably.

## 3 · טריוויה — two new question shapes

- **ציטוט**: a line of speech set as speech, off a vermilion rule, then either "באיזה
  משחק נאמר?" or "מי אמר?". `content/manual/calls.json` holds four, including your
  Berkovic call — sourced to you by name, because a dedicated research pass could not
  find it in any indexed outlet and inventing a citation for it would have been worse
  than saying where it came from.
- **בחירה מרובה**: six options, exactly three right, all-or-nothing, and the reveal
  marks WHICH three so a wrong answer still teaches something. Live on the shirt-number
  data — numbers 9, 11 and 12 have enough documented holders.
- 305 questions now, up from 301. Grading still happens on the server from the seed.

## 4 · בית החולצות — the Kit Builder handoff, implemented

`lib/kit/spec.ts` + `components/kit/KitShirt.tsx`. Eight layers, one JSON object in,
SVG out, **no image files at all**: 12 cuts, 5 collars, 5 sleeve treatments, 3 namesets,
the exact outline and clip paths from your file. `compareSpecs()` scores a rebuild
layer by layer — "הגזרה נכונה, הצווארון לא" — exactly as the handoff specifies.

- `/kits` — the designer rebuilt on the stack, five tabs, the shirt redraws on every tap.
- `/kits/build` — the shirt is now drawn with the maker and sponsor slots cut out as
  navy dashed boxes. Your "מה חסר בחולצה?" screen.

## 5 · CLAUDE.md — rule 18

Recorded, so no future session repeats it: **you are a source, not a claim to be
checked.** Research expands what you give; it does not overrule it. What stays absolute
is only fabrication — never a date, fee or fixture that no source states.
