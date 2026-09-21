# Gate 4 V13 — QA

## Rule enforced
During BUILD, the UI never renders a historical full-shirt master/photo.
The real shirt is referenced only in the Reveal state.

## Layer architecture
- Base fabric: `base-red-realistic.png`
- Pattern overlays: vertical stripes / tonal hoops / sash
- Construction split: collar / side panels / cuffs / hem
- Construction presets are compositions of those physical layers
- Crest is an independent transparent asset
- Manufacturer is an independent transparent/vector asset
- Sponsor is an independent transparent/vector asset
- Cup badge is an independent transparent asset
- Real shirt: `reveal-real-2009-10.png`, Reveal only

## Game flow
5 high-value decisions:
1. Body / pattern
2. Construction
3. Crest
4. Manufacturer
5. Sponsor

Tap selects and auto-advances. Long press opens contextual archive info.
No answer correctness is revealed until the end.

## Automated checks
- Inline JavaScript syntax: PASS (`node --check`)
- Real-shirt reference in build renderer: PASS — none
- Real-shirt reference in V13 game component: PASS — Reveal branch only
- Layer assets present: PASS
- Transparent cutout assets present: PASS
- Existing GitHub repository modified: NO

## Asset inventory
- `badge-cup-clean.png` — 436×440 — alpha=True (0–255)
- `badge-cup.png` — 402×388 — alpha=True (0–255)
- `base-red-realistic.png` — 1122×1402 — alpha=True (0–255)
- `construction-2009-10.png` — 1122×1402 — alpha=True (0–255)
- `construction-plain-crew.png` — 1122×1402 — alpha=True (0–255)
- `construction-vneck-white.png` — 1122×1402 — alpha=True (0–255)
- `crest-circle-1923.png` — 532×462 — alpha=True (0–255)
- `crest-circle-1927.svg` — SVG/vector
- `crest-keter.svg` — SVG/vector
- `layer-collar-crew-white.png` — 1122×1402 — alpha=True (0–255)
- `layer-cuffs-white.png` — 1122×1402 — alpha=True (0–255)
- `layer-hem-white.png` — 1122×1402 — alpha=True (0–255)
- `layer-side-panels-white.png` — 1122×1402 — alpha=True (0–255)
- `maker-macron.png` — 832×100 — alpha=True (0–255)
- `maker-puma.png` — 970×740 — alpha=True (0–255)
- `maker-umbro.png` — 546×326 — alpha=True (0–255)
- `maker-umbro.svg` — SVG/vector
- `pattern-sash.png` — 1122×1402 — alpha=True (0–254)
- `pattern-tonal-hoops.png` — 1122×1402 — alpha=True (0–254)
- `pattern-vertical-stripes.png` — 1122×1402 — alpha=True (0–254)
- `reveal-real-2009-10.png` — 1122×1402 — alpha=True (0–255)
- `sponsor-arkia.png` — 928×634 — alpha=True (0–255)
- `sponsor-fujitsu.png` — 934×710 — alpha=True (0–255)
- `sponsor-subaru.png` — 812×468 — alpha=True (0–255)
- `sponsor-subaru.svg` — SVG/vector

## Known remaining production work
- The 2009/10 cup badge source is lower fidelity than the shirt fabric/master and should be replaced when a cleaner archival badge source is available.
- More seasons need the same decomposition pipeline; V13 establishes the renderer/data architecture, not a shortcut using completed shirt photos.
- Historical correctness of each crest-year variant should continue to come from the archive source data; UI assets must not override research truth.
