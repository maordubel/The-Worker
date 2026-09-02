'use client'

import { useMemo, useState } from 'react'

import { KitPlate } from '@/components/kit/KitPlate'
import { ShareRow } from '@/components/share/ShareRow'
import { Num } from '@/components/ui/Num'
import { artFor } from '@/lib/share/story'
import type { KitPart, KitPuzzle, KitVerdict, PartKind } from '@/lib/game/kitBuild'
import { KIT_ROUND, PART_ORDER, PART_POINTS } from '@/lib/game/kit-build-run'
import { activeCollection } from '@/lib/kit/collection'
import type { KitSpec } from '@/lib/kit/spec'
import { t, type MessageKey } from '@/lib/i18n'

import { submitKit } from './actions'

/**
 * משחק המדים — the assembly table.
 *
 * Built to `Kit Game.dc.html`, with one structural departure the mockup could not make
 * for itself: the mockup is a 1320px desktop board with a 320px drawer, the shirt, and a
 * 330px checklist side by side. On a 390px phone those three columns cannot coexist, and
 * scaling the board down produces a shirt the size of a postage stamp with drop zones
 * too small for a thumb. So the phone gets a genuinely different arrangement of the SAME
 * parts — shirt on top where it is biggest, drawer under it, checklist folded into the
 * drawer's own state marks — and the three-column board returns at `lg`. Rule 9 and the
 * responsive standard both ask for two layouts rather than one layout scaled.
 *
 * **Tap is the primary interaction and drag is the enhancement.** The mockup says
 * "גרור כל חלק למקומו על החולצה, או בחר חלק והקש על האזור", and on a phone the second
 * half is the whole thing: HTML drag-and-drop does not exist on touch. Selecting a part
 * arms it, and because a part can only belong to one slot, the tap that follows does not
 * even need to hit a target — it places itself. The zones stay, drawn and labelled, so
 * the shirt still reads as a thing with places on it.
 */

type Placed = Partial<Record<PartKind, KitPart>>

