'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { KitPlate } from '@/components/kit/KitPlate'
import { Num } from '@/components/ui/Num'
import { RosterSheet } from '@/components/roster/RosterSheet'
import { ShareRow } from '@/components/share/ShareRow'
import type { Formation, PitchSlot } from '@/lib/game/lineup'
import type { RosterEntry, RosterIndex } from '@/lib/game/allTimeXI'
import type { ShirtBoard } from '@/lib/xi/board'
import { activeXI, restore, XI_TABS, type XITab } from '@/lib/xi/store'
import { recordDeed } from '@/lib/profile/store'
import { t, type MessageKey } from '@/lib/i18n'

/**
 * הרכב כל הזמנים — pick eleven from everyone who ever wore the shirt.
 *
 * The pitch is drawn in the PRESS layer's tokens (`--p-grass`, `--p-grass-dark`,
 * `--p-halo`), which is what that layer is for — a printed pitch. They go through
 * `style` rather than a Tailwind class because the values are custom properties the
 * shell's palette deliberately does not expose as utilities.
 *
 * Free play. No clock, no lives, no score — the reward is the picture and the argument
 * it starts, which is the reward the game has always had in real life.
 *
 * The design problem is 637 names. A dropdown of 637 is a wall, so: tap a slot on the
 * pitch, and the roster opens as a sheet with a search that matches ANY part of the name
 * (a supporter types "בוזגלו", not "מאור"), plus an alphabet rail keyed on the family
 * name. Picking closes the sheet and puts the chip on the grass. Nothing is graded and
 * nothing is required — an eleven with three empty slots still shares.
 *
 * ## The shirt (17.9.2026)
 *
 * Maor: *"אני רוצה שבבחירת שחקן להרכב כל הזמנים תצורף בגרפיקה החולצה שהוא מזוהה איתה."*
 * A picked man wears a shirt from **a season the squad table actually puts him in**,
 * drawn by `KitPlate` from the spec (rule 20 — eight layers, never an image) with the
 * era's crest printed on it (rule 25). The season is said out loud beside him, because
 * a shirt with no year on it is a costume. Which season, and why that one, is decided
 * in `lib/kit/playerKit.ts` and nowhere else. **A man the archive cannot dress shows
 * his name, exactly as before** — 272 of the 661, and inventing a shirt for them would
 * be inventing a fact about a man (rule 11).
 *
 * ## The second tab (17.9.2026)
 *
 * Maor: *"אני רוצה שיהיה גם אופציה בהרכב כל הזמנים ל'ההרכב הגרוע בכל הזמנים' בלשונית
 * נפרדת באותו פיצר."*
 *
 * **The app ranks nobody, and that is deliberate rather than squeamish.** Rule 18 lets
 * Maor name the figures the terrace resents — that is gate 11, and every charge in it is
 * built on a documented transfer with a source. An app-GENERATED "worst players" list is
 * a different object: a factual claim about named men that no source supports, printed
 * by us. So the worst XI is a supporter's opinion from end to end — he picks all eleven
 * out of the same roster, nothing is suggested, nothing is scored, and the share card
 * says in its own words that it is one man's opinion.
 *
 * The two tabs share ONE roster sheet and one pitch (rule 24 — one ranking, no second
 * copy); the only thing that differs between them is which sheet is being saved and
 * what the card says.
 */
