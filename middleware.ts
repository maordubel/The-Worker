import {NextRequest, NextResponse} from 'next/server'
import {isLifePath, LIFE_SOON_PATH} from '@/lib/owner/paths'
import {ADMIN_COOKIE, ownerFromCookie} from '@/lib/owner/edge'

/** LIFE is closed (owner, 24.11.2026): every LIFE page shows Coming soon; only the owner's verified cookie enters (door: /owner). */
export async function middleware(r: NextRequest) {
  if (!isLifePath(r.nextUrl.pathname)) return NextResponse.next()
  const owner = await ownerFromCookie({FAN_LIFE_ADMIN_KEY: process.env.FAN_LIFE_ADMIN_KEY, NODE_ENV: process.env.NODE_ENV}, r.cookies.get(ADMIN_COOKIE)?.value).catch(() => false)
  if (owner) return NextResponse.next()
  // a relative Location: behind Cloudflare and Cloud Run the server sees localhost:3000, so a rewrite to it fails (24.11.2026)
  const res = new NextResponse(null, {status: 307, headers: {Location: LIFE_SOON_PATH}})
  res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  res.headers.set('Cache-Control', 'private, no-store')
  return res
}
export const config = {matcher: ['/life', '/life/:path*', '/qa/:path*']}
