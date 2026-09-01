/**
 * TOMBSTONE — retired 1.9.2026, replaced by `KitRun.tsx`.
 *
 * This file used to be gate 4's board and imported a server action (`submitKit`) that
 * no longer exists. It is left here as a valid, inert re-export ON PURPOSE.
 *
 * Why: deltas are uploaded to GitHub through the web UI, which ADDS and OVERWRITES
 * files but does not delete them. A retired file that still contains a broken import
 * therefore keeps failing `next build` on the deploy even though the local tree is
 * clean — which is exactly what happened here, twice. Asking for a delete command was
 * the wrong fix; the right one is that a retired file must always compile.
 *
 * Nothing imports this. It can be deleted whenever convenient.
 */
export { KitRun as KitChallengeBoard } from './KitRun'
