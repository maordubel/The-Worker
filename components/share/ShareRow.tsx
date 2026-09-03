'use client'

import { useState } from 'react'

import { challengeUrl, whatsappHref, telegramHref, type ShareKind } from '@/lib/share/copy'
import { renderStory, type StoryCard } from '@/lib/share/story'
import { t, type MessageKey } from '@/lib/i18n'

/**
 * שורת השיתוף — four ways out of the app, in the order they actually get used.
 *
 * 1. **סטורי** — renders the 1080×1920 PNG and hands it to `navigator.share({ files })`,
 *    which on a phone opens the sheet with Instagram Stories and WhatsApp Status in it.
 *    On a desktop, or anywhere the file share is unsupported, it downloads instead, and
 *    the button says so rather than failing silently.
 * 2. **וואטסאפ** — a written Hebrew message plus the challenge link, because the group
 *    chat is where Israeli football actually happens.
 * 3. **טלגרם** — the same, for the channels.
 * 4. **העתק קישור** — the fallback that always works.
 *
 * Every route out carries `?seed=`, so what arrives is not a boast but a dare: the
 * exact same round, playable by whoever opens it.
 */
export function ShareRow({
  kind,
  params,
  headline,
  card,
}: {
  kind: ShareKind
  /** whatever the message template needs, plus `s` for the seed */
  params: Record<string, string>
  /** the value the message leads with */
  headline: string
  /** the story card; omit and the story button is hidden */
  card?: StoryCard
}) {
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<MessageKey | null>(null)
  const seed = params.s ?? '1'
  const vars = { ...params, headline }

  async function story() {
    if (!card || busy) return
    setBusy(true)
    setNote(null)
    try {
      const blob = await renderStory(card)
      if (!blob) throw new Error('no blob')
      const file = new File([blob], 'the-worker.png', { type: 'image/png' })
      const shareable =
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
      if (shareable) {
        await navigator.share({ files: [file], text: challengeUrl(kind, seed) })
      } else {
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = 'the-worker.png'
        anchor.click()
        URL.revokeObjectURL(url)
        setNote('share.downloaded')
      }
    } catch {
      setNote('share.failed')
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(challengeUrl(kind, seed))
      setNote('share.copied')
    } catch {
      setNote('share.failed')
    }
  }

  return (
    <section aria-label={t('share.title')} className="mt-stack border-rule border-ink bg-ink p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-step-1 leading-none text-paper">{t('share.title')}</p>
        <p className="font-latin text-[9px] font-bold tracking-[0.2em] text-red" dir="ltr">
          SPREAD IT
        </p>
      </div>
      {/* The dare describes what the LINK does, so it cannot be one sentence for every
          gate: a gate with a seed hands over the identical round, and the polls wing
          hands over a blank slip. Printing "אותן שאלות, אותו סדר, אותו שעון" under a
          ballot would be describing a round that does not exist. */}
      <p className="mt-1.5 font-body text-[11.5px] leading-relaxed text-concrete">
        {t(kind === 'polls' ? 'share.dare.polls' : 'share.dare')}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {card && (
          <button
            type="button"
            onClick={story}
            disabled={busy}
            className="col-span-2 flex min-h-tap items-center justify-center gap-2 bg-red px-4 font-body text-step-0 font-extrabold text-paper transition-transform duration-press ease-stamp active:scale-[.97] disabled:opacity-60 motion-reduce:transition-none"
          >
            {busy ? (
              t('share.building')
            ) : (
              <>
                {t('share.story')}
                <span className="font-latin text-[9px] tracking-[0.16em] opacity-75" dir="ltr">
                  {t('share.storySize')}
                </span>
              </>
            )}
          </button>
        )}
        <a
          href={whatsappHref(kind, vars, seed)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-tap items-center justify-center border-hair border-concrete/50 px-3 font-body text-step-0 font-extrabold text-paper"
        >
          {t('share.whatsapp')}
        </a>
        <a
          href={telegramHref(kind, vars, seed)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-tap items-center justify-center border-hair border-concrete/50 px-3 font-body text-step-0 font-extrabold text-paper"
        >
          {t('share.telegram')}
        </a>
        <button
          type="button"
          onClick={copy}
          className="col-span-2 flex min-h-tap items-center justify-center border-hair border-concrete/50 px-3 font-body text-step--1 text-concrete"
        >
          {t('share.copy')}
        </button>
      </div>

      {note && (
        <p aria-live="polite" className="mt-2 font-body text-[11px] text-red">
          {t(note)}
        </p>
      )}
    </section>
  )
}
