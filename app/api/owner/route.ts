import {createHash, timingSafeEqual} from 'node:crypto'
import {NextResponse} from 'next/server'
import {ADMIN_COOKIE, ADMIN_SESSION_DAYS, issueOwnerToken} from '@/lib/owner/session'
import {configuredKey, normalizeKey} from '@/lib/owner/token-pure'

/** The owner's door (owner, 24.11.2026): the FAN LIFE admin key in, a signed cookie out, then straight into LIFE. */
export async function POST(r: Request) {
  const form = await r.formData().catch(() => null)
  const typed = typeof form?.get('key') === 'string' ? normalizeKey(String(form!.get('key'))) : ''
  const key = configuredKey({FAN_LIFE_ADMIN_KEY: process.env.FAN_LIFE_ADMIN_KEY})
  const back = (q: string) => NextResponse.redirect(new URL(`/owner?e=${q}`, r.url), 303)
  if (!key) return back('closed')
  const a = createHash('sha256').update(typed).digest(), b = createHash('sha256').update(key).digest()
  if (!(timingSafeEqual(a, b) && typed.length === key.length)) return back('wrong')
  const token = issueOwnerToken()
  if (!token) return back('closed')
  const res = NextResponse.redirect(new URL('/life', r.url), 303)
  res.cookies.set(ADMIN_COOKIE, token, {httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: ADMIN_SESSION_DAYS * 86400})
  res.headers.set('Cache-Control', 'no-store')
  return res
}
