/**
 * פרסומות ומדידה — where the money and the measurement live.
 *
 * Both IDs are constants rather than environment variables on purpose: they are public
 * by nature (they ship in the page source of every AdSense and GA site on the web), and
 * a delta that reaches the repo through GitHub's web upload cannot carry a `.env`. An
 * env var here would mean a live site with the tags silently missing.
 *
 * **The placement rule, and it is the whole point.** Maor asked for the ads to fit in
 * "without disturbing us, flowing naturally". A game with a run in progress is the one
 * place an ad may never appear: a banner that reflows the board mid-question costs the
 * player the question, and an interstitial between stages would break the thing rule 21
 * exists to protect — that a run never stops. So:
 *
 *   · **Never during a run.** `<Screen chrome={false}>` is the marker for a run screen,
 *     and no ad slot renders on one.
 *   · **After the whistle.** The result screen is where a person is already stopping,
 *     reading and deciding what to do next — the honest place for an ad, and the one
 *     with the best odds of being looked at rather than resented.
 *   · **On the reading screens.** The gate wall, the archive, the memorial, the black
 *     file — pages a person scrolls rather than plays.
 *   · **One per screen.** Two units on one phone screen is a page that sells rather
 *     than a page that has something on it.
 *   · **Reserved height.** Every slot reserves its space before the script answers, so
 *     an ad that loads late never shifts the content under a thumb already moving.
 */

/** AdSense publisher — Maor's own account. */
export const ADSENSE_CLIENT = 'ca-pub-2094079368271424'

/** GA4 measurement ID. */
export const GA_ID = 'G-45L8F571TR'

/**
 * Where a slot may appear. The name is the ad unit's job, not its size — a slot that
 * knows what it is for is a slot somebody can reason about later.
 */
export type AdPlacement =
  /** under a finished run, above the share row */
  | 'result'
  /** at the foot of a page a person reads rather than plays */
  | 'reading'

/**
 * Ads are OFF while a run is in progress, and this is the one function that decides it.
 * A component asking "am I in a run?" for itself is how that rule rots.
 */
export function adsAllowed(chrome: boolean): boolean {
  return chrome
}

/** Report a game event to GA4, if it is loaded. Never throws, never blocks a tap. */
export function track(event: string, params: Record<string, string | number> = {}): void {
  if (typeof window === 'undefined') return
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
  if (typeof gtag !== 'function') return
  try {
    gtag('event', event, params)
  } catch {
    // measurement is never load-bearing
  }
}
