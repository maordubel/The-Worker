'use client'

import { useEffect, useMemo, useState } from 'react'

import { KitPlate } from '@/components/kit/KitPlate'
import { Num } from '@/components/ui/Num'
import { activeCollection, kitKey, type Collection } from '@/lib/kit/collection'
import type { CatalogKit, Facet } from '@/lib/kit/catalog'
import { t, type MessageKey } from '@/lib/i18n'

/**
 * שער 5 — אגף המדים.
 *
 * Three views of the same 33 shirts, and the tab is the only navigation because they are
 * three depths of one thing rather than three features:
 *
 *   · **האוסף** — the grid. What you have built and what you have not.
 *   · **כרטיס חולצה** — one shirt, close up, with its source. Reached by tapping a card,
 *     not by a tab, because a card is always *about* something you picked.
 *   · **מעצב** — free design, unchanged.
 *
 * The screen this replaces opened on a "rack" of drawn figures and then a designer, with
 * no relationship between them and nothing that remembered anything. The collection is
 * what makes gate 4 worth playing twice: a shirt you assembled is a shirt you keep, and
 * a locked card is not a tease — it is a shirt of the club's you cannot yet build from
 * memory, which is the whole subject of the mode.
 */

const FACETS: { id: Facet; key: MessageKey }[] = [
  { id: 'all', key: 'kits.facet.all' },
  { id: 'home', key: 'kits.facet.home' },
  { id: 'away', key: 'kits.facet.away' },
  { id: 'third', key: 'kits.facet.third' },
]

export function KitWing({
  catalog,
  counts,
  designer,
}: {
  catalog: CatalogKit[]
  counts: Record<Facet, number>
  /** the free designer, rendered by the server and passed through as a slot */
  designer: React.ReactNode
}) {
  const store = useMemo(() => activeCollection(), [])
  const [built, setBuilt] = useState<Collection>({})
  const [tab, setTab] = useState<'collection' | 'designer'>('collection')
  const [facet, setFacet] = useState<Facet>('all')
  const [lockedOnly, setLockedOnly] = useState(false)
  const [openKey, setOpenKey] = useState<string | null>(null)

  // Read after mount, never during render: the server has no browser storage.
  useEffect(() => {
    let live = true
    void store.read().then((rows) => {
      if (live) setBuilt(rows)
    })
    return () => {
      live = false
    }
  }, [store])

  const owned = Object.keys(built).length
  const shown = catalog
    .filter((kit) => facet === 'all' || kit.variant === facet)
    .filter((kit) => !lockedOnly || !built[kit.key])

  const open = openKey ? catalog.find((kit) => kit.key === openKey) : null
  const openBuilt = open ? built[open.key] : undefined
  if (open && openBuilt) {
    return <KitCard kit={open} built={openBuilt} onBack={() => setOpenKey(null)} />
  }
  if (open) return <LockedCard kit={open} onBack={() => setOpenKey(null)} />

  return (
    <div className="mt-stack">
      <div className="flex">
        {(['collection', 'designer'] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className={`min-h-tap flex-1 border-rule px-4 font-body text-step-0 font-extrabold transition-colors duration-press ease-stamp motion-reduce:transition-none ${
              tab === id ? 'border-ink bg-ink text-paper' : 'border-ink/40 bg-sheet text-ink'
            }`}
          >
            {t(`kits.tab.${id}` as MessageKey)}
          </button>
        ))}
      </div>

      {tab === 'designer' ? (
        <div className="mt-stack">{designer}</div>
      ) : (
        <>
          {/* progress — the one number the wing is about */}
          <div className="mt-stack flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-step-2 leading-none text-ink">
                {t('kits.collection')}
              </p>
              <p className="mt-2 font-body text-step--1 text-muted">
                <Num>
                  {t('kits.progress', { n: String(owned), total: String(catalog.length) })}
                </Num>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="h-2.5 w-24 border-hair border-ink/35 bg-paper sm:w-40">
                <div
                  className="h-full bg-red"
                  style={{ inlineSize: `${Math.round((owned / catalog.length) * 100)}%` }}
                />
              </div>
              <p className="font-poster text-[20px] leading-none text-ink">
                <Num>{`${Math.round((owned / catalog.length) * 100)}%`}</Num>
              </p>
            </div>
          </div>

          {/* the filter rail */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="me-1 font-body text-[10px] tracking-widest text-muted">
              {t('kits.filter')}
            </span>
            {FACETS.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => {
                  setFacet(row.id)
                  setLockedOnly(false)
                }}
                aria-pressed={facet === row.id && !lockedOnly}
                className={`min-h-tap border-hair px-3 font-body text-[12px] font-extrabold ${
                  facet === row.id && !lockedOnly
                    ? 'border-red bg-red text-paper'
                    : 'border-ink/40 bg-sheet text-ink'
                }`}
              >
                {t(row.key)} · <Num>{String(counts[row.id])}</Num>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setLockedOnly((v) => !v)}
              aria-pressed={lockedOnly}
              className={`min-h-tap border-hair px-3 font-body text-[12px] font-extrabold ${
                lockedOnly ? 'border-sign bg-sign text-paper' : 'border-ink/40 bg-sheet text-muted'
              }`}
            >
              {t('kits.facet.locked')} · <Num>{String(catalog.length - owned)}</Num>
            </button>
          </div>

          <ul className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
            {shown.map((kit) => (
              <li key={kit.key}>
                <ShirtCard kit={kit} built={built[kit.key]} onOpen={() => setOpenKey(kit.key)} />
              </li>
            ))}
          </ul>

          {shown.length === 0 && (
            <p className="mt-stack border-rule border-ink bg-sheet p-4 text-center font-body text-step--1 text-muted">
              {t('kits.emptyBody')}
            </p>
          )}
        </>
      )}
    </div>
  )
}