export function XIBuilder({
  formations,
  roster,
  shirts,
  tab: initialTab = 'best',
}: {
  formations: Formation[]
  roster: RosterIndex
  shirts: ShirtBoard
  /** which tab the link asked for — `/xi?tab=worst` (see `lib/share/copy.ts`) */
  tab?: XITab
}) {
  const [tab, setTab] = useState<XITab>(initialTab)
  const [formation, setFormation] = useState<Record<XITab, Formation>>({
    best: formations[0] as Formation,
    worst: formations[0] as Formation,
  })
  const [picked, setPicked] = useState<Record<XITab, Record<string, RosterEntry>>>({
    best: {},
    worst: {},
  })
  const [openSlot, setOpenSlot] = useState<PitchSlot | null>(null)
  const [ready, setReady] = useState(false)

  const store = useMemo(() => activeXI(), [])
  const bySlug = useMemo(
    () => new Map(roster.all.map((entry) => [entry.slug, entry])),
    [roster.all],
  )

  /**
   * Read the device's sheets once, then write on every change.
   *
   * The read has to land before the first write or an empty pitch overwrites a saved
   * eleven on mount — which is the failure mode of every autosaving screen ever built,
   * and is why `ready` exists rather than a debounce.
   */
  useEffect(() => {
    let alive = true
    void store.read().then((book) => {
      if (!alive) return
      const next = { ...picked }
      const nextFormation = { ...formation }
      for (const key of XI_TABS) {
        const sheet = restore(book[key], formations)
        if (!sheet) continue
        nextFormation[key] = sheet.formation
        next[key] = Object.fromEntries(
          Object.entries(sheet.picks)
            .map(([slot, slug]) => [slot, bySlug.get(slug)] as const)
            .filter((pair): pair is [string, RosterEntry] => pair[1] !== undefined),
        )
      }
      setFormation(nextFormation)
      setPicked(next)
      setReady(true)
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read once, on mount
  }, [])

  useEffect(() => {
    if (!ready) return
    void store.save(tab, {
      formation: formation[tab].name,
      picks: Object.fromEntries(
        Object.entries(picked[tab]).map(([slot, entry]) => [slot, entry.slug]),
      ),
    })
  }, [ready, tab, formation, picked, store])

  const current = picked[tab]
  const currentFormation = formation[tab]
  const chosen = Object.keys(current).length

  /*
   * מעשה — a wing has no round, and until 17.9.2026 that meant its plate could never light
   * and `stillToDo` nagged about it for ever. `recordDeed` is the wing's equivalent of a
   * finished round: something was MADE. It carries no score, so a wing can never climb the
   * correct/asked figures that belong to the quizzes. The ref is React's double-invoke
   * guard, the same one `RecordRun` keeps.
   *
   * It fires on a FULL eleven and, since the sheets are saved, it fires for a sheet that
   * was restored from the device as well — a gate you completed yesterday is a gate you
   * have been through, and reading it back is not the same as never having played it.
   */
  const deeded = useRef(false)
  useEffect(() => {
    if (deeded.current || chosen < 11) return
    deeded.current = true
    recordDeed('/xi')
  }, [chosen])

  const takenSlugs = useMemo(
    () => new Set(Object.values(current).map((entry) => entry.slug)),
    [current],
  )

  function choose(entry: RosterEntry) {
    if (!openSlot) return
    const slotId = openSlot.slotId
    setPicked((all) => ({ ...all, [tab]: { ...all[tab], [slotId]: entry } }))
    setOpenSlot(null)
  }

  function clear(slotId: string) {
    setPicked((all) => {
      const next = { ...all[tab] }
      delete next[slotId]
      return { ...all, [tab]: next }
    })
  }

  const worst = tab === 'worst'

  return (
    <div className="mt-stack">
      {/* the two sheets. Same pitch, same roster, same eleven slots. */}
      <div role="tablist" aria-label={t('xi.tabs')} className="flex gap-1.5">
        {XI_TABS.map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={tab === option}
            onClick={() => setTab(option)}
            className={`min-h-tap flex-1 border-hair px-3 font-sign text-step--1 transition-transform duration-press ease-stamp active:scale-[.98] motion-reduce:transition-none ${
              tab === option ? 'border-ink bg-ink text-paper' : 'border-ink/40 text-ink'
            }`}
          >
            {t(`xi.tab.${option}` as MessageKey)}
          </button>
        ))}
      </div>

      {/*
        The opinion line, on the screen and not only on the card. A tab called "the worst
        eleven of all time" is a sentence about named people; who is saying it has to be
        on the same screen as the names, not behind a share button.
      */}
      {worst && (
        <p className="mt-2 border-hair border-ink/40 bg-sheet px-3 py-2 font-body text-[12px] leading-relaxed text-ink">
          {t('xi.worst.note')}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {formations.map((option) => (
            <button
              key={option.name}
              type="button"
              onClick={() => setFormation((all) => ({ ...all, [tab]: option }))}
              aria-pressed={currentFormation.name === option.name}
              className={`min-h-tap border-hair px-3 font-mono text-step--1 tabular-nums transition-transform duration-press ease-stamp active:scale-[.95] motion-reduce:transition-none ${
                currentFormation.name === option.name
                  ? 'border-red bg-red text-paper'
                  : 'border-ink/40 text-ink'
              }`}
            >
              <bdi dir="ltr">{option.name}</bdi>
            </button>
          ))}
        </div>
        {/* One isolate around the whole ratio, not two around each half: two adjacent
            <bdi> runs reorder against each other in RTL and "3/11" came out "11/3". */}
        <p className="font-body text-[11px] tracking-widest text-muted">
          <Num>{`${chosen}/11`}</Num>
        </p>
      </div>

      {/* the pitch */}
      <div className="relative mt-3 aspect-[3/4] w-full overflow-hidden border-rule border-ink"
        style={{ background: 'rgb(var(--p-grass))' }}>
        <div aria-hidden="true" className="absolute inset-0">
          {[0, 1, 2, 3, 4, 5].map((band) => (
            <div
              key={band}
              className="absolute inset-x-0"
              style={{
                top: `${band * 16.6}%`,
                height: '8.3%',
                background: 'rgb(var(--p-grass-dark))',
              }}
            />
          ))}
        </div>
        {/* chalk */}
        <svg
          viewBox="0 0 100 133"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <g fill="none" stroke="rgb(var(--p-halo) / .8)" strokeWidth="0.6">
            <rect x="3" y="3" width="94" height="127" />
            <path d="M3 66.5 H97" />
            <circle cx="50" cy="66.5" r="12" />
            <rect x="27" y="3" width="46" height="18" />
            <rect x="27" y="112" width="46" height="18" />
          </g>
        </svg>

        {currentFormation.slots.map((slot) => {
          const entry = current[slot.slotId]
          const shirt = entry ? shirts.bySlug[entry.slug] : undefined
          const season = shirt ? shirts.seasons[shirt.seasonLabel] : undefined
          return (
            <button
              key={slot.slotId}
              type="button"
              onClick={() => (entry ? clear(slot.slotId) : setOpenSlot(slot))}
              style={{ insetInlineStart: `${slot.x}%`, top: `${slot.y}%` }}
              className="absolute min-h-tap -translate-x-1/2 -translate-y-1/2 transition-transform duration-press ease-stamp active:scale-[.94] motion-reduce:transition-none rtl:translate-x-1/2"
            >
              {entry ? (
                <span className="flex animate-slam flex-col items-center gap-0.5">
                  {/*
                    The shirt he is identified with, drawn from the spec. A thumbnail at
                    this size gets `texture={false}` — the weave is noise at 44px and the
                    plate says so itself.
                  */}
                  {season && (
                    <KitPlate
                      spec={season.spec}
                      texture={false}
                      viewBox="60 40 220 200"
                      className="h-11 w-11"
                      title={t('xi.shirt.alt', { season: season.seasonLabel })}
                    />
                  )}
                  <span className="block max-w-[104px] border-hair border-ink bg-sheet px-2 py-1 font-body text-[11px] font-extrabold leading-tight text-ink">
                    {entry.nameHe}
                  </span>
                  {season && (
                    <span className="block border-hair border-ink/30 bg-sheet/90 px-1 font-mono text-[9px] leading-tight text-muted">
                      <Num>{season.seasonLabel}</Num>
                    </span>
                  )}
                </span>
              ) : (
                <span className="block border-hair border-dashed border-sheet/80 bg-ink/25 px-2 py-1 font-body text-[10px] leading-tight text-sheet">
                  {slot.roleHe}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <p className="mt-2 font-body text-[11px] text-muted">
        {t('xi.help', { total: String(roster.total) })}
      </p>
      {/*
        What the archive can and cannot dress, counted on the screen. A reader who picks
        a man and gets no shirt is owed the reason, and the reason is that the archive
        holds no kit from any season he played — not that he did not play.
      */}
      <p className="mt-1 font-body text-[11px] text-muted">
        {t('xi.shirt.coverage', {
          dressed: String(shirts.withShirt),
          total: String(roster.total),
        })}
      </p>

      <ShareRow
        // `kind="lineup"` with no route sent everyone who opened an all-time XI to
        // `/lineup?seed=1` — the GRADED match quiz, a different game with a different
        // gate number. Overriding the route fixed the destination and left the lie in
        // the query string: `params={{ s: '1' }}` handed every reader `?seed=1` on a
        // screen that reads no seed. Gate 1 has its own `kind` now (17.9.2026), it is
        // in `SEEDLESS`, and the message template that always described an all-time XI
        // moved with it — `share.msg.lineup` is gate 3's own sentence again.
        //
        // The worst eleven shares as its own kind, for two reasons that are both about
        // honesty rather than tidiness: the link has to open the tab it is about
        // (`/xi?tab=worst`), and the message that travels with it has to say whose
        // opinion this is before anybody reads eleven names.
        kind={worst ? 'worst' : 'xi'}
        params={{ total: '11' }}
        headline={`${chosen}/11`}
        card={{
          // The team sheet draws itself. Three names as "facts" threw eight of the
          // eleven away, which is the entire content of an all-time XI.
          template: 'xi' as const,
          kicker: worst ? 'GATE 1 · WORST XI · ONE FAN’S OPINION' : 'GATE 1 · ALL-TIME XI',
          label: worst ? t('xi.tab.worst') : t('screen.xi.title'),
          eyebrow: currentFormation.name,
          hero: worst ? t('xi.tab.worst') : t('screen.xi.title'),
          xi: currentFormation.slots
            .map((slot) => {
              const entry = current[slot.slotId]
              return entry
                ? { roleHe: slot.roleHe, nameHe: entry.familyHe, x: slot.x, y: slot.y }
                : null
            })
            .filter((slot): slot is NonNullable<typeof slot> => slot !== null),
          stats: [],
          cta: worst ? t('xi.worst.cta') : t('xi.cta'),
          // The card's own foot line. On the worst sheet it is not a dare — it is the
          // sentence that says nobody was ranked by anything but the person sharing it.
          challenge: worst ? t('xi.worst.opinion') : t('share.sameRound'),
        }}
      />

      {/* the roster sheet — shared with the polls wing, see components/roster */}
      {openSlot && (
        <RosterSheet
          title={openSlot.roleHe}
          roster={roster}
          taken={takenSlugs}
          onPick={(entry) => choose(entry)}
          onClose={() => setOpenSlot(null)}
        />
      )}
    </div>
  )
}
