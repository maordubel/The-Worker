import {NextRequest, NextResponse} from 'next/server'
import {isLifePath, LIFE_SOON_PATH} from '@/lib/owner/paths'
import {ADMIN_COOKIE, ownerFromCookie} from '@/lib/owner/edge'

/** LIFE is closed (owner, 24.11.2026): every LIFE page shows Coming soon; only the owner's verified cookie enters (door: /owner). */
export async function middleware(r: NextRequest) {
  if (!isLifePath(r.nextUrl.pathname)) return NextResponse.next()
  const owner = await ownerFromCookie({FAN_LIFE_ADMIN_KEY: process.env.FAN_LIFE_ADMIN_KEY, NODE_ENV: process.env.NODE_ENV}, r.cookies.get(ADMIN_COOKIE)?.value).catch(() => false)
  if (owner) return NextResponse.next()
  // behind Cloudflare and Cloud Run nextUrl reads localhost:3000 and a relative Location is an Invalid URL here:
  // redirect to the public host the request came in on (24.11.2026)
  const host = (r.headers.get('x-forwarded-host') || r.headers.get('host') || r.nextUrl.host).split(',')[0]!.trim().toLowerCase()
  const safe = /^([a-z0-9-]+\.)*dubelteam\.com$|^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ? host : 'theworker.dubelteam.com'
  const proto = /^(localhost|127\.0\.0\.1)(:|$)/.test(safe) ? 'http' : 'https'
  const res = NextResponse.redirect(`${proto}://${safe}${LIFE_SOON_PATH}`, 307)
  res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  res.headers.set('Cache-Control', 'private, no-store')
  return res
}
export const config = {matcher: ['/life', '/life/:path*', '/qa/:path*']}
