# עמדה, מוצא ושנים — מחקר השחקנים, 15.9.2026

Maor: *"חייב לשפר את המידע והסינון והגדרות של השחקנים, נא לאמת ולהצליב עם הארכיון שלנו
או לבצע מחקר מקיף ולתת לכל שחקן עמדה, אם ישראלי או זר ושנים ששיחק בהם. חובה."*

This is the document that says how far that got, by what method, and exactly where it
stopped — because the stopping point is the part a future pass needs.

---

## Where it started

The archive knows **647 people**. Measured before this pass, with the same code that
now measures it after:

| | had a position | had Israeli/foreign | had years worn | **had all three** |
|---|---|---|---|---|
| before | 64 | 103 | 137 | **32** |
| after | **342** | **345** | **361** | **332** |

`players-roster.json` has four fields and three of them are the name. That is why the
filters could not exist before this: rule 24 already recorded the consequence for the
polls wing — *"a 'goalkeepers' shortlist would have to be guessed, and one striker in it
would make the wing untrustworthy."* Guessing a position from a shirt number, from an
era, or from a name is the same mistake wearing a better hat.

## The source

`https://www.worldfootball.net/teams/te956/hapoel-tel-aviv/vsYYYY-YYYY/squad/` —
one page per season, back to **1933/34**, each listing the squad with **position** and
**nationality**. **73 seasons were read**, 1933/34 → 2025/26, yielding **465 distinct
Latin-spelled players** with position, nationality and the seasons they appear in.

### What could not be reached, and was not worked around

- **he.wikipedia.org and en.wikipedia.org** are cache-only through `WebFetch` in this
  environment, and a direct request is refused by the agent proxy (`connect_rejected`).
- **ויקיפועל / wiki.red-fans.com** is still closed to automated access — it has been
  since the first research pass (`docs/04-verified-research.md`).

Rule 11: a blocked source is documented, not circumvented. Neither was used, and no row
below leans on one.

## The method — and why it is narrow on purpose

The source is Latin. Our roster is Hebrew. The whole pass is that bridge, and every
shortcut across it produces a wrong player wearing a real name.

Two passes, in `scripts/players/match.py`:

1. **`alias`** — we already held the Latin spelling (from `shirt-numbers.json`'s
   `personNameLatin`) and the source agreed. **90 rows.**
2. **`transliteration`** — Hebrew and Latin were reduced to consonant skeletons and
   aligned by dynamic programming that lets the matres lectionis (א ה ו ע י) be silent,
   folds digraphs, and skips a Latin `h`. A row is emitted **only if the Hebrew name
   aligns with exactly one of the 465**. **239 rows.**

Both passes enforce one claim per player, in both directions: a Latin name can be taken
once, a Hebrew name can take once.

### The surname-only pass was written, measured, and deleted

A third pass matching on surname alone was built and then **measured at roughly 50%
false positives** — אבי אדרי → Kfir Edri, גליל בן סנן → Moshe Sinai, ברונו סוארס →
Yaakov Schwartz. It was removed entirely rather than tuned, and the script carries a
comment saying so, because the next person to have this idea should find the answer
already there.

### Four bugs the measurements caught

| symptom | cause | fix |
|---|---|---|
| אבוקסיס ≠ Abukasis, בלילי ≠ Balili | doubled letters were collapsed *after* vowel removal | collapse before |
| וינסנט ≠ Vincent | blanket `c → k` | `c` stays, and is accepted by כ/ק/ס/צ/ש |
| **עלי כנאנה matched Eli Cohen** | de-duplication reached across a skipped letter | only literally adjacent letters collapse |
| יעקב כהן took Yuval Cohen, רמי כהן took Raz Cohen | first-come-first-served by iteration order | one-claim-per-player, both directions |

## What came out

`content/manual/player-facts.json` — **329 rows**, `confidence: 2`, `sport: "football"`,
each carrying `personNameHe`, `personNameLatin`, `position`, `nationalityEn`, `origin`,
`fromYear`, `toYear`, `seasons[]` and **`matchedBy`**, so any row can be re-checked
against the season page it came from.

- positions: MF 102 · DF 100 · FW 97 · GK 30
- origin: ישראלי 264 · זר 65
- span: 1933 → 2026
- **four men appear twice on purpose** — פישונט, שוויצר/שוייצר, בנבנישתי, אפק — because
  the roster holds two Hebrew spellings of each. Both rows carry `alsoSpelled`.

A **30-row random sample was checked by hand against the season pages: 30/30 correct.**

## What it refuses to answer

- **`ambiguous` — 8 names.** Each aligned with more than one Latin candidate, or wanted
  a Latin name another Hebrew name had a better claim to. They are printed by name with
  their candidates: איאד חוט'בא, יחזקאל חזום, מאור פרץ, עומרי לוי, תומר לוי, יובל כהן,
  רז כהן, רמי כהן. A refusal with the candidates attached is a question a human can
  answer in five seconds; a guess is a wrong fact that never gets found.
- **`unknown` — 325 names.** Not in the Latin source at all. Mostly pre-1990 players and
  youth-team names the source never listed.

Neither list is hidden. `לא מתועד` is a real bucket in the filters, with a real count.

## The route to 100%

The remaining 315 (325 unknown + 8 ambiguous, less overlap with rows already filled from
`squads.json`) cannot be filled by more of the same work — there is no further automated
source this environment can reach. Two routes, both needing a human:

1. **Maor fills them.** `players-to-fill.xlsx` is built for exactly that: RTL, Arial,
   one row per missing player, dropdown validation (שוער/הגנה/קישור/התקפה ·
   ישראלי/זר), a hint column showing which seasons we already hold a shirt number for,
   the 8 ambiguous names in their own section with their candidates, and a second sheet
   listing all 329 rows already filled with their `matchedBy` so the work can be audited.
   Rule 18: Maor is a source, not a claim to check.
2. **A ויקיפועל Cargo export**, fetched by a human browser and dropped into
   `scripts/ingest/` — the route `wiki:cargo` already exists for.

Until then the honest state is on screen and in this file: 332 of 647 complete, every one
of them sourced, and 315 that say `לא מתועד` rather than something that sounds better.
