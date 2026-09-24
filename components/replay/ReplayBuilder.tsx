'use client'

import { Num } from '@/components/ui/Num'
import {
  PHASES,
  lengthBucket,
  phaseOf,
  stepsDone,
  type Draft,
  type DraftPhase,
  type LengthBucket,
} from '@/lib/game/replay/draft'
import { REPLAY_ACTIONS, type ReplayAction } from '@/lib/game/replay/vocab'
import type { UserTouch } from '@/lib/game/replay/envelope'
import { t, type MessageKey } from '@/lib/i18n'

/**
 * בניית המהלך — the panel under the pitch, and the four decisions a touch is made of.
 *
 * Gate 8 used to TELL you the cast, the verbs and the order and ask only where. That is a
 * quiz about a diagram. Here the move is built: who touched it, what he did, where he
 * stood, where he sent it — and then you decide, yourself, that the move is finished.
 * Nothing on this screen says how many touches the archive holds, because how many is
 * part of the question.
 *
 * **And there is no "add touch" button.** The prototype has one, and gate 4 already
 * settled this argument: *"a part has exactly one home so the second tap carries no
 * decision — it is a dexterity step charged for nothing, and on a phone it doubles every
 * action in the game"* (rule 24). A touch is who, what, from where, to where; the moment
 * the fourth is answered there is nothing left to decide, so the second pitch tap commits
 * it and the panel is ready for the next one. Reopening a finished touch and tapping twice
 * saves it the same way. Four taps a touch on a phone instead of five, and the rack is
 * reachable without scrolling back for a button that agreed with you.
 *
 * Four things this panel is deliberately NOT:
 *   · **not a set of dropdowns.** Every option is a visible, pressable thing. The names
 *     WRAP rather than scroll sideways: a sideways rack hid three of seven names at 320px,
 *     and a name you cannot see is not an option (rule 41).
 *   · **not a place you can get stuck.** Every state has a next action and a way back:
 *     clear the touch being built, undo one STEP (and, from an empty draft, reopen the
 *     last touch with its ball un-sent — `lib/game/replay/draft.ts`), or tap a finished
 *     touch to reopen it. Rule 42's "leaving is always allowed", in a builder.
 *   · **not a hidden gesture.** The verbs carry a drawn mark AND their name, because "do
 *     not rely on colour alone" is also true of a glyph alone. The step bar says which of
 *     the four decisions is done with a ✓ and which is next with an inverted box, and
 *     an opponent's chip is dashed AND says "יריב" — never a tint alone.
 *   · **not a shrunken desktop.** Every control clears the 48px tap height on the
 *     narrowest phone this product supports.
 */

export const ACTION_LABEL: Record<ReplayAction, MessageKey> = {
  pass: 'goal.action.pass',
  throughBall: 'goal.action.throughBall',
  cross: 'goal.action.cross',
  dribble: 'goal.action.dribble',
  shot: 'goal.action.shot',
  header: 'goal.action.header',
  save: 'goal.action.save',
}

export const ACTION_SHORT: Record<ReplayAction, MessageKey> = {
  pass: 'goal.act.pass',
  throughBall: 'goal.act.throughBall',
  cross: 'goal.act.cross',
  dribble: 'goal.act.dribble',
  shot: 'goal.act.shot',
  header: 'goal.act.header',
  save: 'goal.act.save',
}

/**
 * The verbs, drawn.
 *
 * Seven marks in one idiom — a stroke and, where the verb needs it, one more. They are
 * not emoji and they are not a licensed icon set: a pass is a straight arrow, a ball in
 * behind is the same arrow dashed, a cross is an arc, carrying it is a zigzag, an attempt
 * is a spoked burst, a header is that burst under a head, and a parry is a flat palm.
 */
