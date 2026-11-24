import 'server-only'
import {createHmac} from 'node:crypto'
import {cookies} from 'next/headers'
import {ADMIN_COOKIE, ADMIN_SESSION_DAYS, configuredKey, adminPolicy} from './token-pure'
import {ownerFromCookie} from './edge'

const env = () => ({FAN_LIFE_ADMIN_KEY: process.env.FAN_LIFE_ADMIN_KEY, NODE_ENV: process.env.NODE_ENV})
/** the same `v1.<iat>.<exp>.<hmac>` token FAN LIFE's control room issues, signed with the same key */
export function issueOwnerToken(now = Math.floor(Date.now() / 1000)): string | null {
  const key = configuredKey(env())
  if (!key) return null
  const payload = `v1.${now}.${now + ADMIN_SESSION_DAYS * 86400}`
  const secret = createHmac('sha256', key).update('fan-life-admin-session-v1').digest()
  return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`
}
export const ownerPolicy = () => adminPolicy(env())
export async function isOwner(): Promise<boolean> {
  return ownerFromCookie(env(), cookies().get(ADMIN_COOKIE)?.value).catch(() => false)
}
export {ADMIN_COOKIE, ADMIN_SESSION_DAYS}
