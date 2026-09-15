'use client'

import { useState, useTransition } from 'react'

import { Num } from '@/components/ui/Num'
import { t } from '@/lib/i18n'
import type { CardVerdict, FileCard, PairCard, PairVerdict } from '@/lib/game/blackfile'
import { submitCard, submitPair } from './actions'

/**
 * התיק השחור — the away end's game.
 *
 * Two halves, both fast:
 *   1. **מי חצה את הכביש** — a name, and one binary: did he sign for Maccabi Tel Aviv
 *      or not. The whole point is the two cards where the crowd is wrong.
 *   2. **מה קרה קודם** — two dated events from the club's hardest decade, pick the
 *      earlier one.
 *
 * Navy only. No vermilion anywhere on this screen — the gate 11 rule holds inside the
 * gate, not just on its plate.
 */
export function BlackFile({
  cards,
  pairs,
  total,
  fileSize,
}: {
  cards: FileCard[]
  pairs: PairCard[]
  seed: number
  total: number
  fileSize: number
}) {
  const [index, setIndex] = useState(0)
  const [hits, setHits] = useState(0)
  const [cardVerdict, setCardVerdict] = useState<CardVerdict | null>(null)
  const [pairVerdict, setPairVerdict] = useState<PairVerdict | null>(null)
  const [pending, startTransition] = useTransition()

  const step = index
  const inCards = step < cards.length
  const card = cards[step]
  const pair = pairs[step - cards.length]
  const done = !inCards && !pair
  const answered = cardVerdict !== null || pairVerdict !== null

  function answerCard(value: 'crossed' | 'did_not') {
    if (answered || !card) return
    startTransition(async () => setCardVerdict(await submitCard(card.slug, value)))
  }

  function answerPair(slug: string) {
    if (answered || !pair) return
    startTransition(async () => setPairVerdict(await submitPair(pair.id, slug)))
  }

  function next() {
    if (cardVerdict?.correct || pairVerdict?.correct) setHits((h) => h + 1)
    setCardVerdict(null)
    setPairVerdict(null)
    setIndex((i) => i + 1)
  }

  const asked = Math.min(step, total)

  return (
    <div className="mt-stack">
      {/* the away end's own header — navy, cold, nothing of ours in it */}
      <div className="flex items-end justify-between border-b-rule border-sign pb-2">
        <div>
          <p className="font-latin text-[9px] font-bold tracking-[0.2em] text-sign" dir="ltr">
            GATE · AWAY END
          </p>
          <p className="font-display text-step-1 leading-tight text-ink">{t('derby.file')}</p>
        </div>
        <div className="text-end">
          <p className="font-poster text-[34px] leading-none text-sign">
            <Num>{hits}</Num>
          </p>
          <p className="font-body text-[10px] tracking-widest text-muted">
            <Num>{asked}</Num> {t('derby.of')} <Num>{total}</Num>
          </p>
        </div>
      </div>

      {done ? (
        <Done hits={hits} total={total} fileSize={fileSize} />
      ) : inCards && card ? (
        <>
          <p className="mt-stack font-body text-[11px] tracking-widest text-muted">
            {t('derby.crossQ')}
          </p>
          <div className="mt-2 border-rule border-sign bg-sign/[.06] p-5 text-center">
            <p className="font-display text-step-3 leading-tight text-ink">{card.subjectHe}</p>
          </div>

          {!answered ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => answerCard('crossed')}
                className="min-h-tap border-rule border-sign bg-sign px-3 font-body text-step-0 font-extrabold text-paper transition-transform duration-press ease-stamp active:scale-[.96] disabled:opacity-50 motion-reduce:transition-none"
              >
                {t('derby.crossed')}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => answerCard('did_not')}
                className="min-h-tap border-rule border-sign px-3 font-body text-step-0 font-extrabold text-sign transition-transform duration-press ease-stamp active:scale-[.96] disabled:opacity-50 motion-reduce:transition-none"
              >
                {t('derby.didNot')}
              </button>
            </div>
          ) : (
            cardVerdict && <Reveal verdict={cardVerdict} onNext={next} />
          )}
        </>
      ) : pair ? (
        <>
          <p className="mt-stack font-body text-[11px] tracking-widest text-muted">
            {t('derby.firstQ')}
          </p>
          <div className="mt-2 grid gap-2">
            {[
              { slug: pair.aSlug, title: pair.aTitleHe },
              { slug: pair.bSlug, title: pair.bTitleHe },
            ].map((side) => (
              <button
                key={side.slug}
                type="button"
                disabled={pending || answered}
                onClick={() => answerPair(side.slug)}
                className={`min-h-tap w-full border-rule px-4 py-3 text-start font-display text-step-1 leading-tight transition-transform duration-press ease-stamp active:scale-[.98] motion-reduce:transition-none ${
                  pairVerdict && pairVerdict.firstSlug === side.slug
                    ? 'border-sign bg-sign text-paper'
                    : 'border-sign text-ink'
                }`}
              >
                {side.title}
              </button>
            ))}
          </div>
          {pairVerdict && (
            <div className="mt-3 border-rule border-sign bg-sign/[.06] p-3">
              <p className="font-body text-step-0 font-extrabold text-ink">
                {pairVerdict.correct ? t('derby.right') : t('derby.wrong')}
              </p>
              <p className="mt-1 font-mono text-[11px] tabular-nums text-muted">
                <bdi dir="ltr">{pairVerdict.aDate}</bdi> · <bdi dir="ltr">{pairVerdict.bDate}</bdi>
              </p>
              <button
                type="button"
                onClick={next}
                className="mt-3 flex min-h-tap w-full items-center justify-center bg-ink px-4 font-body text-step-0 font-extrabold text-paper"
              >
                {t('derby.next')}
              </button>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}

/** The reveal is the game. Being wrong here should teach you something true. */
function Reveal({ verdict, onNext }: { verdict: CardVerdict; onNext: () => void }) {
  return (
    <div className="mt-3 border-rule border-sign bg-sign/[.06] p-4">
      <p className="font-body text-step-0 font-extrabold text-ink">
        {verdict.correct ? t('derby.right') : t('derby.wrong')}
      </p>
      <p className="mt-2 font-display text-step-1 leading-tight text-ink">{verdict.titleHe}</p>
      <p className="mt-1 font-body text-step--1 leading-relaxed text-muted">{verdict.bodyHe}</p>

      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
        {verdict.toClubHe && (
          <div>
            <dt className="font-body text-[10px] tracking-widest text-muted">{t('derby.to')}</dt>
            <dd className="font-display text-step-0 text-ink">{verdict.toClubHe}</dd>
          </div>
        )}
        {verdict.feeEur !== null && (
          <div>
            <dt className="font-body text-[10px] tracking-widest text-muted">{t('derby.fee')}</dt>
            <dd className="font-poster text-[22px] leading-none text-sign">
              <Num>{`€${verdict.feeEur.toLocaleString('en-US')}`}</Num>
            </dd>
          </div>
        )}
        {verdict.happenedOn && (
          <div>
            <dt className="font-body text-[10px] tracking-widest text-muted">{t('derby.when')}</dt>
            <dd className="font-mono text-step-0 tabular-nums text-ink">
              <bdi dir="ltr">{verdict.happenedOn}</bdi>
            </dd>
          </div>
        )}
      </dl>

      <button
        type="button"
        onClick={onNext}
        className="mt-4 flex min-h-tap w-full items-center justify-center bg-ink px-4 font-body text-step-0 font-extrabold text-paper transition-transform duration-press ease-stamp active:scale-[.97] motion-reduce:transition-none"
      >
        {t('derby.next')}
      </button>
    </div>
  )
}

function Done({ hits, total, fileSize }: { hits: number; total: number; fileSize: number }) {
  return (
    <div className="mt-stack border-rule border-sign bg-sign/[.06] p-5 text-center">
      <p className="font-poster text-[74px] leading-none text-sign">
        <Num>{hits}</Num>
      </p>
      <p className="font-body text-step-0 text-muted">
        {t('derby.of')} <Num>{total}</Num>
      </p>
      <p className="mt-3 font-body text-step--1 leading-relaxed text-muted">
        {t('derby.fileNote', { count: String(fileSize) })}
      </p>
      <a
        href="/derby/file?seed=12"
        className="mt-4 flex min-h-tap w-full items-center justify-center bg-ink px-4 font-body text-step-0 font-extrabold text-paper"
      >
        {t('derby.again')}
      </a>
    </div>
  )
}