export function ActionGlyph({ action }: { action: ReplayAction }) {
  const paths: Record<ReplayAction, React.ReactNode> = {
    pass: <path d="M3 12 H19 M14 7 L19 12 L14 17" />,
    throughBall: (
      <>
        <path d="M3 12 H19 M14 7 L19 12 L14 17" strokeDasharray="3 3" />
      </>
    ),
    cross: <path d="M3 17 Q 11 2 19 14 M15 11 L19 14 L18 9" />,
    dribble: <path d="M3 12 L7 7 L11 15 L15 8 L19 12" />,
    shot: (
      <>
        <circle cx="8" cy="12" r="4" />
        <path d="M13 12 H20 M13 8 L20 6 M13 16 L20 18" />
      </>
    ),
    header: (
      <>
        <circle cx="8" cy="8" r="3.4" />
        <path d="M11 11 L19 17 M11 6 L19 4" />
        <path d="M6 13 L7 20" />
      </>
    ),
    save: (
      <>
        <path d="M5 19 V10 a2 2 0 0 1 4 0 V6 a2 2 0 0 1 4 0 v5" />
        <path d="M13 11 a2 2 0 0 1 4 0 v6 a4 4 0 0 1 -4 4 H8" />
      </>
    ),
  }
  return (
    <svg viewBox="0 0 22 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[action]}
    </svg>
  )
}

export type { Draft } from '@/lib/game/replay/draft'

const PHASE_ASK: Record<DraftPhase, MessageKey> = {
  player: 'goal.ask.player',
  action: 'goal.ask.action',
  origin: 'goal.ask.origin',
  target: 'goal.ask.target',
}

const PHASE_STEP: Record<DraftPhase, MessageKey> = {
  player: 'goal.step.player',
  action: 'goal.step.action',
  origin: 'goal.step.origin',
  target: 'goal.step.target',
}

export const LENGTH_LABEL: Record<LengthBucket, MessageKey> = {
  short: 'goal.len.short',
  medium: 'goal.len.medium',
  long: 'goal.len.long',
}

export function askKey(draft: Draft): MessageKey {
  return PHASE_ASK[phaseOf(draft)]
}

/**
 * ארבע ההחלטות — the step bar.
 *
 * A number while a decision is open, a ✓ once it is made, and the current one printed
 * inverted with `aria-current="step"`. Three cues, and the colour is the least of them.
 */
export function StepBar({ draft }: { draft: Draft }) {
  const done = stepsDone(draft)
  const now = phaseOf(draft)
  return (
    <ol aria-label={t('goal.step.aria')} className="mt-1.5 grid grid-cols-4 gap-1" data-goal="steps">
      {PHASES.map((phase, index) => {
        const current = phase === now && !done[phase]
        const made = done[phase]
        return (
          <li
            key={phase}
            aria-current={current ? 'step' : undefined}
            className={`flex items-center justify-center gap-1.5 border-rule px-1 py-1 ${
              current ? 'border-ink bg-ink text-paper' : made ? 'border-ink bg-sheet text-ink' : 'border-ink/30 bg-sheet text-muted'
            }`}
          >
            <span
              aria-hidden="true"
              className={`flex h-5 w-5 shrink-0 items-center justify-center border-hair font-latin text-[11px] font-extrabold leading-none ${
                current ? 'border-paper' : 'border-current'
              }`}
            >
              {made ? '✓' : <Num>{index + 1}</Num>}
            </span>
            <span className="min-w-0 truncate font-body text-[11px] font-extrabold leading-none">
              {t(PHASE_STEP[phase])}
            </span>
            <span className="sr-only">{made ? t('goal.step.done') : current ? t('goal.step.now') : ''}</span>
          </li>
        )
      })}
    </ol>
  )
}

