# V13 FULL overlay manifest

## Route integration
- `app/kits/build/page.tsx` — switches the existing `/kits/build` route to V13.

## New application files
- `app/kits/build/KitGameRunV13.tsx`
- `components/kit/LayeredKitRenderer.tsx`
- `lib/kit/layered-assets.ts`

## New asset directory
- `public/kits/knowledge-v13/`

Contains the complete V13 visual layer set:
- photoreal transparent base fabric
- pattern overlays
- construction presets and physical construction layers
- crest alternatives
- maker cutouts
- sponsor cutouts
- cup badge cutouts
- reveal-only historical shirt image

## Critical rule
`public/kits/knowledge-v13/reveal-real-2009-10.png` is Reveal-only.
It is not imported or referenced by `LayeredKitRenderer.tsx`.
