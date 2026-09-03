'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { t, type MessageKey } from '@/lib/i18n'

/**
 * הסרגל התחתון — fixed to the bottom of the viewport on every screen, above the
 * home indicator, with a real link and an active state per tab.
 *
 * It is `fixed`, not sticky-at-the-end-of-a-flex-column: on iOS the URL bar collapses
 * as you scroll and anything laid out in flow appears to drift. `Screen` reserves the
 * matching space, so nothing hides behind it.
 */

type Tab = { key: MessageKey; href: string; match: string; icon: 'wall' | 'lamp' | 'bars' | 'card' }

/**
 * Four places, and each label names the place it actually goes to.
 *
 * The previous bar did not. "הארכיון" pointed at `/kits`, which is the kit DESIGNER —
 * a toy, not an archive — and "התיק" pointed at `/tik`, which is כרטיס פועל and not the
 * black file at `/derby/file`. Two of four labels described something that was not
 * there, which is worse than no bar: a reader who follows a label once and lands
 * somewhere else stops trusting the whole navigation.
 *
 * The gate wall already navigates to gates, so this bar is not a second list of gates.
 * It is the four things a person returns to:
 *
 *   בלומפילד   `/`           the ground — where the gate plan hangs
 *   טריוויה    `/trivia`     the wing, five topics — the most-played thing in the app
 *   אוסישקין   `/ussishkin`  the basketball wing, kept apart by rule 14
 *   הכרטיס     `/tik`        gate 10 — the card, the punches, the corrections
 *
 * The icon follows the destination too: a wall for the ground, a lamp for the wing you
 * play in, the bars for Ussishkin, a card for the card.
 */
const TABS: Tab[] = [
  { key: 'tab.ground', href: '/', match: '/', icon: 'wall' },
  { key: 'tab.trivia', href: '/trivia', match: '/trivia', icon: 'lamp' },
  { key: 'tab.ussishkin', href: '/ussishkin', match: '/ussishkin', icon: 'bars' },
  { key: 'tab.card', href: '/tik', match: '/tik', icon: 'card' },
]

function TabIcon({ icon, active }: { icon: Tab['icon']; active: boolean }) {
  const tone = active ? 'border-red bg-red' : 'border-sheet'
  if (icon === 'wall')
    return <span className={`mx-auto block h-[13px] w-[18px] border-rule ${tone}`} />
  // The one permitted radius: this icon IS a floodlight lamp.
  if (icon === 'lamp')
    return <span className={`mx-auto block h-[15px] w-[15px] rounded-full border-rule ${tone}`} />
  if (icon === 'card')
    return <span className={`mx-auto block h-[12px] w-[17px] border-rule ${tone}`} />
  return (
    <span className="flex h-[15px] items-end justify-center gap-[3px]">
      <i className={`block h-[8px] w-[3px] ${active ? 'bg-red' : 'bg-sheet'}`} />
      <i className={`block h-[13px] w-[3px] ${active ? 'bg-red' : 'bg-sheet'}`} />
      <i className={`block h-[10px] w-[3px] ${active ? 'bg-red' : 'bg-sheet'}`} />
    </span>
  )
}

export function TabBar() {
  const pathname = usePathname()

  return (
    <nav
      aria-label={t('tab.aria')}
      className="fixed inset-x-0 bottom-0 z-50 border-t-plate border-red bg-ink pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-5xl grid-cols-4">
        {TABS.map((tab) => {
          const active = tab.match === '/' ? pathname === '/' : pathname.startsWith(tab.match)
          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className="flex min-h-tap flex-col items-center justify-center gap-1.5 py-2 text-sheet transition-transform duration-press ease-stamp active:scale-[.94] motion-reduce:transition-none"
              >
                <TabIcon icon={tab.icon} active={active} />
                <span
                  className={`font-body text-[10px] font-extrabold leading-none ${
                    active ? 'text-red' : 'text-sheet'
                  }`}
                >
                  {t(tab.key)}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
