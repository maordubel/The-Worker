'use client'

import { useEffect, useMemo, useState } from 'react'

import { KitMarkArt } from '@/components/kit/KitEngineShirt'
import { KitShirt } from '@/components/kit/KitShirt'
import { Num } from '@/components/ui/Num'
import { SourceNote } from '@/components/ui/SourceNote'
import { activeCollection, type Collection } from '@/lib/kit/collection'
import type { Facet, LockedKit } from '@/lib/kit/catalog'
import { t, type MessageKey } from '@/lib/i18n'

import { kitDnaFor, type UnlockedKit } from './actions'
import { KitDesignerV5 } from './KitDesignerV5'

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
 *
 * **The page does not know what a locked shirt looks like** (21.9.2026). It used to receive the
 * whole catalogue — every sponsor, maker and crest — and hide the locked ones in the grid, which
 * left the answer to every Gate 4 puzzle in the HTML. It now receives a season and a variant per
 * kit; the shirts this device built are drawn from `kitDnaFor`, which answers only for the
 * unlock tokens Gate 4 signed. The studio's DNA rack is the same rows, filtered to the ones whose
 * DNA opened.
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
  archiveCount,
}: {
  catalog: LockedKit[]
  counts: Record<Facet, number>
  /** how many photographs the archive holds — counted on the server, never guessed */
  archiveCount: number
}) {
  const store = useMemo(() => activeCollection(), [])
  const [built, setBuilt] = useState<Collection>({})
  const [unlocked, setUnlocked] = useState<Record<string, UnlockedKit>>({})
  const [tab, setTab] = useState<'collection' | 'designer'>('collection')
  const [facet, setFacet] = useState<Facet>('all')
  const [lockedOnly, setLockedOnly] = useState(false)
  const [openKey, setOpenKey] = useState<string | null>(null)

  // Read after mount, never during render: the server has no browser storage. Then ask the
  // server for the shirts this device can PROVE it built — a token each, or a legacy key once.
  useEffect(() => {
    let live = true
    void store.read().then(async (rows) => {
      if (!live) return
      setBuilt(rows)
      const entries = Object.entries(rows)
      const tokens = entries.flatMap(([, row]) => (row.token ? [row.token] : []))
      const legacy = entries.filter(([, row]) => !row.token).map(([key, row]) => ({ key, dna: row.bestCategories >= 6 }))
      if (tokens.length === 0 && legacy.length === 0) return
      const answer = await kitDnaFor(tokens, legacy)
      if (!live) return
      setUnlocked(Object.fromEntries(answer.rows.map((row) => [row.key, row])))
      if (Object.keys(answer.minted).length > 0) void store.adopt(answer.minted)
    })
    return () => {
      live = false
    }
  }, [store])

  const rack = useMemo(
    () => Object.values(unlocked).filter((row) => row.dna).map((row) => ({ seasonLabel: row.seasonLabel, noteHe: row.noteHe, spec: row.spec })),
    [unlocked],
  )
  const owned = Object.keys(built).length
  const shown = catalog
    .filter((kit) => facet === 'all' || kit.variant === facet)
    .filter((kit) => !lockedOnly || !built[kit.key])

  const open = openKey ? catalog.find((kit) => kit.key === openKey) : null
  const openBuilt = open ? built[open.key] : undefined
  const openRow = open ? unlocked[open.key] : undefined
  if (open && openBuilt && openRow) {
    return <KitCard kit={open} row={openRow} built={openBuilt} onBack={() => setOpenKey(null)} />
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
        <div className="mt-stack"><KitDesignerV5 rack={rack} /></div>
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

          {/* The way out to the photographs.
              A drawn shirt and a photograph of that shirt are two different claims, and
              the collection is about the first. Rather than mixing 168 photographs into
              a grid whose whole point is what you can rebuild from memory, the archive
              gets its own door — and the door says what is behind it. */}
          <a
            href="/kits/archive"
            className="mt-3 flex items-center justify-between gap-3 border-rule border-ink bg-ink px-4 py-3 text-paper"
          >
            <span className="min-w-0">
              <span className="block font-display text-step-0 leading-tight">
                <Num>{t('kits.archive.enter', { n: String(archiveCount) })}</Num>
              </span>
              <span className="mt-1 block font-body text-[11.5px] leading-snug text-concrete">
                {t('kits.archive.enterBody')}
              </span>
            </span>
            <span aria-hidden="true" className="shrink-0 font-poster text-[22px] leading-none text-red">
              ←
            </span>
          </a>

          <ul className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
            {shown.map((kit) => (
              <li key={kit.key}>
                <ShirtCard kit={kit} built={built[kit.key]} row={unlocked[kit.key]} onOpen={() => setOpenKey(kit.key)} />
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
  row,
  onOpen,
}: {
  kit: LockedKit
  built?: { bestParts: number }
  row?: UnlockedKit
  onOpen: () => void
}) {
  const drawn = Boolean(built && row)
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full flex-col border-rule p-2 text-start transition-transform duration-press ease-stamp active:scale-[.98] motion-reduce:transition-none ${
        drawn ? 'border-ink bg-sheet' : 'border-ink/40 bg-paper'
      }`}
    >
      <span className="block aspect-[6/7] w-full">
        {built && row ? (
          <KitShirt spec={row.spec} look={row.look} marks="granted" className="block h-full w-full" />
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
        className={`mt-1 block truncate font-body text-[11px] font-extrabold ${
          built ? 'text-red' : 'text-muted'
        }`}
      >
        {built
          ? built.bestParts >= 5
            ? t('kits.built')
            : t('kits.partial', { n: String(built.bestParts) })
          : t('kits.locked')}
      </span>
      {/* The sponsor is one of the five answers gate 4 asks for. It appears on a shirt
          you have assembled and on no other — and this page cannot print it for any other,
          because it was never sent one (`built && row.sponsorHe`). */}
      <span className="mt-0.5 block truncate font-body text-[11px] text-muted">
        {t(`kits.facet.${kit.variant}` as MessageKey)}
        {built && row?.sponsorHe ? ` · ${row.sponsorHe}` : ''}
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
 * The shirt in the look its template supports (the photographed garment where there is one),
 * and three details from the same engine: the shoulders and collar, the crest as printed, and
 * the front as it read on the cloth.
 */
function KitCard({
  kit,
  row,
  built,
  onBack,
}: {
  kit: LockedKit
  row: UnlockedKit
  built: { bestParts: number; times: number; firstBuiltOn: string }
  onBack: () => void
}) {
  const rows: { k: MessageKey; v: string | null }[] = [
    { k: 'kits.spec.season', v: kit.seasonLabel },
    { k: 'kits.spec.variant', v: t(`kits.facet.${kit.variant}` as MessageKey) },
    { k: 'kits.spec.pattern', v: `${row.baseHe} · ${row.patternHe}` },
    { k: 'kits.spec.sponsor', v: row.sponsorHe },
    { k: 'kits.spec.maker', v: row.makerHe },
    { k: 'kits.spec.crest', v: row.crestHe },
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
        <p className="font-body text-[11px] tracking-widest text-paper/85">{t('kits.card')}</p>
        <p className="mt-1 font-display text-step-2 leading-tight">
          {t(`kits.facet.${kit.variant}` as MessageKey)} · <Num>{kit.seasonLabel}</Num>
        </p>
      </div>

      <div className="border-x-rule border-b-rule border-ink bg-paper p-4">
        <span className="mx-auto block aspect-[4/5] w-full max-w-[320px]">
          <KitShirt spec={row.spec} look={row.look} marks="granted" title={kit.seasonLabel} className="block h-full w-full" />
        </span>
      </div>

      <ul className="mt-2 grid grid-cols-3 gap-2">
        <li className="border-rule border-ink bg-sheet">
          <span className="block h-24 p-1"><KitShirt spec={row.spec} look={row.look} marks="granted" crop="top" className="block h-full w-full" /></span>
          <p className="border-t-hair border-ink/30 px-2 py-1.5 font-body text-[11px] font-bold leading-tight text-ink">{t('kits.detail.body')}</p>
        </li>
        <li className="border-rule border-ink bg-sheet">
          <span className="flex h-24 items-center justify-center p-2"><KitMarkArt spec={row.spec} which="crest" className="h-full w-full" /></span>
          <p className="border-t-hair border-ink/30 px-2 py-1.5 font-body text-[11px] font-bold leading-tight text-ink">{t('kits.detail.crest')}</p>
        </li>
        <li className="border-rule border-ink bg-sheet">
          <span className="flex h-24 items-center justify-center p-2"><KitMarkArt spec={row.spec} which="sponsor" className="h-full w-full" /></span>
          <p className="border-t-hair border-ink/30 px-2 py-1.5 font-body text-[11px] font-bold leading-tight text-ink">{t('kits.detail.sponsor')}</p>
        </li>
      </ul>

      <dl className="mt-stack border-rule border-ink bg-sheet">
        <p className="border-b-hair border-ink/30 px-3 py-2 font-display text-step-0 text-ink">
          {t('kits.spec')}
        </p>
        {rows.map((line) => (
          <div
            key={line.k}
            className="flex items-baseline justify-between gap-3 border-b-hair border-ink/20 px-3 py-2.5"
          >
            <dt className="font-body text-[11px] tracking-widest text-muted">{t(line.k)}</dt>
            <dd
              className={`min-w-0 truncate font-body text-[13px] font-bold ${
                line.v ? 'text-ink' : 'text-muted/70'
              }`}
            >
              {line.v ?? t('kits.spec.none')}
            </dd>
          </div>
        ))}
      </dl>

      {row.noteHe !== '' && (
        <p className="mt-2 font-body text-step--1 leading-relaxed text-muted">{row.noteHe}</p>
      )}

      {/* a shirt drawn from a photograph still says it has one (rule 16) — which one is
          on /credits, the only page that prints sources (spec §0.3, 22.9.2026) */}
      {row.sourceTitle !== '' && <SourceNote className="mt-2" />}

      <div className="mt-stack border-rule border-ink bg-sheet">
        <p className="border-b-hair border-ink/30 px-3 py-2 font-display text-step-0 text-ink">
          {t('kits.mine')}
        </p>
        <div className="grid grid-cols-3 divide-x-hair divide-ink/20" dir="ltr">
          <Stat label={t('kits.mine.parts')} value={`${built.bestParts}/5`} />
          <Stat label={t('kits.mine.times')} value={String(built.times)} />
          <Stat label={t('kits.mine.first')} value={dayMonthYear(built.firstBuiltOn)} />
        </div>
      </div>

      {kit.playable && (
        <a
          href="/kits/build"
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
function LockedCard({ kit, onBack }: { kit: LockedKit; onBack: () => void }) {
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
          href="/kits/build"
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
