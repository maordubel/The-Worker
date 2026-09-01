/**
 * TOMBSTONE — retired 1.9.2026. Gate 4 is now `KitBuildRun.tsx`.
 *
 * Left as a valid, inert file ON PURPOSE. Deltas reach the repo through GitHub's web
 * upload, which adds and overwrites but never deletes, so a retired file that still
 * contains a broken import keeps failing the deploy long after the local tree is clean.
 * A retired file must always compile.
 *
 * It exports NOTHING and imports NOTHING. An earlier version re-exported the file that
 * replaced it, which broke the moment that file was itself renamed — a tombstone that
 * depends on a living module is not a tombstone.
 */
export {}
