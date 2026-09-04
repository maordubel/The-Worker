/**
 * Every named person in every room, with the size the runtime will draw them at against
 * the size it gives the boy standing on the same line. Actor `size` is absolute — it does
 * not follow the band — so a man "at the back of the room" drawn at a front-of-room size
 * is a number here before it is a picture.
 *
 *   npx tsx scripts/life/actor-sizes.ts            → 1986
 *   ERA=1990 npx tsx scripts/life/actor-sizes.ts   → 1990
 */
import { eraFor } from '../../lib/life/content/era'
import { ALL_SCENES, inEra } from '../../lib/life/world/scenes'

const era = process.env.ERA ?? '1986'
const k = eraFor(era).player.scale ?? 1
for (const s of ALL_SCENES) {
  for (const a of s.actors) {
    if (!inEra(a, era)) continue
    const t = Math.max(0, Math.min(1, (a.y - s.band.far) / (s.band.near - s.band.far)))
    const boy = (s.size.far + (s.size.near - s.size.far) * t) * k
    console.log(
      `${s.id.padEnd(20)} ${a.id.padEnd(16)} x=${a.x} y=${a.y} size=${a.size} boyHere=${boy.toFixed(2)} ratio=${(a.size / boy).toFixed(2)}`,
    )
  }
}
