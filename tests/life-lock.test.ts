import {createHmac} from 'node:crypto'
import {describe, expect, it} from 'vitest'
import {isLifePath} from '@/lib/owner/paths'
import {ownerFromCookie} from '@/lib/owner/edge'

const KEY = 'a-long-enough-owner-key-123'
const env = {FAN_LIFE_ADMIN_KEY: KEY, NODE_ENV: 'production'}
const token = (key: string, now = Math.floor(Date.now() / 1000)) => {
  const payload = `v1.${now}.${now + 30 * 86400}`
  const secret = createHmac('sha256', key).update('fan-life-admin-session-v1').digest()
  return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`
}

describe('LIFE lock (owner, 24.11.2026)', () => {
  it('names every LIFE page and player, and leaves shared assets open', () => {
    for (const p of ['/life', '/life/', '/life/stage', '/qa/life-opening', '/qa/life-pitch']) expect(isLifePath(p), p).toBe(true)
    for (const p of ['/', '/kits', '/qa/stats', '/life/sfx/whistle-1.m4a', '/life/art/standCrowd.webp', '/coming-soon', '/owner']) expect(isLifePath(p), p).toBe(false)
  })
  it('opens only for a cookie signed with the FAN LIFE admin key', async () => {
    expect(await ownerFromCookie(env, token(KEY))).toBe(true)
    expect(await ownerFromCookie(env, token('another-key-of-enough-length'))).toBe(false)
    expect(await ownerFromCookie(env, undefined)).toBe(false)
    expect(await ownerFromCookie({NODE_ENV: 'production'}, token(KEY))).toBe(false)
  })
})
