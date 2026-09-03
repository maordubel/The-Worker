'use client'

import { useEffect, useState } from 'react'

import { KitShirt } from '@/components/kit/KitShirt'
import { Num } from '@/components/ui/Num'
import { ShareRow } from '@/components/share/ShareRow'
import { DEFAULT_SPEC, type KitSpec } from '@/lib/kit/spec'
import {
  QUARTER_SLOTS,
  approvedCount,
  quarterGrid,
  readBook,
  writeBook,
  type MemberBook as Book,
} from '@/lib/game/member'
import { t } from '@/lib/i18n'

/**
 * שער 10 — פנקס חבר.
 *
 * Straight off the handoff, and the handoff's own rules are the design:
 *
 *   · **לא ניקוד** — no accumulated points anywhere on this page.
 *   · **מספר תיק** — fixed, printed vertically down the black stub.
 *   · **משבצות** — ninety per quarter, stamped for a day of activity, never erased.
 *   · **תיקון = תהילה** — the single largest number on the screen is the number of
 *     corrections the archive accepted from you.
 *   · **בלי רכישה** — nothing here can be bought.
 *
 * The book is read once on mount rather than during render, because `localStorage` does
 * not exist on the server and a component that reaches for it while rendering hydrates
 * with a mismatch. Until it loads, the card prints with its fields empty — which is
 * also exactly what a blank membership card looks like.
 */
