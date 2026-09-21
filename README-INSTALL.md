# THE WORKER — Gate 4 V13 FULL OVERLAY

This ZIP is a complete manual-upload overlay for the existing `maordubel/The-Worker` repository.
It does not contain a fake standalone app. It replaces the live `/kits/build` route with the V13 layered kit game.

## What V13 guarantees

- During BUILD there is **no real historical shirt photo/master**.
- The shirt is assembled layer-by-layer from independent assets:
  - base fabric
  - pattern
  - construction / collar / panels / cuffs / hem
  - crest
  - kit manufacturer
  - sponsor
  - badge
- The historical real shirt is used **only in Reveal**.
- Mobile-first single-screen game flow: 5 decisions, tap-to-place, auto-advance.
- Long press opens contextual information without leaving the game.

## Install

1. Back up your current branch or commit first.
2. Extract this ZIP.
3. Copy the contents of this folder into the **root** of your `The-Worker` repository.
4. Allow these files to overwrite existing paths where present.
5. Run:

```bash
npm install
npm run lint
npm run build
```

6. Open `/kits/build` on mobile width (recommended 390×844 first).

## Files replaced / added

### Replaced
- `app/kits/build/page.tsx`

### Added
- `app/kits/build/KitGameRunV13.tsx`
- `components/kit/LayeredKitRenderer.tsx`
- `lib/kit/layered-assets.ts`
- everything under `public/kits/knowledge-v13/`

## Important

Do **not** delete the existing V5 files yet. V13 is intentionally added beside them so rollback is trivial.
The route switch is only `app/kits/build/page.tsx`.

To roll back, restore the previous `app/kits/build/page.tsx`.
