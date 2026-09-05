'use client'

import { useState } from 'react'

import { Cloth, SheetHead } from '@/components/life/Plate'
import { t } from '@/lib/i18n'
import { HELP_DISCLAIMER_HE, HELP_RULES_HE, HELP_STORY_HE } from '@/lib/life/help'

/**
 * "מה עליי לעשות?" — the sheet behind the question mark.
 *
 * Two things, in this order: the answer (the day's shape on the red cloth, then one plain
 * sentence that says where to be), and — folded, under a tab — the story, the rules and
 * the disclaimer. The answer is the point; the rest is there for the person who wants
 * to know what kind of thing this is before they trust it with an evening.
 */
export function HelpSheet({
  objective,
  hint,
  onClose,
}: {
  objective: string | null
  hint: string
  onClose: () => void
}) {
  const [more, setMore] = useState(false)
  return (
    <div
      className="absolute inset-0 z-40 flex items-end justify-center bg-ink/70 p-2.5 pb-[max(10px,env(safe-area-inset-bottom))] sm:items-center"
      data-life="help"
      onClick={onClose}
    >
      <div
        className="flex max-h-full w-full max-w-[420px] animate-sheet-in flex-col border-rule border-ink bg-sheet"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-label={t('life.help.title')}
      >
        <SheetHead title={t('life.help.title')} onClose={onClose} closeLabel={t('life.help.close')} />

        <div className="overflow-y-auto">
          <div className="px-3 pt-3" data-life="help-now">
            {objective && (
              <Cloth className="max-w-full">
                <span>
                  <bdi>{objective}</bdi>
                </span>
              </Cloth>
            )}
            <p className="mt-3 font-body text-[15px] leading-snug text-ink" data-life="help-hint">
              <bdi>{hint}</bdi>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setMore((v) => !v)}
            className="mt-3 flex w-full min-h-tap items-center justify-between border-y-rule border-ink bg-paper px-3 text-start"
            aria-expanded={more}
            data-life="help-more"
          >
            <span className="font-sign text-[14px] leading-none text-ink">{t('life.help.more')}</span>
            <span className="font-mono tabular-nums text-[14px] leading-none text-ink" aria-hidden="true">
              {more ? '−' : '+'}
            </span>
          </button>

          {more && (
            <div className="px-3 pb-3" data-life="help-story">
              <p className="mt-3 border-b-hair border-ink pb-1 font-display text-[11px] uppercase tracking-[0.18em] text-red">{t('life.help.story')}</p>
              {HELP_STORY_HE.map((para) => (
                <p key={para.slice(0, 16)} className="mt-2 font-body text-[13px] leading-relaxed text-ink">
                  <bdi>{para}</bdi>
                </p>
              ))}
              <p className="mt-4 border-b-hair border-ink pb-1 font-display text-[11px] uppercase tracking-[0.18em] text-red">{t('life.help.rules')}</p>
              <ol className="mt-1 list-none">
                {HELP_RULES_HE.map((rule, index) => (
                  <li key={rule.slice(0, 16)} className="flex gap-2 py-1.5 font-body text-[13px] leading-snug text-ink">
                    <span className="shrink-0 font-poster text-[15px] leading-none text-red" dir="ltr">
                      {index + 1}
                    </span>
                    <bdi>{rule}</bdi>
                  </li>
                ))}
              </ol>
              <p className="mt-4 border-b-hair border-ink pb-1 font-display text-[11px] uppercase tracking-[0.18em] text-red">{t('life.help.disclaimer')}</p>
              <p className="mt-2 font-body text-[12px] leading-relaxed text-muted">
                <bdi>{HELP_DISCLAIMER_HE}</bdi>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