export function ReplayBuilder({
  pool,
  opponents = [],
  draft,
  touches,
  editing,
  full,
  canFinish,
  canUndo,
  busy = false,
  /**
   * Round 2 (Maor 23.9.2026): on the phone the ask, the step bar, the "who" and the
   * "what" move OUT of this panel — a docked figure rail and action-chip row sit right
   * under the pitch instead (`GoalRun.tsx`), and the step bar joins the HUD strip. This
   * panel then keeps only what is still true on a phone: clear/undo/finish and the touch
   * list. Desktop is untouched — `false` is the default, and always is for `!phone`.
   */
  hideWhoWhat = false,
  onPickPlayer,
  onPickAction,
  onClear,
  onUndo,
  onEdit,
  onFinish,
}: {
  pool: string[]
  /** the names in the pool who played for the other side */
  opponents?: string[]
  draft: Draft
  touches: UserTouch[]
  /** the index being re-opened, or null when the draft is a new touch */
  editing: number | null
  /** true at the five-touch ceiling — the racks stay live for editing, the add does not */
  full: boolean
  canFinish: boolean
  canUndo: boolean
  /** the move is on its way to the server — nothing on this panel may change it now */
  busy?: boolean
  hideWhoWhat?: boolean
  onPickPlayer: (name: string) => void
  onPickAction: (action: ReplayAction) => void
  onClear: () => void
  onUndo: () => void
  onEdit: (index: number) => void
  onFinish: () => void
}) {
  const shut = (full && editing === null) || busy
  const draftStarted = draft.actorHe !== null || draft.action !== null || draft.origin !== null

  return (
    <div className="mt-2.5" data-goal="builder">
      {!hideWhoWhat && (
        <>
          {/* the ask — one sentence, and it changes as the touch fills in */}
          <div className="flex items-center justify-between gap-2 border-rule border-ink bg-ink px-3 py-2">
            <p className="min-w-0 font-display text-step-0 leading-tight text-paper">
              {editing !== null ? t('goal.editing', { n: String(editing + 1) }) : t(askKey(draft))}
            </p>
            <span className="shrink-0 font-latin text-[11px] font-extrabold tracking-[0.12em] text-concrete" dir="ltr">
              {touches.length}/5
            </span>
          </div>

          <StepBar draft={draft} />

          {/* who — wrapped, so every name is on screen at 320px */}
          <ul className="mt-1.5 flex flex-wrap gap-1.5" data-goal="pool">
            {pool.map((name) => {
              const chosen = draft.actorHe === name
              const opponent = opponents.includes(name)
              return (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => onPickPlayer(name)}
                    aria-pressed={chosen}
                    aria-label={opponent ? t('goal.pool.opponentAria', { name }) : undefined}
                    disabled={shut}
                    data-goal="player"
                    data-opponent={opponent ? 'true' : undefined}
                    className={`flex min-h-tap items-center gap-1.5 whitespace-nowrap border-rule px-2.5 font-body text-[13px] font-extrabold transition-colors duration-press disabled:opacity-40 ${
                      opponent ? 'border-dashed' : ''
                    } ${chosen ? 'border-ink bg-red text-paper' : 'border-ink bg-sheet text-ink'}`}
                  >
                    <bdi>{name}</bdi>
                    {opponent && (
                      <span
                        aria-hidden="true"
                        className={`border-hair px-1 font-body text-[10px] font-extrabold leading-[1.5] ${
                          chosen ? 'border-paper text-paper' : 'border-ink text-ink'
                        }`}
                      >
                        {t('goal.pool.opponent')}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="mt-1 font-body text-[11px] leading-snug text-muted">{t('goal.pool.note')}</p>

          {/* what */}
          <ul className="mt-1.5 grid grid-cols-4 gap-1.5">
            {REPLAY_ACTIONS.map((action) => {
              const chosen = draft.action === action
              return (
                <li key={action}>
                  <button
                    type="button"
                    onClick={() => onPickAction(action)}
                    aria-pressed={chosen}
                    disabled={shut}
                    data-goal="action"
                    className={`flex min-h-tap w-full flex-col items-center justify-center gap-0.5 border-rule border-ink px-1 py-1 transition-colors duration-press disabled:opacity-40 ${
                      chosen ? 'bg-red text-paper' : 'bg-sheet text-ink'
                    }`}
                  >
                    <ActionGlyph action={action} />
                    <span className="font-body text-[10.5px] font-extrabold leading-none">
                      {t(ACTION_LABEL[action])}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {/* the three buttons that move the move along. There is no fourth — see the header. */}
      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={onClear}
          disabled={busy || (!draftStarted && editing === null)}
          data-goal="clear"
          className="flex min-h-tap items-center justify-center border-rule border-ink bg-sheet px-2 font-body text-[12px] font-extrabold text-muted disabled:opacity-40"
        >
          {t('goal.clearTouch')}
        </button>
        <button
          type="button"
          onClick={onUndo}
          disabled={busy || !canUndo}
          data-goal="undo"
          className="flex min-h-tap items-center justify-center border-rule border-ink bg-sheet px-2 font-body text-[12px] font-extrabold text-ink disabled:opacity-40"
        >
          {t('goal.undoStep')}
        </button>
        <button
          type="button"
          onClick={onFinish}
          disabled={busy || !canFinish}
          data-goal="finish"
          className="flex min-h-tap items-center justify-center border-rule border-ink bg-red px-2 font-body text-[12px] font-extrabold text-paper disabled:opacity-40"
        >
          {t('goal.finish')}
        </button>
      </div>
      {!canFinish && (
        <p className="mt-1 font-body text-[11px] leading-snug text-muted max-md:hidden">{t('goal.needTwo')}</p>
      )}
      {full && editing === null && (
        <p className="mt-1 font-body text-[11px] leading-snug text-muted">{t('goal.tooMany')}</p>
      )}

      {/* phone stage (delta 87): the move so far as ONE line of numbered chips, so the
          list never runs under the tab bar; tap a chip to reopen that touch. */}
      {touches.length > 0 && (
        <ol aria-label={t('goal.touchList')} className="-mx-0.5 mt-1.5 flex gap-1 overflow-x-auto px-0.5 pb-0.5 md:hidden">
          {touches.map((touch, index) => (
            <li key={index} className="shrink-0">
              <button
                type="button"
                onClick={() => onEdit(index)}
                disabled={busy}
                aria-label={t('goal.editTouch', { n: String(index + 1) })}
                aria-current={editing === index ? 'true' : undefined}
                className={`flex min-h-tap items-center gap-1.5 border-rule px-2 ${
                  editing === index ? 'border-red bg-red text-paper' : 'border-ink bg-sheet text-ink'
                }`}
              >
                <span className="font-poster text-[16px] leading-none">
                  <Num>{index + 1}</Num>
                </span>
                <ActionGlyph action={touch.action} />
                <span className="max-w-[88px] truncate font-body text-[11px] font-extrabold">
                  <bdi>{touch.actorHe}</bdi>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}

      {/* the move so far — tap a line to reopen it */}
      <div className="mt-2 border-rule border-ink bg-sheet max-md:hidden">
        <p className="border-b-hair border-ink/25 px-3 py-1.5 font-body text-[11px] font-extrabold tracking-widest text-muted">
          {t('goal.touchList')}
        </p>
        {touches.length === 0 ? (
          <p className="px-3 py-3 font-body text-[12px] leading-snug text-muted">
            {t('goal.noTouches')}
          </p>
        ) : (
          <ol>
            {touches.map((touch, index) => (
              <li key={index} className="border-b-hair border-ink/20 last:border-b-0">
                <button
                  type="button"
                  onClick={() => onEdit(index)}
                  disabled={busy}
                  aria-label={t('goal.editTouch', { n: String(index + 1) })}
                  aria-current={editing === index ? 'true' : undefined}
                  data-goal="touch"
                  className={`flex min-h-tap w-full items-center gap-2 px-3 text-start transition-colors duration-press ${
                    editing === index ? 'bg-red/10' : ''
                  }`}
                >
                  <span className="w-5 shrink-0 font-poster text-[17px] leading-none text-red">
                    <Num>{index + 1}</Num>
                  </span>
                  <span className="shrink-0 text-ink">
                    <ActionGlyph action={touch.action} />
                  </span>
                  <span className="min-w-0 flex-1 font-body text-[12.5px] font-extrabold leading-snug text-ink">
                    <bdi>{touch.actorHe}</bdi>
                  </span>
                  <span className="shrink-0 text-end font-body text-[11px] leading-tight text-muted">
                    {t(ACTION_SHORT[touch.action])}
                    <span className="block">{t(LENGTH_LABEL[lengthBucket(touch.origin, touch.target)])}</span>
                  </span>
                  {editing === index && (
                    <span aria-hidden="true" className="shrink-0 font-body text-[11px] font-extrabold text-ink">
                      ✎
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
