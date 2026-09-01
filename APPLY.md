# The Worker — delta, 1 Sep 2026

Unzip over the repo root. Everything here replaces a file or adds one; nothing needs
deleting. `npm i -D pngjs @types/pngjs` once (the badge scan test decodes PNGs).

Then: `npm run typecheck && npm run test && npm run build`.

## What is in it

**The wall (`/`)**
- `app/page.tsx` — the curva now hangs at the head of the wall and spans the full
  width. The span had to move onto the `<li>`; a `col-span` on the link inside a grid
  item spans nothing, which is why gate 5 was half-width with a hole beside it.
- `lib/gates.ts` — `wallOrder()`. Gate numbers are untouched; only the hanging order
  changes, and only so the grid closes at both two and three columns.
- `components/gates/GatePlate.tsx` — שער on the right, Latin on the left, ULTRAS
  HAPOEL on gate 5, and the Latin foot line wraps instead of truncating.

**The badge**
- `components/ui/Badge.tsx` — one component, rendered `unoptimized`.
- `components/ui/SignPlate.tsx` — the badge is now on EVERY screen header, not only
  the ground.
- `scripts/brand/badge.py` + `brand/source/badge-original.png` — the six sizes are
  rebuilt from your original, reproducibly.
- `public/brand/logo*.png` — regenerated.

**Gate 11 — התיק השחור**
- `lib/game/blackfile.ts`, `app/derby/*`, `content/manual/grievances.json`.

**Gate — אגף אוסישקין**
- `app/ussishkin/page.tsx`, `components/ui/TabBar.tsx`.

**Rules that now fail the build**
- `tests/brand.test.ts` — six badge PNGs scanned pixel by pixel for yellow, plus a
  guard that nothing renders the badge outside `Badge.tsx`.
- `tests/game.test.ts` — five tests for gate 11.
