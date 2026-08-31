import { t, type MessageKey } from '@/lib/i18n'

/**
 * הסרגל התחתון — present on every screen: bg-ink, a 3px red rule on top,
 * four tabs. Icons are drawn from the system itself, never from an icon library.
 */

type Tab = { key: MessageKey; icon: 'wall' | 'game' | 'tower' | 'file' }

const TABS: Tab[] = [
  { key: 'tab.wall', icon: 'wall' },
  { key: 'tab.game', icon: 'game' },
  { key: 'tab.tower', icon: 'tower' },
  { key: 'tab.file', icon: 'file' },
]

function TabIcon({ icon }: { icon: Tab['icon'] }) {
  if (icon === 'wall') return <span className="mx-auto block h-[11px] w-[15px] border-rule border-sheet" />
  // The one permitted radius: this icon IS a lamp.
  if (icon === 'game')
    return <span className="mx-auto block h-[13px] w-[13px] rounded-full border-rule border-sheet" />
  if (icon === 'file')
    return <span className="mx-auto block h-[13px] w-[13px] rotate-45 border-rule border-sheet" />
  return (
    <span className="flex h-[13px] items-end justify-center gap-[2px]">
      <i className="block h-[7px] w-[3px] bg-sheet" />
      <i className="block h-[11px] w-[3px] bg-sheet" />
      <i className="block h-[9px] w-[3px] bg-sheet" />
    </span>
  )
}

export function TabBar() {
  return (
    <nav
      aria-label={t('tab.aria')}
      className="grid grid-cols-4 border-t-plate border-red bg-ink"
    >
      {TABS.map((tab) => (
        <span key={tab.key} className="flex min-h-tap flex-col justify-center px-0 py-2.5 text-center text-sheet">
          <TabIcon icon={tab.icon} />
          <span className="mt-1.5 font-body text-[9px] font-extrabold leading-none">{t(tab.key)}</span>
        </span>
      ))}
    </nav>
  )
}