export function KitGameRun({ puzzles, seed }: { puzzles: KitPuzzle[]; seed: number }) {
  const [index, setIndex] = useState(0)
  const [placed, setPlaced] = useState<Placed>({})
  const [verdict, setVerdict] = useState<KitVerdict | null>(null)
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState<KitVerdict[]>([])
  const collection = useMemo(() => activeCollection(), [])
  /**
   * The round ends when the last reveal is DISMISSED, not when it is graded.
   *
   * Deriving `done` from `log.length` looked equivalent and cost the player the most
   * important reveal in the round: grading the fifth shirt filled the log, the component
   * re-rendered straight into the summary, and the panel that says whether the last
   * shirt was right never appeared at all. Found by playing five shirts through rather
   * than one.
   */
  const [finished, setFinished] = useState(false)

  const puzzle = puzzles[index] as KitPuzzle
  const done = finished

  /** The shirt as it currently stands: the blank, plus every part placed on it. */
  const shirt = useMemo<KitSpec>(() => {
    let spec = { ...puzzle.blank }
    for (const kind of PART_ORDER) {
      const part = placed[kind]
      if (part) spec = { ...spec, ...part.patch }
    }
    return spec
  }, [puzzle, placed])

  const missing = PART_ORDER.filter((kind) => !placed[kind])
  const ready = missing.length === 0

  function place(part: KitPart) {
    setPlaced((current) => ({ ...current, [part.kind]: part }))
  }

  /**
   * A tap on a part PLACES it. There is no arm-then-drop step.
   *
   * The mockup says "גרור כל חלק למקומו על החולצה, או בחר חלק והקש על האזור", and I
   * built the second half literally first: tap the card to arm, tap the shirt to drop.
   * Playing it once shows why that is wrong — a part has exactly one home, so the second
   * tap carries no decision. It is a dexterity step charged for nothing, and on a phone
   * it doubles the taps in the game. One tap, and the shirt changes under your thumb
   * (rule 21: nothing between the decision and its consequence).
   *
   * The zones stay, because they are what makes the shirt read as a thing with places
   * on it — and tapping a filled one takes that part back off.
   */
  function tapZone(kind: PartKind) {
    setPlaced((current) => {
      const next = { ...current }
      delete next[kind]
      return next
    })
  }

  async function check() {
    if (!ready || busy) return
    setBusy(true)
    const answer = await submitKit(
      seed,
      index,
      Object.fromEntries(PART_ORDER.map((kind) => [kind, placed[kind]?.id])) as Partial<
        Record<PartKind, string>
      >,
    )
    setBusy(false)
    if (!answer) return
    setVerdict(answer)
    setLog((current) => [...current, answer])
    // The shirt enters the collection at ANY score. A shirt you got four parts of is a
    // shirt you have handled, and gate 5's job is to remember what you went through
    // rather than to certify what you got right — `bestParts` keeps the distinction.
    void collection.record({
      seasonLabel: puzzle.seasonLabel,
      variant: puzzle.variant,
      parts: answer.right,
    })
  }

  function next() {
    if (index + 1 >= puzzles.length) return setFinished(true)
    setVerdict(null)
    setPlaced({})
    setIndex((current) => current + 1)
  }

  const score = log.reduce((total, row) => total + row.score, 0)
  const rightSoFar = log.reduce((total, row) => total + row.right, 0)

  if (done) return <RoundSummary log={log} seed={seed} score={score} right={rightSoFar} />

  return (
    <div className="mt-stack">
      {/* the HUD — score, parts, which shirt of the round */}
      <div className="flex items-stretch border-rule border-ink bg-sheet">
        <Cell label={t('run.score')} value={String(score)} />
        <Cell
          label={t('kitgame.parts')}
          value={`${PART_ORDER.length - missing.length}/${PART_ORDER.length}`}
          red
        />
        <Cell label={t('kitgame.task')} value={`${index + 1}/${puzzles.length}`} last />
      </div>

      {/* the brief */}
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 bg-red px-4 py-3 text-paper">
        <p className="font-display text-step-1 leading-tight">
          {t('kitgame.task')} <Num>{puzzle.seasonLabel}</Num>
        </p>
        <p className="font-body text-[11.5px] leading-snug text-paper/85">
          {ready ? t('kitgame.hintReady') : t('kitgame.hintPick')}
        </p>
      </div>

      <div className="mt-2 grid gap-2 lg:grid-cols-[320px_1fr_300px] lg:items-start">
        {/* ── the table. First on a phone, middle on the board ── */}
        <div className="order-1 border-rule border-ink bg-paper lg:order-2">
          <div className="flex items-center justify-between border-b-hair border-ink/30 px-3 py-2">
            <p className="font-body text-[11px] tracking-widest text-muted">{t('kitgame.table')}</p>
            <p className="font-mono text-[11px] tabular-nums text-red">
              <Num>{`${PART_ORDER.length - missing.length}/${PART_ORDER.length}`}</Num>
            </p>
          </div>
          <div className="relative px-3 py-3">
            <KitPlate spec={shirt} missing={[]} className="mx-auto block h-auto w-full max-w-[340px]" />
            {/* The zones sit over the plate at the slots the renderer prints into.
                dir="ltr" because these are SVG coordinates, not a reading order — the
                same bug that put the XI name cards on the wrong touchline. */}
            <div dir="ltr" className="pointer-events-none absolute inset-0 px-3 py-3">
              <div className="relative mx-auto h-full w-full max-w-[340px]">
                {ZONES.map((zone) => {
                  const filled = placed[zone.kind]
                  return (
                    <button
                      key={zone.kind}
                      type="button"
                      onClick={() => tapZone(zone.kind)}
                      aria-label={t(`kitgame.part.${zone.kind}` as MessageKey)}
                      className={`pointer-events-auto absolute border-hair transition-colors duration-press ease-stamp motion-reduce:transition-none ${
                        filled ? 'border-transparent' : 'border-dashed border-sign/50'
                      }`}
                      style={{
                        insetInlineStart: `${zone.x}%`,
                        top: `${zone.y}%`,
                        width: `${zone.w}%`,
                        height: `${zone.h}%`,
                      }}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── the drawer ── */}
        <div className="order-2 border-rule border-ink bg-sheet lg:order-1">
          <div className="border-b-hair border-ink/30 px-3 py-2">
            <p className="font-display text-step-0 leading-none text-ink">{t('kitgame.drawer')}</p>
            <p className="mt-1 font-body text-[11px] leading-snug text-muted">
              {t('kitgame.drawerSub')}
            </p>
          </div>
          {puzzle.drawers.map((drawer) => {
            const chosen = placed[drawer.kind]
            return (
              <section key={drawer.kind} className="border-b-hair border-ink/20 px-3 py-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-body text-[11px] tracking-widest text-muted">
                    {t(`kitgame.part.${drawer.kind}` as MessageKey)}
                  </p>
                  <p
                    className={`font-body text-[10.5px] font-extrabold ${
                      chosen ? 'text-red' : 'text-muted/70'
                    }`}
                  >
                    {chosen ? chosen.labelHe : t('kitgame.empty')}
                  </p>
                </div>
                <ul className="mt-2 grid grid-cols-3 gap-1.5">
                  {drawer.parts.map((part) => {
                    const isChosen = chosen?.id === part.id
                    return (
                      <li key={part.id}>
                        <button
                          type="button"
                          onClick={() => place(part)}
                          aria-pressed={isChosen}
                          className={`flex w-full flex-col gap-1.5 border-hair p-1.5 text-start transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none ${
                            isChosen ? 'border-red bg-red/10' : 'border-ink/35 bg-paper'
                          }`}
                        >
                          <span className="block overflow-hidden bg-sheet">
                            <PartSwatch part={part} blank={puzzle.blank} />
                          </span>
                          {/* two lines, never truncated: an era name cut to "בלי כתר
                              ·…" tells the player nothing, and this card is the only
                              place the part is named. */}
                          <span className="block min-h-[2.2em] font-body text-[10px] font-bold leading-tight text-ink">
                            {part.labelHe}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>

        {/* ── the checklist and the button ── */}
        <div className="order-3 border-rule border-ink bg-sheet">
          <ol>
            {PART_ORDER.map((kind, order) => {
              const part = placed[kind]
              return (
                <li
                  key={kind}
                  className="flex items-center gap-3 border-b-hair border-ink/20 px-3 py-2.5"
                >
                  <span
                    className={`grid h-6 w-6 flex-none place-items-center border-hair font-poster text-[14px] leading-none ${
                      part ? 'border-red bg-red text-paper' : 'border-ink/40 text-muted'
                    }`}
                  >
                    <Num>{String(order + 1)}</Num>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-body text-[12px] font-bold leading-tight text-ink">
                      {t(`kitgame.part.${kind}` as MessageKey)}
                    </span>
                    <span
                      className={`mt-0.5 block truncate font-body text-[11px] leading-tight ${
                        part ? 'text-red' : 'text-muted/70'
                      }`}
                    >
                      {part ? part.labelHe : t('kitgame.empty')}
                    </span>
                  </span>
                </li>
              )
            })}
          </ol>
          <div className="px-3 pb-3 pt-3">
            <button
              type="button"
              onClick={check}
              disabled={!ready || busy}
              className="flex min-h-tap w-full items-center justify-center bg-ink px-4 font-body text-step-0 font-extrabold text-paper transition-transform duration-press ease-stamp active:scale-[.98] disabled:opacity-40 motion-reduce:transition-none"
            >
              {t('kitgame.check')}
            </button>
            <p className="mt-2 font-body text-[11px] leading-snug text-muted">{t('kitgame.rule')}</p>
          </div>
        </div>
      </div>

      {verdict && (
        <Reveal
          verdict={verdict}
          mine={shirt}
          last={index + 1 >= puzzles.length}
          onNext={next}
        />
      )}
    </div>
  )
}

/** The three printed slots, as percentages of the plate's 300×285 viewBox. */
const ZONES: { kind: PartKind; x: number; y: number; w: number; h: number }[] = [
  { kind: 'body', x: 30, y: 55, w: 40, h: 30 },
  { kind: 'sleeve', x: 4, y: 22, w: 22, h: 30 },
  { kind: 'sponsor', x: 26.7, y: 45.6, w: 40, h: 12 },
  { kind: 'crest', x: 54.7, y: 19.6, w: 13.3, h: 15.4 },
  { kind: 'maker', x: 30.7, y: 21, w: 8, h: 9.8 },
]

function Cell({
  label,
  value,
  red = false,
  last = false,
}: {
  label: string
  value: string
  red?: boolean
  last?: boolean
}) {
  return (
    <div className={`flex-1 px-3 py-2 ${last ? '' : 'border-e-hair border-ink/30'}`}>
      <p className="font-body text-[10px] tracking-widest text-muted">{label}</p>
      <p className={`mt-1 font-poster text-[22px] leading-none ${red ? 'text-red' : 'text-ink'}`}>
        <Num>{value}</Num>
      </p>
    </div>
  )
}

/**
 * A drawer card shows the part ON a shirt, not as an abstract swatch.
 *
 * A rectangle of red next to a rectangle of white tells you nothing about what a chest
 * band looks like when it is worn. The card draws the blank shirt with only this one
 * part applied and crops to where that part lives, so what you are choosing between is
 * three pictures of the decision rather than three colour chips.
 */
const CROP: Record<PartKind, string> = {
  // Each crop is centred on the slot the part prints into, with enough cloth around it
  // to read as fabric. A swatch cropped off-centre shows the player an edge and asks
  // them to infer the part, which is the opposite of what a drawer card is for.
  body: '80 60 170 200',
  sleeve: '42 52 68 106',
  sponsor: '92 148 136 58',
  maker: '106 84 40 42',
  crest: '176 78 58 62',
}

function PartSwatch({ part, blank }: { part: KitPart; blank: KitSpec }) {
  const spec = { ...blank, ...part.patch }
  return (
    <span className="block" style={{ aspectRatio: '1.25' }}>
      <KitPlate spec={spec} texture={false} className="h-full w-full" viewBox={CROP[part.kind]} />
    </span>
  )
}

/* ------------------------------------------------------------------ the reveal */

function Reveal({
  verdict,
  mine,
  last,
  onNext,
}: {
  verdict: KitVerdict
  mine: KitSpec
  last: boolean
  onNext: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-ink/70" role="dialog" aria-modal="true">
      <div className="max-h-[88vh] animate-slam overflow-y-auto border-t-rule border-ink bg-sheet">
        <div
          className={`px-4 py-3 ${verdict.perfect ? 'bg-red text-paper' : 'bg-ink text-paper'}`}
        >
          <p className="font-display text-step-1 leading-tight">
            {verdict.perfect
              ? t('kitgame.perfect')
              : t('kitgame.partial', { n: String(verdict.right) })}
          </p>
          <p className="mt-1 font-body text-[11.5px] leading-snug text-concrete">
            {verdict.perfect ? t('kitgame.perfectNote') : t('kitgame.partialNote')}
          </p>
        </div>

        {/* mine beside the truth — the comparison is the teaching */}
        <div className="grid grid-cols-2 gap-2 p-3">
          <figure className="border-hair border-ink/40 bg-paper p-2">
            <KitPlate spec={mine} className="block h-auto w-full" />
            <figcaption className="mt-1 font-body text-[10px] tracking-widest text-muted">
              {t('kitgame.mine')}
            </figcaption>
          </figure>
          <figure className="border-rule border-red bg-paper p-2">
            <KitPlate spec={verdict.answer} className="block h-auto w-full" />
            <figcaption className="mt-1 font-body text-[10px] tracking-widest text-red">
              {t('kitgame.truth')} · <Num>{verdict.seasonLabel}</Num>
            </figcaption>
          </figure>
        </div>

        <ul className="px-3">
          {verdict.parts.map((part) => (
            <li
              key={part.kind}
              className="flex items-center justify-between gap-3 border-b-hair border-ink/20 py-2"
            >
              <span className="font-body text-[12px] text-ink">
                {t(`kitgame.part.${part.kind}` as MessageKey)}
              </span>
              <span
                className={`font-body text-[12px] font-extrabold ${
                  part.correct ? 'text-red' : 'text-muted'
                }`}
              >
                {part.correct ? `+${PART_POINTS}` : '—'}
              </span>
            </li>
          ))}
        </ul>

        {verdict.noteHe !== '' && (
          <p className="px-3 py-3 font-body text-step--1 leading-relaxed text-muted">
            {verdict.noteHe}
          </p>
        )}

        {/* The continue button is STICKY inside the panel, not the last thing in it.
            On a 390×900 phone the reveal is two shirts, five rows and a note — taller
            than the glass — so a button at the end of that is a button the player has to
            go looking for after every single shirt. It sits on the floor of the panel
            and never leaves. */}
        <div className="sticky bottom-0 border-t-rule border-ink bg-sheet p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onNext}
            className="flex min-h-tap w-full items-center justify-center bg-red px-4 font-body text-step-0 font-extrabold text-paper"
          >
            {last ? t('kitgame.finish') : t('kitgame.next')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ the summary */

function RoundSummary({
  log,
  seed,
  score,
  right,
}: {
  log: KitVerdict[]
  seed: number
  score: number
  right: number
}) {
  const total = KIT_ROUND * PART_ORDER.length
  // Accuracy per category, which is the one number that tells a player something they
  // can act on: "you know the sponsors and you do not know the crests".
  const byKind = PART_ORDER.map((kind) => ({
    kind,
    right: log.filter((row) => row.parts.find((part) => part.kind === kind)?.correct).length,
  }))
  const weakest = [...byKind].sort((a, b) => a.right - b.right)[0]
  const best = [...log].sort((a, b) => b.score - a.score)[0]

  return (
    <div className="mt-stack">
      <div className="bg-red px-4 py-4 text-paper">
        <p className="font-body text-[10px] tracking-widest text-paper/85">
          {t('kitgame.roundDone')}
        </p>
        <p className="mt-2 font-display text-step-3 leading-none">
          <Num>{t('kitgame.roundParts', { n: String(right), total: String(total) })}</Num>
        </p>
        <p className="mt-3 font-poster text-[46px] leading-none">
          <Num>{String(score)}</Num>
        </p>
        <p className="font-body text-[10px] tracking-widest text-paper/85">
          {t('kitgame.roundScore')}
        </p>
      </div>

      <p className="mt-stack font-body text-[11px] tracking-widest text-muted">
        {t('kitgame.byCategory')}
      </p>
      <ul className="mt-2">
        {byKind.map((row) => (
          <li key={row.kind} className="mt-2">
            <div className="flex items-baseline justify-between font-body text-[12px] font-bold text-ink">
              <span>{t(`kitgame.part.${row.kind}` as MessageKey)}</span>
              <span className="font-mono tabular-nums">
                <Num>{`${row.right}/${KIT_ROUND}`}</Num>
              </span>
            </div>
            <div className="mt-1.5 h-2.5 border-hair border-ink/30 bg-paper">
              <div
                className="h-full bg-red"
                style={{ inlineSize: `${(row.right / KIT_ROUND) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      {weakest && (
        <p className="mt-3 font-body text-step--1 leading-relaxed text-muted">
          {t('kitgame.weakest')}: {t(`kitgame.part.${weakest.kind}` as MessageKey)}
        </p>
      )}

      {best && (
        <div className="mt-stack flex items-center gap-3 border-rule border-ink bg-sheet p-3">
          <span className="w-20 flex-none">
            <KitPlate spec={best.answer} className="block h-auto w-full" />
          </span>
          <span className="min-w-0">
            <span className="block font-body text-[10px] tracking-widest text-muted">
              {t('kitgame.bestShirt')}
            </span>
            <span className="mt-1 block font-display text-step-1 leading-tight text-ink">
              <Num>{best.seasonLabel}</Num>
            </span>
          </span>
        </div>
      )}

      <ShareRow
        kind="kit"
        params={{ c: String(right), s: String(seed) }}
        headline={`${right}/${total}`}
        card={{
          template: 'kit' as const,
          art: artFor('kit', right / total),
          kicker: 'GATE 4 · THE KIT GAME',
          label: t('screen.kitgame.title'),
          eyebrow: t('kitgame.parts'),
          hero: `${right}/${total}`,
          kit: best?.answer,
          bigStat: { v: String(score), k: t('run.score') },
          stats: byKind.slice(0, 2).map((row) => ({
            k: t(`kitgame.part.${row.kind}` as MessageKey),
            v: `${row.right}/${KIT_ROUND}`,
          })),
          cta: t('kitgame.cta'),
          challenge: t('share.sameRound'),
        }}
      />

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <a
          href={`/kits/build?seed=${seed + 1}`}
          className="flex min-h-tap items-center justify-center border-rule border-ink bg-sheet px-4 font-body text-step-0 font-extrabold text-ink"
        >
          {t('run.again')}
        </a>
        <a
          href="/"
          className="flex min-h-tap items-center justify-center bg-ink px-4 font-body text-step-0 font-extrabold text-paper"
        >
          {t('nav.gates')}
        </a>
      </div>
    </div>
  )
}