/**
 * One hanger.
 *
 * A shirt you have not built is drawn as an OUTLINE, not as a grey box and not as the
 * shirt at low opacity: showing the answer dimmed would hand over the thing gate 4 asks
 * you to remember. The outline says a shirt exists here and tells you nothing else.
 */
function ShirtCard({
  kit,
  built,
  onOpen,
}: {
  kit: CatalogKit
  built?: { bestParts: number }
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full flex-col border-rule p-2 text-start transition-transform duration-press ease-stamp active:scale-[.98] motion-reduce:transition-none ${
        built ? 'border-ink bg-sheet' : 'border-ink/40 bg-paper'
      }`}
    >
      <span className="block">
        {built ? (
          <KitPlate spec={kit.spec} texture={false} className="block h-auto w-full" />
        ) : (
          <LockedShirt />
        )}
      </span>
      {/* Three across on a phone leaves no room for a season and a status on one line —
          they wrapped into each other. Stacked, and the status carries the colour. */}
      <span className="mt-2 block font-poster text-[17px] leading-none text-ink">
        <Num>{kit.seasonLabel}</Num>
      </span>
      <span
        className={`mt-1 block truncate font-body text-[10px] font-extrabold ${
          built ? 'text-red' : 'text-muted/70'
        }`}
      >
        {built
          ? built.bestParts >= 5
            ? t('kits.built')
            : t('kits.partial', { n: String(built.bestParts) })
          : t('kits.locked')}
      </span>
      {/* The sponsor is one of the five answers gate 4 asks for. It appears on a shirt
          you have assembled and on no other — the grid hid the drawing behind an
          outline and was printing the answer underneath it. */}
      <span className="mt-0.5 block truncate font-body text-[11px] text-muted">
        {t(`kits.facet.${kit.variant}` as MessageKey)}
        {built && kit.sponsorHe ? ` · ${kit.sponsorHe}` : ''}
      </span>
    </button>
  )
}

function LockedShirt() {
  return (
    <svg viewBox="20 30 300 285" className="block h-auto w-full opacity-30" aria-hidden="true">
      <g fill="none" stroke="rgb(var(--ink))" strokeWidth="3" strokeDasharray="7 6">
        <path d="M104 54C84 62 62 92 46 132C54 144 66 152 82 156C88 140 90 126 92 112C94 92 100 74 104 54Z" />
        <path d="M216 54C236 62 258 92 274 132C266 144 254 152 238 156C232 140 230 126 228 112C226 92 220 74 216 54Z" />
        <path d="M136 48C126 49 114 51 104 54C100 74 94 92 92 112C88 150 84 190 86 292C120 300 200 300 234 292C236 190 232 150 228 112C226 92 220 74 216 54C206 51 194 49 184 48C178 68 142 68 136 48Z" />
      </g>
    </svg>
  )
}

/**
 * כרטיס חולצה — one shirt, close up.
 *
 * The three detail crops are the same SVG at three different `viewBox` values. That is
 * the whole reason the renderer takes a viewBox: a crop of the real drawing is honest in
 * a way a second illustration of "the crest area" could never be, and it costs nothing.
 */
function KitCard({
  kit,
  built,
  onBack,
}: {
  kit: CatalogKit
  built: { bestParts: number; times: number; firstBuiltOn: string }
  onBack: () => void
}) {
  const rows: { k: MessageKey; v: string | null }[] = [
    { k: 'kits.spec.season', v: kit.seasonLabel },
    { k: 'kits.spec.variant', v: t(`kits.facet.${kit.variant}` as MessageKey) },
    { k: 'kits.spec.pattern', v: `${kit.baseHe} · ${kit.patternHe}` },
    { k: 'kits.spec.sponsor', v: kit.sponsorHe },
    { k: 'kits.spec.maker', v: kit.makerHe },
    { k: 'kits.spec.crest', v: kit.crestHe },
  ]

  return (
    <div className="mt-stack">
      <button
        type="button"
        onClick={onBack}
        className="min-h-tap font-body text-step--1 font-extrabold text-red underline underline-offset-4"
      >
        ← {t('kits.back')}
      </button>

      <div className="mt-3 bg-red px-4 py-3 text-paper">
        <p className="font-body text-[10px] tracking-widest text-paper/85">{t('kits.card')}</p>
        <p className="mt-1 font-display text-step-2 leading-tight">
          {t(`kits.facet.${kit.variant}` as MessageKey)} · <Num>{kit.seasonLabel}</Num>
        </p>
      </div>

      <div className="border-x-rule border-b-rule border-ink bg-paper p-4">
        <KitPlate
          spec={kit.spec}
          title={kit.seasonLabel}
          className="mx-auto block h-auto w-full max-w-[300px]"
        />
      </div>

      {/* the three crops */}
      <ul className="mt-2 grid grid-cols-3 gap-2">
        {(
          [
            { k: 'kits.detail.body', vb: '80 60 170 200' },
            { k: 'kits.detail.crest', vb: '176 78 58 62' },
            { k: 'kits.detail.sponsor', vb: '92 148 136 58' },
          ] as const
        ).map((crop) => (
          <li key={crop.k} className="border-rule border-ink bg-sheet">
            <KitPlate spec={kit.spec} texture={false} viewBox={crop.vb} className="block h-24 w-full" />
            <p className="border-t-hair border-ink/30 px-2 py-1.5 font-body text-[10.5px] font-bold leading-tight text-ink">
              {t(crop.k)}
            </p>
          </li>
        ))}
      </ul>

      <dl className="mt-stack border-rule border-ink bg-sheet">
        <p className="border-b-hair border-ink/30 px-3 py-2 font-display text-step-0 text-ink">
          {t('kits.spec')}
        </p>
        {rows.map((row) => (
          <div
            key={row.k}
            className="flex items-baseline justify-between gap-3 border-b-hair border-ink/20 px-3 py-2.5"
          >
            <dt className="font-body text-[11px] tracking-widest text-muted">{t(row.k)}</dt>
            <dd
              className={`min-w-0 truncate font-body text-[13px] font-bold ${
                row.v ? 'text-ink' : 'text-muted/70'
              }`}
            >
              {row.v ?? t('kits.spec.none')}
            </dd>
          </div>
        ))}
      </dl>

      {kit.noteHe !== '' && (
        <p className="mt-2 font-body text-step--1 leading-relaxed text-muted">{kit.noteHe}</p>
      )}

      {/* the source. Showing it is the product (rule 16) — a shirt drawn from a
          photograph says which photograph. */}
      {kit.sourceTitle !== '' && (
        <p className="mt-2 font-body text-[11px] leading-snug text-sign">
          {t('kits.source')}: {kit.sourceTitle}
        </p>
      )}

      <div className="mt-stack border-rule border-ink bg-sheet">
        <p className="border-b-hair border-ink/30 px-3 py-2 font-display text-step-0 text-ink">
          {t('kits.mine')}
        </p>
        <div className="grid grid-cols-3 divide-x-hair divide-ink/20" dir="ltr">
          <Stat label={t('kits.mine.parts')} value={`${built.bestParts}/5`} />
          <Stat label={t('kits.mine.times')} value={String(built.times)} />
          <Stat label={t('kits.mine.first')} value={built.firstBuiltOn} />
        </div>
      </div>

      {kit.playable && (
        <a
          href="/kits/build?seed=1"
          className="mt-3 flex min-h-tap items-center justify-center bg-ink px-4 font-body text-step-0 font-extrabold text-paper"
        >
          {t('kits.build')}
        </a>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-3" dir="rtl">
      <p className="font-body text-[10px] tracking-widest text-muted">{label}</p>
      <p className="mt-1.5 font-poster text-[20px] leading-none text-ink">
        <Num>{value}</Num>
      </p>
    </div>
  )
}

/**
 * A locked shirt has no card, and that is the point.
 *
 * The first version drew the full shirt here and listed its sponsor, maker and crest —
 * which is the complete answer sheet to that shirt's puzzle in gate 4. The collection
 * hid it behind an outline in the grid and then handed it over one tap later. A shirt
 * you have not assembled shows its season, its outline and the way in. Nothing else.
 */
function LockedCard({ kit, onBack }: { kit: CatalogKit; onBack: () => void }) {
  return (
    <div className="mt-stack">
      <button
        type="button"
        onClick={onBack}
        className="min-h-tap font-body text-step--1 font-extrabold text-red underline underline-offset-4"
      >
        ← {t('kits.back')}
      </button>

      <div className="mt-3 bg-ink px-4 py-3 text-paper">
        <p className="font-body text-[10px] tracking-widest text-concrete">{t('kits.locked')}</p>
        <p className="mt-1 font-display text-step-2 leading-tight">
          {t(`kits.facet.${kit.variant}` as MessageKey)} · <Num>{kit.seasonLabel}</Num>
        </p>
      </div>

      <div className="border-x-rule border-b-rule border-ink bg-paper p-6">
        <span className="mx-auto block max-w-[240px]">
          <LockedShirt />
        </span>
      </div>

      <p className="mt-3 font-body text-step--1 leading-relaxed text-muted">
        {kit.playable ? t('kits.emptyBody') : t('kits.notPlayable')}
      </p>

      {kit.playable && (
        <a
          href="/kits/build?seed=1"
          className="mt-3 flex min-h-tap items-center justify-center bg-red px-4 font-body text-step-0 font-extrabold text-paper"
        >
          {t('kits.build')}
        </a>
      )}
    </div>
  )
}

/** `2026-09-02` → `02.09.2026` — the form the rest of this app prints dates in. */
function dayMonthYear(iso: string): string {
  const [year, month, day] = iso.split('-')
  return day && month && year ? `${day}.${month}.${year}` : iso
}
