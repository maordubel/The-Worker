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

type Tab = { key: MessageKey; href: string; match: string; icon: 'wall' | 'game' | 'tower' | 'file' }

/**
 * Four WINGS of the ground, not four shortcuts.
 *
 * The previous bar pointed at three arbitrary gates and the wall, which is why it read
 * as noise: the gate plan already navigates to gates, so a second list of gates is a
 * competing system saying nothing new. These four are the only top-level places that
 * are not a gate:
 *
 *   בלומפילד  the ground — where the gate plan hangs
 *   הארכיון   the record behind the games: kits, seasons, sources
 *   אוסישקין  the basketball wing — a different club, kept apart by rule 14
 *   התיק      gate 11 — משחק השנאה and the black file behind it
 */
const TABS: Tab[] = [
  { key: 'tab.ground', href: '/', match: '/', icon: 'wall' },
  { key: 'tab.archive', href: '/kits', match: '/kits', icon: 'file' },
  { key: 'tab.ussishkin', href: '/ussishkin', match: '/ussishkin', icon: 'tower' },
  { key: 'tab.file', href: '/derby', match: '/derby', icon: 'game' },
]

function TabIcon({ icon, active }: { icon: Tab['icon']; active: boolean }) {
  const tone = active ? 'border-red bg-red' : 'border-sheet'
  if (icon === 'wall')
    return <span className={`mx-auto block h-[13px] w-[18px] border-rule ${tone}`} />
  // The one permitted radius: this icon IS a lamp.
  if (icon === 'game')
    return <span className={`mx-auto block h-[15px] w-[15px] rounded-full border-rule ${tone}`} />
  if (icon === 'file')
    return (
      <span className={`mx-auto block h-[15px] w-[15px] rotate-45 border-rule ${tone}`} />
    )
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