export function MemberBook({ shirt }: { shirt: KitSpec }) {
  const [book, setBook] = useState<Book | null>(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    setBook(readBook())
  }, [])

  function save(next: Book) {
    setBook(next)
    writeBook(next)
  }

  const grid = book ? quarterGrid(book) : Array.from({ length: QUARTER_SLOTS }, () => false)
  const punched = grid.filter(Boolean).length
  const approved = book ? approvedCount(book) : 0
  const pending = book ? book.corrections.length - approved : 0

  return (
    <div className="mt-stack">
      {/* the card */}
      <div className="border-rule border-ink bg-sheet">
        <div className="flex items-end justify-between gap-3 bg-red px-4 py-2.5">
          <span className="font-poster text-[30px] leading-[0.85] text-paper">
            {t('tik.card')}
          </span>
          <span className="font-latin text-[9px] font-bold tracking-[0.16em] text-ink" dir="ltr">
            MEMBER BOOK
          </span>
        </div>

        <div className="flex">
          <div className="flex-1 p-4">
            <p className="font-latin text-[8.5px] font-bold tracking-[0.16em] text-muted" dir="ltr">
              NAME
            </p>
            {editing ? (
              <input
                value={book?.nameHe ?? ''}
                onChange={(event) =>
                  book && save({ ...book, nameHe: event.target.value.slice(0, 24) })
                }
                aria-label={t('tik.name')}
                className="mt-1 w-full border-b-hair border-ink bg-transparent font-body text-step-1 font-extrabold text-ink outline-none"
              />
            ) : (
              <p className="mt-1 font-body text-step-1 font-extrabold text-ink">
                {book?.nameHe || t('tik.noName')}
              </p>
            )}

            <p
              className="mt-3 font-latin text-[8.5px] font-bold tracking-[0.16em] text-muted"
              dir="ltr"
            >
              MEMBER SINCE
            </p>
            <p className="font-latin text-[17px] font-extrabold text-ink" dir="ltr">
              {book?.since ?? '—'}
            </p>
          </div>

          {/* the stub, torn along a perforation */}
          <div className="flex w-[86px] items-center justify-center border-s-hair border-dashed border-ink bg-ink">
            <span
              className="font-latin text-[19px] font-extrabold text-paper"
              dir="ltr"
              style={{ writingMode: 'vertical-rl' }}
            >
              {book?.tik ?? 'TIK-————'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t-hair border-ink px-4 py-2">
          <span className="font-latin text-[8.5px] font-bold text-muted" dir="ltr">
            TEAR ALONG PERFORATION
          </span>
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="min-h-tap px-2 font-body text-[11px] font-extrabold text-red"
          >
            {editing ? t('tik.done') : t('tik.edit')}
          </button>
        </div>
      </div>

      {/* the punches */}
      <section className="mt-3 border-rule border-ink bg-sheet p-4">
        <div className="flex items-baseline justify-between border-b-hair border-ink pb-1.5">
          <h2 className="font-display text-step-1 text-ink">{t('tik.punches')}</h2>
          <span className="font-latin text-[9px] font-bold tracking-[0.12em] text-red" dir="ltr">
            {punched} / {QUARTER_SLOTS} DAYS
          </span>
        </div>
        <ol className="mt-2.5 grid grid-cols-[repeat(15,1fr)] gap-[3px]" aria-hidden="true">
          {grid.map((on, index) => (
            <li
              key={index}
              className={`aspect-square border-hair border-ink ${on ? 'bg-red' : 'bg-transparent'}`}
            />
          ))}
        </ol>
        <p className="mt-2 font-body text-[11px] leading-relaxed text-muted">{t('tik.punchNote')}</p>
      </section>

      {/* the one big number */}
      <section className="mt-3 border-rule border-ink bg-ink p-5">
        <p className="font-body text-[10px] tracking-widest text-red">{t('tik.fixes')}</p>
        <div className="mt-1 flex items-end gap-3">
          <p className="font-poster text-[74px] leading-none text-paper">
            <Num>{approved}</Num>
          </p>
          {pending > 0 && (
            <p className="pb-3 font-body text-step--1 text-concrete">
              {t('tik.pending', { n: String(pending) })}
            </p>
          )}
        </div>
        <p className="mt-1 font-body text-step--1 leading-relaxed text-concrete">
          {t('tik.fixesNote')}
        </p>

        {book && book.corrections.length > 0 && (
          <ol className="mt-3 border-t-hair border-concrete/30">
            {book.corrections.slice(0, 6).map((row) => (
              <li key={row.id} className="border-b-hair border-concrete/20 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-latin text-[9px] font-bold tracking-[0.14em] text-red" dir="ltr">
                    {row.tagHe}
                  </span>
                  <span className="font-mono text-[10px] tabular-nums text-concrete">
                    <bdi dir="ltr">{row.filedOn}</bdi>
                  </span>
                </div>
                <p className="mt-0.5 font-body text-step--1 text-paper">{row.bodyHe}</p>
                <p className="font-body text-[10px] text-concrete">
                  {row.status === 'approved' ? t('tik.approved') : t('tik.waiting')}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* your shirt */}
      <section className="mt-3 border-rule border-ink bg-paper p-4">
        <div className="flex items-baseline justify-between border-b-hair border-ink/30 pb-1.5">
          <h2 className="font-display text-step-1 text-ink">{t('tik.shirt')}</h2>
          <div className="flex items-center gap-1.5">
            {[7, 9, 10, 11, 17].map((number) => (
              <button
                key={number}
                type="button"
                onClick={() => book && save({ ...book, number })}
                aria-pressed={book?.number === number}
                className={`min-h-tap w-9 border-hair font-poster text-[18px] ${
                  book?.number === number
                    ? 'border-red bg-red text-paper'
                    : 'border-ink/40 text-ink'
                }`}
              >
                {number}
              </button>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-3 max-w-[190px]">
          <KitShirt
            spec={{ ...shirt, number: book?.number ?? 17, sponsorHe: book?.nameHe || shirt.sponsorHe }}
            className="block w-full"
            title={t('tik.shirt')}
          />
        </div>
      </section>

      <ShareRow
        kind="crest"
        params={{ s: '10', total: String(QUARTER_SLOTS) }}
        headline={String(approved)}
        card={{
          template: 'kit',
          kicker: 'GATE 10 · MEMBER BOOK',
          label: t('screen.tik.title'),
          eyebrow: t('tik.card'),
          hero: book?.tik ?? 'TIK',
          stats: [
            { k: t('tik.punches'), v: `${punched}/${QUARTER_SLOTS}` },
            { k: t('tik.fixes'), v: String(approved) },
          ],
          cta: t('tik.cta'),
          challenge: t('share.sameRound'),
          kit: { ...shirt, number: book?.number ?? 17 },
        }}
      />

      <ul className="mt-3 border-t-rule border-ink">
        {(['noScore', 'tikNumber', 'slots', 'fixIsGlory', 'noBuying'] as const).map((key) => (
          <li key={key} className="border-b-hair border-ink/25 py-2.5">
            <p className="font-body text-step-0 font-extrabold text-ink">{t(`tik.rule.${key}`)}</p>
            <p className="mt-0.5 font-body text-step--1 leading-relaxed text-muted">
              {t(`tik.rule.${key}.d`)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
