'use client'

import { t } from '@/lib/i18n'

/**
 * התפריט — one sheet, opened by ☰, and the world stops underneath it.
 *
 * Until this pass the game's two housekeeping controls — autosave notice and "start
 * again" — lived on a strip UNDER the glass. When the glass became the whole screen
 * (`100dvh`, full-bleed) that strip was pushed below the fold of an `overflow-hidden`
 * box: still in the DOM, reachable by nobody. A control you cannot reach is not a
 * control. So they moved in here, with the two things a phone player actually asks for
 * in the first minute — "where is my profile" and "how do I hide the stick".
 *
 * Restart-day cuts the log back to the last `chapter.entered` (`LifeEngine.restartDay`)
 * and reloads. Restart-mission is in the brief (§51) and is NOT here: the 1986 day has no
 * mission markers in its log yet, and a menu entry that lies about what it can do is
 * worse than one that is missing.
 */
export function LifeMenu({
  touch,
  deck,
  persisted,
  debug,
  onClose,
  onProfile,
  onDeck,
  onDebug,
  onReset,
  confirmReset,
  onRestartDay,
  confirmDay,
  onMap,
}: {
  touch: boolean
  deck: boolean
  persisted: boolean
  /** the developer panel is offered only outside production — a build fact, not a flag */
  debug: boolean
  onClose: () => void
  onProfile: () => void
  onDeck: (on: boolean) => void
  onDebug: () => void
  onReset: () => void
  confirmReset: boolean
  /** cut the log back to the top of the chapter — asks first, like reset */
  onRestartDay: () => void
  confirmDay: boolean
  onMap: () => void
}) {
  const row =
    'flex min-h-tap w-full items-center justify-between gap-3 border-b-hair border-ink/30 px-3 text-start font-body text-[14px] text-ink transition-colors duration-press active:bg-red active:text-sheet motion-reduce:transition-none'
  return (
    <div
      className="absolute inset-0 z-40 flex items-end justify-center bg-ink/70 p-2.5 pb-[max(10px,env(safe-area-inset-bottom))] sm:items-center"
      data-life="menu"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] border-rule border-ink bg-sheet"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label={t('life.menu.title')}
      >
        <div className="flex items-center justify-between border-b-hair border-ink bg-ink px-3 py-2">
          <p className="font-display text-[15px] leading-none text-sheet">{t('life.menu.title')}</p>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-tap min-w-tap items-center justify-center font-mono text-[16px] tabular-nums text-sheet"
            aria-label={t('life.menu.continue')}
          >
            ✕
          </button>
        </div>

        <button type="button" className={row} onClick={onClose} data-life="menu-continue">
          <span>{t('life.menu.continue')}</span>
        </button>
        <button type="button" className={row} onClick={onProfile} data-life="menu-profile">
          <span>{t('life.profile')}</span>
        </button>
        <button type="button" className={row} onClick={onMap} data-life="menu-map">
          <span>{t('life.map')}</span>
        </button>
        {touch && (
          <button type="button" className={row} onClick={() => onDeck(!deck)} data-life="menu-deck">
            <span>{t('life.menu.deck')}</span>
            <span className="font-mono text-[11px] tabular-nums" dir="ltr">
              {deck ? t('life.menu.on') : t('life.menu.off')}
            </span>
          </button>
        )}
        {debug && (
          <button type="button" className={`${row} text-red`} onClick={onDebug}>
            <span>{t('life.debug')}</span>
          </button>
        )}
        <button
          type="button"
          className={`${row} ${confirmDay ? 'bg-red text-sheet' : ''}`}
          onClick={onRestartDay}
          data-life="menu-day"
        >
          <span>{confirmDay ? t('life.menu.dayConfirm') : t('life.menu.day')}</span>
        </button>
        <button
          type="button"
          className={`${row} ${confirmReset ? 'bg-red text-sheet' : ''}`}
          onClick={onReset}
          data-life="menu-reset"
        >
          <span>{confirmReset ? t('life.reset.confirm') : t('life.reset')}</span>
        </button>

        <p className="px-3 py-2 font-body text-[10px] leading-snug text-muted">
          {persisted ? t('life.autosave') : t('life.storageOff')}
        </p>
      </div>
    </div>
  )
}
