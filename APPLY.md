# The Worker — delta 4, 1 Sep 2026

Unzip over the repo root, delete what `DELETE-THESE.txt` lists, then
`npm run typecheck && npm run test && npm run build`.

**217 tests · build green · responsive clean · 0 yellow pixels** — including a scan of
all 32 season kits drawn at once.

---

## 1 · הדירוג שלך, מילה במילה

`content/manual/enemies.json` — **56 rows, `terraceRank` 1–56 is your order.** Not an
editorial guess, and no future session may "correct" it (CLAUDE.md rule 18).

Both corrections applied: **ים מדר** and **אמיר גרוס כבירי**.
The six extras sit at 51–56. Every row carries your charge in the terrace's voice, what
a source states, and the source URL.

Research found the thread behind three of your extras: **משחק השרוכים, 2.5.1998** —
Beit She'an lost 3–2 to Beitar at a neutral ground, Tayeb tied his laces at midfield as
the equaliser went in. Tayeb, Meir Cohen and Beit She'an all trace to that night.

Three rows have no sourceable detail and print the charge alone rather than an invented
record: וויצ'יץ', ארל ויליאמס, and **אמיר גולה — no source anywhere ties him to injuring
שלום תקוה. A rough date or competition from you would close it.**

## 2 · משחק. לא טופס.

`lib/game/session.ts` is the loop now, and it is shared:

- **אין כפתור "הבא"** — a right answer advances itself after 900ms.
- **הריצה לא מנווטת בכלל.** All twelve questions are dealt at once (answers stripped on
  the server) and played on one screen. A page transition is a full stop.
- **שלושה שלבים** that escalate, with a full-bleed card naming the new rule.
- **שלושה פנסים.** Wrong costs one. Zero ends the run.
- **מכפיל רצף** 1×→4×, and a clock that tightens **20s → 15s → 11s**. Fast pays more.
- **תנועה**: points burst on a hit, the plate shakes on a miss, the stage card slams in.
  All off under `prefers-reduced-motion`.
- Game screens run `<Screen chrome={false}>` — no masthead, no footer. Those were eating
  a third of a phone screen.

Live on **gate 2 (טריוויה)** and **gate 4 (אתגר החולצה)**.

## 3 · 32 חולצות עונה, מהתמונות ששלחת

`content/manual/kit-designs.json` — **this closes the oldest hole in the project.**
CLAUDE.md carried a line for weeks saying no source stated the cut of any season, so the
shirt was drawn plain and the screen admitted it. Your references changed that: 32 season
kits, every field read off a picture, with a source on every row.

Five new cuts had to be added to draw them: **פס חזה** (2002/03 KETER), **רבעים**
(מ.שקוביץ), **אלכסונים דקים** (the adidas Tiberias shirt), **שני פסים** (CAL 99/00),
**כתפיים** (2011/12, 2020/21).

- **בית החולצות** now opens on the club's real history, newest first — tap 1993/94 and
  the Diadora quarters appear. There is a **הגרל חולצה** button.
- **`KitStrip`** draws the full kit — shirt, shorts, **a pair of socks** — because every
  reference you sent shows a strip.
- **גייט 4 is a new game**: a drawn kit, four seasons, which one? Difficulty is derived —
  a one-off cut is easy, plain red in the plain-red years is hard, because only the
  sponsor separates them. Runs on the same loop.

One deliberate omission: the 1988/89 VISA block carries a colour the brand forbids
outright, so that sponsor is lettered as text like every other sponsor in the app.

`colours-of-football.com` returns 403 to automated reads. I did not circumvent it — your
screenshots are the source, and the row says so.

## 4 · הסטוריז — שש התבניות

`lib/share/story.ts` rebuilt on `The Worker - Story Templates.dc.html`: five grounds
(`score` cream · `grass` · `ink` · `kit` silkscreen · `year` vermilion), each
**headline · one graphic · credit strip**, with the handoff's **260px safe zone** top and
bottom. Type is skewed and printed twice — ink under at a hard offset, colour over. That
is the second plate, not a drop shadow.

The kit template draws your actual shirt from the same path data the app uses, so the
shirt on screen and the shirt on the story can never drift apart. Trivia gets the
twelve-mark punch grid.

---

## Still open

- **אמיר גולה / שלום תקוה** — needs a date from you.
- The run loop is on gates 2 and 4. Memory, lineup, goal and timeline are next.
- **wiki.red-fans.com** still 403s — shirt numbers, chants, older grievances. Emailing
  the Red Fans owners is the highest-value unblock left.
