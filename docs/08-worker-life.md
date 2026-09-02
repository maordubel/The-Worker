# THE WORKER LIFE — Stage 1

Route: `/life` · Status: vertical slice, playable end to end · Chapter: 1980

---

## What it is

A real 2D game inside the existing app: a child of eight in south Tel Aviv on one
Saturday in 1980, a father who is going to Bloomfield without him, and a clock that does
not wait. Roughly 15–20 minutes of play.

It is deliberately NOT the 1972–2026 game and NOT the 1990s. It exists to answer one
question — is this fun to play — and everything in it is built so the answer can be acted
on without a rewrite.

## The four layers

```
app/life/page.tsx            server component — resolves the anchors, renders the shell
  └── LifeStage.tsx          client — mounts Phaser, subscribes to the bus, draws the DOM
        ├── lib/life/                 the Life Engine        (pure TS)
        ├── lib/life/runtime/         Phaser                 (client-only, dynamic import)
        ├── lib/life/content/         the authored fiction   (no facts)
        └── lib/life/anchor-server.ts the archive bridge     (server-only)
```

**The engine owns the life; Phaser owns the pixels.** A scene never writes a number — it
dispatches a `LifeEvent` and re-reads the state. That is what stops the same rule being
implemented twice, differently, in a scene and in a minigame.

**The save is the event log**, not a snapshot: `{ version, identity, year, events[] }` in
`localStorage` under `the-worker:life`, written on a debounced trailing edge and
immediately on anything structural. Folding is deterministic and an unknown event type
from a newer build is a no-op, so a save opens after a chapter is rewritten.

## The world

Nine locations, one `WorldScene`, all of it data (`lib/life/world/maps.ts`):

| location | what happens there |
|---|---|
| `bedroom` | the house key, the poster, the red box the memory ends up in |
| `home` | Kobi with the newspaper, Rachel and the bottles, the radio |
| `street` | the hub — Ofir, the kiosk, the alley to the pitch, the road east |
| `kiosk` | return the bottles, buy a paper or a card — money with trade-offs |
| `pitch` | 3v3, one button, 25 minutes of the afternoon |
| `route` | crowd density climbing east; the pylons appear over the roofs |
| `bloomfield-outside` | the fence, gate 7, the ticket window, four ways in |
| `bloomfield-tunnel` | dark, narrow, one direction |
| `bloomfield-inside` | the reveal, the match, the whistle, finding Kobi |

A location is a `MapDef`: paint ops, solids, spawns, people, props, exits. Adding 1990 is
a second layer list against the same geometry — which is what makes the adult recognise
the street.

## The historical anchor

`resolveChapterAnchor()` reads `archive.trophies` and returns the **1980/81 league
championship**: sourced, confidence 2, sport-scoped (rule 6).

The archive holds **no 1980s match** — `content/manual/matches.json` starts at 2001/02 —
so the deciding game has no date, no opponent, no score and no scorer, and the game states
none of them. The historical card prints a marked `DEVELOPMENT PLACEHOLDER` naming exactly
what is missing and what would retire it.

**To retire it:** add a curated 1980/81 match row at confidence ≥ 2 and set `placeholder`
to `null` in `lib/life/anchor-server.ts`. Nothing else changes.

The prologue's anchor is the same shape: the 1971/72 State Cup, sourced, with the final
itself marked missing.

## Verification

| command | what it proves |
|---|---|
| `npm run test` | `tests/life.test.ts` — 33 guards: no yellow, the visual canon, the anchor's honesty, the fold, every door, every conversation |
| `npm run life:play` | plays the real build at 3 widths: prologue, movement, a scene change, a conversation, a choice — then scans for yellow, overflow and page errors |
| `npm run qa:sweep` | `/life` is swept like every other screen |

## The art

Every backdrop and every person is a rectangle of one of Maor's approved concept boards.

```
scripts/life/art-manifest.json   which crop of which board becomes which asset
scripts/life/build-art.py        upscale → de-yellow → de-fringe → palette PNG
public/life/art/*.png            48 assets, ~6 MB, loaded one room at a time
lib/life/runtime/art.ts          the only place the game names a file
```

| group | what |
|---|---|
| backdrops | living · bedroom · kitchen · kiosk · street · pitch · approach · gate7 · ground · corridor · reveal · stand · ussExt · ussHall |
| figures | kid · ofir · amit · efi · keren · kobi · rachel · seven Bloomfield fans · oldMan |
| portraits | nine printed plates for the dialogue box |
| props | newspaper · radio · scarf · hat · ticket · coffee · ball |

To re-cut an asset: change its box in the manifest and run `python3 scripts/life/build-art.py`.
Nothing in the game moves — every position in `world/scenes.ts` is a fraction of the
backdrop, not a pixel.

## Still temporary

- **One pose per character.** The boards are presentation art, not sprite sheets, so a
  walking child is a static figure with a bob and a lean rather than a walk cycle.
- **Kobi and Rachel are half-figures** and are staged where that reads: seated, behind a
  table, inside a crowd.
- **Ussishkin's two backdrops are cut and shipped but not yet placed** in a scene — the
  wing is preserved and reference-ready, as the brief asks, and no gameplay was built for it.
- **There is no audio at all.** The crowd rising on the walk to the ground is told in
  paint, crowd density and grade, not in sound.
