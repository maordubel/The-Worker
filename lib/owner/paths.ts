/**
 * LIFE is closed (owner, 24.11.2026): "close LIFE to the public, COMING SOON everywhere; nobody enters but the admin,
 * through a dedicated link" — in FAN LIFE and in THE WORKER. Every page below goes to the Coming soon screen unless the
 * request carries the owner's cookie; the owner's door is `/owner`. Shared assets (`/life/sfx`, `/life/art`, …) stay open.
 */
export const LIFE_SOON_PATH = '/coming-soon'
export const OWNER_DOOR = '/owner'
export function isLifePath(pathname: string): boolean {
  const p = pathname.replace(/\/+$/, '') || '/'
  if (p === '/life') return true
  if (p.startsWith('/life/') && (/\.html?$/i.test(p) || !/\.[a-z0-9]+$/i.test(p))) return true
  if (/^\/qa\/life-[^/]+/.test(p)) return true
  return false
}
