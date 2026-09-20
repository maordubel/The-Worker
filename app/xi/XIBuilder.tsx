'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { KitPlate } from '@/components/kit/KitPlate'
import { Num } from '@/components/ui/Num'
import { RosterSheet } from '@/components/roster/RosterSheet'
import { ShareRow } from '@/components/share/ShareRow'
import { useDialog } from '@/components/ui/useDialog'
import type { Formation, PitchSlot } from '@/lib/game/lineup'
import type { RosterEntry, RosterIndex } from '@/lib/game/allTimeXI'
import type { ShirtBoard } from '@/lib/xi/board'
import { xiDna } from '@/lib/xi/dna'
import type { ScoutOrder } from '@/lib/xi/scout'
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
 * ## שולחן המאמן — the position first, the man second (19.9.2026)
 *
 * The one interaction change that everything else hangs off. Until now the pitch was
 * eleven identical holes and the sheet was 661 names: a drawer could not help, because
 * it had no idea what you were trying to fill. Now a slot carries a detailed role
 * (`lib/game/lineup.ts`), tapping it SELECTS that position, and the drawer opens already
 * knowing it — so "who could play here" becomes a question the screen can answer instead
 * of a list you scroll.
 *
 * **What the drawer may and may not claim.** Our positions are the four the sources
 * state — `GK / DF / MF / FW` — and the slot's role is mapped DOWN to the ones it
 * accepts. `lib/xi/roles.ts` holds that reasoning and it is the integrity question of
 * this gate: saying "this slot wants a defender" is a fact about a formation we invented;
 * saying "this man was a right back" would be a fact about a person that no source here
 * states. The fit answer is therefore coarse on purpose, and a man the archive cannot
 * place is shown as unplaced rather than filtered away.
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
 * **And a man with two spells can be picked as either of them** (19.9.2026). The
 * versions are derived from the squad table's own runs of consecutive seasons, never
 * from an era typed beside a name; 109 of the roster have more than one, and everybody
 * else gets no chooser at all rather than a manufactured second self.
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
 * out of the same roster, nothing is offered, nothing is scored, and the share card
 * says in its own words that it is one man's opinion.
 *
 * **The formations and the drawer serve both tabs, and no scoring leaks in with them.**
 * Grouping by documented position is not a judgement of a player — a bad right back is
 * still a right back — but the drawer says so in its own words on the worst sheet
 * (`xi.worst.drawer`) rather than leaving the reader to work out that "fit" is about
 * where a man played and never about how well.
 *
 * The two tabs share ONE roster sheet and one pitch (rule 24 — one ranking, no second
 * copy); the only thing that differs between them is which sheet is being saved and
 * what the card says.
 */

/** One tab's whole state. Everything the store keeps, plus the rows themselves. */
type Sheet = {
  formation: Formation
  /** slot id → the man standing there */
  picks: Record<string, RosterEntry>
  /** slot id → which of his spells was chosen. Absent where he has only one. */
  versions: Record<string, string>
  /** the slot wearing the armband */
  captain: string | null
  twelfth: RosterEntry | null
  cut: RosterEntry | null
  /** roster slugs still being argued over */
  shortlist: RosterEntry[]
}

/** What a removal has to remember in order to be undoable. */
type Undo = { slotId: string; entry: RosterEntry; versionId: string | undefined }

function emptySheet(formation: Formation): Sheet {
  return {
    formation,
    picks: {},
    versions: {},
    captain: null,
    twelfth: null,
    cut: null,
    shortlist: [],
  }
}

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
  const [sheets, setSheets] = useState<Record<XITab, Sheet>>({
    best: emptySheet(formations[0] as Formation),
    worst: emptySheet(formations[0] as Formation),
  })
  /** the slot the drawer is aimed at — the whole "position first" mechanic */
  const [selected, setSelected] = useState<string | null>(null)
  const [drawer, setDrawer] = useState<'slot' | 'twelfth' | 'cut' | null>(null)
  const [swapFrom, setSwapFrom] = useState<string | null>(null)
  const [order, setOrder] = useState<ScoutOrder>('fit')
  const [fitOnly, setFitOnly] = useState(true)
  const [undo, setUndo] = useState<Undo | null>(null)
  const [poster, setPoster] = useState(false)
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
      setSheets((current) => {
        const next = { ...current }
        for (const key of XI_TABS) {
          const saved = restore(book[key], formations)
          if (!saved) continue
          const picks: Record<string, RosterEntry> = {}
          for (const [slot, slug] of Object.entries(saved.picks)) {
            const entry = bySlug.get(slug)
            if (entry) picks[slot] = entry
          }
          // A version whose man was dropped on read goes with him, and so does an
          // armband on a slot that no longer holds anybody.
          const versions: Record<string, string> = {}
          for (const [slot, id] of Object.entries(saved.versions)) {
            if (picks[slot]) versions[slot] = id
          }
          next[key] = {
            formation: saved.formation,
            picks,
            versions,
            captain: saved.captain !== null && picks[saved.captain] ? saved.captain : null,
            twelfth: saved.twelfth ? (bySlug.get(saved.twelfth) ?? null) : null,
            cut: saved.cut ? (bySlug.get(saved.cut) ?? null) : null,
            shortlist: saved.shortlist
              .map((slug) => bySlug.get(slug))
              .filter((entry): entry is RosterEntry => entry !== undefined),
          }
        }
        return next
      })
      setReady(true)
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read once, on mount
  }, [])

  const sheet = sheets[tab]

  useEffect(() => {
    if (!ready) return
    void store.save(tab, {
      formation: sheet.formation.name,
      picks: Object.fromEntries(
        Object.entries(sheet.picks).map(([slot, entry]) => [slot, entry.slug]),
      ),
      versions: sheet.versions,
      ...(sheet.captain !== null ? { captain: sheet.captain } : {}),
      ...(sheet.twelfth ? { twelfth: sheet.twelfth.slug } : {}),
      ...(sheet.cut ? { cut: sheet.cut.slug } : {}),
      shortlist: sheet.shortlist.map((entry) => entry.slug),
    })
  }, [ready, tab, sheet, store])

  const chosen = Object.keys(sheet.picks).length

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
    () => new Set(Object.values(sheet.picks).map((entry) => entry.slug)),
    [sheet.picks],
  )
  const shortlisted = useMemo(
    () => new Set(sheet.shortlist.map((entry) => entry.slug)),
    [sheet.shortlist],
  )

  const patch = useCallback(
    (change: (current: Sheet) => Sheet) => {
      setSheets((all) => ({ ...all, [tab]: change(all[tab]) }))
    },
    [tab],
  )

  /* ------------------------------------------------------------- the mechanics */

  const slotById = useMemo(
    () => new Map(sheet.formation.slots.map((slot) => [slot.slotId, slot])),
    [sheet.formation],
  )
  const openSlot = selected === null ? null : (slotById.get(selected) ?? null)

  function tapSlot(slot: PitchSlot) {
    // A swap in progress owns the next tap: the second slot is the destination, and
    // tapping the same one again is how you change your mind.
    if (swapFrom !== null) {
      const from = swapFrom
      setSwapFrom(null)
      setSelected(slot.slotId)
      if (from === slot.slotId) return
      patch((current) => {
        const picks = { ...current.picks }
        const versions = { ...current.versions }
        const there = picks[slot.slotId]
        const here = picks[from]
        if (here) picks[slot.slotId] = here
        else delete picks[slot.slotId]
        if (there) picks[from] = there
        else delete picks[from]
        const versionHere = versions[from]
        const versionThere = versions[slot.slotId]
        if (versionHere) versions[slot.slotId] = versionHere
        else delete versions[slot.slotId]
        if (versionThere) versions[from] = versionThere
        else delete versions[from]
        const captain =
          current.captain === from
            ? slot.slotId
            : current.captain === slot.slotId
              ? from
              : current.captain
        return { ...current, picks, versions, captain }
      })
      return
    }
    setSelected(slot.slotId)
    // One tap gets you to the drawer when the shirt is empty, because two taps to reach
    // a list on a phone is the difference between a tool and a chore. A shirt that is
    // already filled opens the slot's own strip instead — tapping a man you placed used
    // to delete him, which is a destructive default nobody asked for.
    if (!sheet.picks[slot.slotId]) setDrawer('slot')
  }

  function place(entry: RosterEntry) {
    if (drawer === 'twelfth') {
      patch((current) => ({ ...current, twelfth: entry }))
      setDrawer(null)
      return
    }
    if (drawer === 'cut') {
      patch((current) => ({ ...current, cut: entry }))
      setDrawer(null)
      return
    }
    if (selected === null) return
    const slotId = selected
    patch((current) => {
      const versions = { ...current.versions }
      const fallback = shirts.defaultVersion[entry.slug]
      if (fallback) versions[slotId] = fallback
      else delete versions[slotId]
      return { ...current, picks: { ...current.picks, [slotId]: entry }, versions }
    })
    setDrawer(null)
  }

  function remove(slotId: string) {
    const entry = sheet.picks[slotId]
    if (!entry) return
    setUndo({ slotId, entry, versionId: sheet.versions[slotId] })
    patch((current) => {
      const picks = { ...current.picks }
      const versions = { ...current.versions }
      delete picks[slotId]
      delete versions[slotId]
      return {
        ...current,
        picks,
        versions,
        captain: current.captain === slotId ? null : current.captain,
      }
    })
  }

  function undoRemoval() {
    if (!undo) return
    const { slotId, entry, versionId } = undo
    patch((current) => {
      const versions = { ...current.versions }
      if (versionId) versions[slotId] = versionId
      return { ...current, picks: { ...current.picks, [slotId]: entry }, versions }
    })
    setUndo(null)
  }

  function toggleShortlist(slug: string) {
    const entry = bySlug.get(slug)
    if (!entry) return
    patch((current) => ({
      ...current,
      shortlist: current.shortlist.some((row) => row.slug === slug)
        ? current.shortlist.filter((row) => row.slug !== slug)
        : [...current.shortlist, entry],
    }))
  }

  /* --------------------------------------------------------------- the shirts */

  /** Which season's shirt this slot's man wears — his chosen spell's, or his own. */
  const seasonOf = useCallback(
    (slotId: string): string | null => {
      const entry = sheet.picks[slotId]
      if (!entry) return null
      const list = shirts.versions[entry.slug]
      const chosenId = sheet.versions[slotId]
      if (list && chosenId) {
        const found = list.find((version) => version.id === chosenId)
        if (found) return found.seasonLabel
      }
      return shirts.bySlug[entry.slug]?.seasonLabel ?? null
    },
    [sheet.picks, sheet.versions, shirts],
  )

  /** The first year of the spell this pick stands for — the DNA's decade comes from it. */
  const fromYearOf = useCallback(
    (slotId: string, entry: RosterEntry): number | null => {
      const list = shirts.versions[entry.slug]
      const chosenId = sheet.versions[slotId]
      if (list && chosenId) {
        const found = list.find((version) => version.id === chosenId)
        if (found) return found.fromYear
      }
      return entry.fromYear ?? null
    },
    [sheet.versions, shirts.versions],
  )

  const dna = useMemo(
    () =>
      xiDna(
        Object.entries(sheet.picks).map(([slotId, entry]) => ({
          fromYear: fromYearOf(slotId, entry),
          origin: entry.origin ?? null,
        })),
        sheet.formation.name,
      ),
    [sheet.picks, sheet.formation.name, fromYearOf],
  )

  const worst = tab === 'worst'
  const occupant = selected === null ? undefined : sheet.picks[selected]
  const slotVersions = occupant ? (shirts.versions[occupant.slug] ?? []) : []

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
            onClick={() => {
              setTab(option)
              setSelected(null)
              setSwapFrom(null)
              setUndo(null)
            }}
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
              onClick={() => {
                setSelected(null)
                setSwapFrom(null)
                // The picks move with the shape where the slot ids agree and are
                // dropped where they do not — the same promise `restore` makes, for the
                // same reason: a defender who wakes up on the wing because the shape
                // changed is worse than an empty slot.
                patch((current) => {
                  const slots = new Set(option.slots.map((slot) => slot.slotId))
                  const picks: Record<string, RosterEntry> = {}
                  const versions: Record<string, string> = {}
                  for (const [slotId, entry] of Object.entries(current.picks)) {
                    if (!slots.has(slotId)) continue
                    picks[slotId] = entry
                    const version = current.versions[slotId]
                    if (version) versions[slotId] = version
                  }
                  return {
                    ...current,
                    formation: option,
                    picks,
                    versions,
                    captain:
                      current.captain !== null && picks[current.captain]
                        ? current.captain
                        : null,
                  }
                })
              }}
              aria-pressed={sheet.formation.name === option.name}
              className={`min-h-tap border-hair px-3 font-mono text-step--1 tabular-nums transition-transform duration-press ease-stamp active:scale-[.95] motion-reduce:transition-none ${
                sheet.formation.name === option.name
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

        {sheet.formation.slots.map((slot) => {
          const entry = sheet.picks[slot.slotId]
          const seasonLabel = seasonOf(slot.slotId)
          const season = seasonLabel ? shirts.seasons[seasonLabel] : undefined
          const live = selected === slot.slotId
          return (
            <button
              key={slot.slotId}
              type="button"
              onClick={() => tapSlot(slot)}
              aria-pressed={live}
              aria-label={entry ? `${slot.roleHe} — ${entry.nameHe}` : slot.roleHe}
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
                  <span
                    className={`block max-w-[104px] border-hair bg-sheet px-2 py-1 font-body text-[11px] font-extrabold leading-tight text-ink ${
                      live ? 'border-rule border-red' : 'border-ink'
                    }`}
                  >
                    {sheet.captain === slot.slotId && (
                      <span className="me-1 border-hair border-ink px-1 font-mono text-[8px] leading-none">
                        <bdi dir="ltr">C</bdi>
                      </span>
                    )}
                    {entry.nameHe}
                  </span>
                  {season && (
                    <span className="block border-hair border-ink/30 bg-sheet/90 px-1 font-mono text-[9px] leading-tight text-muted">
                      <Num>{season.seasonLabel}</Num>
                    </span>
                  )}
                </span>
              ) : (
                <span
                  className={`block border-hair border-dashed bg-ink/25 px-2 py-1 font-body text-[10px] leading-tight text-sheet ${
                    live ? 'border-rule border-red' : 'border-sheet/80'
                  }`}
                >
                  {slot.roleHe}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* the tip line — what the pitch is asking for right now, never a blank screen */}
      <p className="mt-2 border-hair border-ink/30 bg-sheet px-3 py-2 font-body text-[12px] leading-snug text-ink">
        {swapFrom !== null
          ? t('xi.tip.swap')
          : openSlot
            ? t('xi.tip.selected', { role: openSlot.roleHe })
            : t('xi.tip.pick')}
      </p>

      {/* ---------------------------------------------------- the selected slot */}
      {openSlot && (
        <div className="mt-2 border-hair border-ink bg-sheet p-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-sign text-step-0 text-ink">{openSlot.roleHe}</p>
            <p className="font-mono text-[10.5px] text-muted">
              <bdi dir="ltr">{openSlot.role}</bdi>
            </p>
          </div>

          {occupant ? (
            <>
              <p className="mt-1 font-body text-step--1 text-ink">{occupant.nameHe}</p>

              {/*
                The versions. Only a man the squad table gives more than one spell has
                anything here — a chooser with one button would be teaching the reader a
                fact nobody stated (rule 11). The years are the run's own; the shirt
                follows, and a spell the archive cannot dress says so instead of
                borrowing a shirt from the other one.
              */}
              {slotVersions.length > 1 && (
                <div className="mt-2">
                  <p className="font-body text-[10.5px] font-extrabold text-muted">
                    {t('xi.version.title')}
                  </p>
                  <div className="-mx-0.5 mt-1 flex gap-1 overflow-x-auto px-0.5 pb-1">
                    {slotVersions.map((version) => {
                      const live = sheet.versions[openSlot.slotId] === version.id
                      return (
                        <button
                          key={version.id}
                          type="button"
                          aria-pressed={live}
                          onClick={() =>
                            patch((current) => ({
                              ...current,
                              versions: {
                                ...current.versions,
                                [openSlot.slotId]: version.id,
                              },
                            }))
                          }
                          className={`flex min-h-tap shrink-0 flex-col items-center justify-center border-hair px-2.5 py-1 leading-tight transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none ${
                            live ? 'border-ink bg-ink text-paper' : 'border-ink/40 bg-paper text-ink'
                          }`}
                        >
                          <span className="font-mono text-[11px] tabular-nums">
                            <bdi dir="ltr">{`${version.fromYear}–${version.toYear}`}</bdi>
                          </span>
                          <span
                            className={`font-body text-[9px] ${live ? 'text-concrete' : 'text-muted'}`}
                          >
                            {version.seasonLabel
                              ? t('xi.version.shirt', { season: version.seasonLabel })
                              : t('xi.version.noShirt')}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="mt-2 flex flex-wrap gap-1.5">
                <SlotButton
                  label={
                    sheet.captain === openSlot.slotId ? t('xi.slot.captainOff') : t('xi.slot.captain')
                  }
                  live={sheet.captain === openSlot.slotId}
                  onClick={() =>
                    patch((current) => ({
                      ...current,
                      captain: current.captain === openSlot.slotId ? null : openSlot.slotId,
                    }))
                  }
                />
                <SlotButton label={t('xi.slot.replace')} onClick={() => setDrawer('slot')} />
                <SlotButton
                  label={swapFrom === openSlot.slotId ? t('xi.slot.swapping') : t('xi.slot.swap')}
                  live={swapFrom === openSlot.slotId}
                  onClick={() =>
                    setSwapFrom(swapFrom === openSlot.slotId ? null : openSlot.slotId)
                  }
                />
                <SlotButton label={t('xi.slot.remove')} onClick={() => remove(openSlot.slotId)} />
              </div>
            </>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <SlotButton label={t('xi.slot.open')} onClick={() => setDrawer('slot')} />
            </div>
          )}
        </div>
      )}

      {/*
        Undo, where the mechanic needs it. Removing a man is one tap and putting him back
        used to mean finding him again in 661 names — so the removal carries its own way
        back, with the version he was wearing, until the next one replaces it.
      */}
      {undo && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-hair border-ink/40 bg-paper px-3 py-2">
          <p className="font-body text-[11.5px] text-ink">
            {t('xi.slot.removed', { name: undo.entry.nameHe })}
          </p>
          <div className="flex gap-1.5">
            <SlotButton label={t('xi.slot.undo')} onClick={undoRemoval} />
            <SlotButton label={t('xi.slot.undoDismiss')} onClick={() => setUndo(null)} />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------- the shortlist */}
      <section className="mt-3 border-hair border-ink/40 bg-sheet p-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-sign text-step--1 text-ink">{t('xi.shortlist.title')}</h3>
          <span className="font-mono text-[10.5px] text-muted">
            <Num>{sheet.shortlist.length}</Num>
          </span>
        </div>
        {sheet.shortlist.length === 0 ? (
          <p className="mt-1 font-body text-[11px] leading-snug text-muted">
            {t('xi.shortlist.empty')}
          </p>
        ) : (
          <ul className="-mx-0.5 mt-2 flex gap-1.5 overflow-x-auto px-0.5 pb-1">
            {sheet.shortlist.map((entry) => (
              <li key={entry.slug} className="flex shrink-0 items-stretch">
                <button
                  type="button"
                  disabled={selected === null || takenSlugs.has(entry.slug)}
                  onClick={() => place(entry)}
                  className="flex min-h-tap items-center border-hair border-ink/40 bg-paper px-2.5 font-body text-[11.5px] font-extrabold text-ink disabled:opacity-40"
                >
                  <span aria-hidden="true" className="me-1">
                    ★
                  </span>
                  {entry.familyHe}
                </button>
                <button
                  type="button"
                  onClick={() => toggleShortlist(entry.slug)}
                  aria-label={t('xi.shortlist.drop', { name: entry.nameHe })}
                  className="min-h-tap border-hair border-s-0 border-ink/40 bg-paper px-2 font-body text-[13px] leading-none text-muted"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------- the twelfth and the cut */}
      <section className="mt-2 grid gap-2 sm:grid-cols-2">
        <BenchCard
          title={t('xi.bench.twelfth')}
          note={t('xi.bench.twelfth.note')}
          entry={sheet.twelfth}
          onOpen={() => setDrawer('twelfth')}
          onClear={() => patch((current) => ({ ...current, twelfth: null }))}
        />
        <BenchCard
          title={t('xi.bench.cut')}
          note={t('xi.bench.cut.note')}
          entry={sheet.cut}
          onOpen={() => setDrawer('cut')}
          onClear={() => patch((current) => ({ ...current, cut: null }))}
        />
      </section>

      {/* ------------------------------------------------------------ the poster */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setPoster(true)}
          disabled={chosen === 0}
          className="min-h-tap border-rule border-ink bg-ink px-3 font-sign text-step--1 text-paper transition-transform duration-press ease-stamp active:scale-[.97] disabled:opacity-40 motion-reduce:transition-none"
        >
          {t('xi.poster.open')}
        </button>
        <p className="font-body text-[11px] text-muted">
          {t('xi.dna.line', {
            spread: String(dna.spread),
            israeli: String(dna.origin.israeli),
            foreign: String(dna.origin.foreign),
          })}
        </p>
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
      <p className="mt-1 font-body text-[11px] text-muted">
        {t('xi.version.coverage', { n: String(shirts.withVersions) })}
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
          eyebrow: sheet.formation.name,
          hero: worst ? t('xi.tab.worst') : t('screen.xi.title'),
          xi: sheet.formation.slots
            .map((slot) => {
              const entry = sheet.picks[slot.slotId]
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
      {drawer && (
        <RosterSheet
          title={
            drawer === 'twelfth'
              ? t('xi.bench.twelfth')
              : drawer === 'cut'
                ? t('xi.bench.cut')
                : (openSlot?.roleHe ?? t('xi.tip.pick'))
          }
          roster={roster}
          taken={takenSlugs}
          onPick={place}
          onClose={() => setDrawer(null)}
          scout={
            drawer === 'slot' && openSlot
              ? {
                  role: openSlot.role,
                  roleHe: openSlot.roleHe,
                  order,
                  onOrder: setOrder,
                  fitOnly,
                  onFitOnly: setFitOnly,
                  shortlist: shortlisted,
                  onShortlist: toggleShortlist,
                }
              : undefined
          }
          footer={
            drawer === 'slot' && worst ? (
              <p className="mt-2 border-hair border-ink/40 bg-paper px-3 py-2 font-body text-[11px] leading-snug text-ink">
                {t('xi.worst.drawer')}
              </p>
            ) : undefined
          }
        />
      )}

      {poster && (
        <Poster
          dna={dna}
          captainHe={sheet.captain ? (sheet.picks[sheet.captain]?.nameHe ?? null) : null}
          twelfthHe={sheet.twelfth?.nameHe ?? null}
          cutHe={sheet.cut?.nameHe ?? null}
          worst={worst}
          onClose={() => setPoster(false)}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ the parts */

function SlotButton({
  label,
  onClick,
  live = false,
}: {
  label: string
  onClick: () => void
  live?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={live}
      className={`min-h-tap border-hair px-2.5 font-body text-[11.5px] font-extrabold leading-none transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none ${
        live ? 'border-ink bg-ink text-paper' : 'border-ink/40 bg-paper text-ink'
      }`}
    >
      {label}
    </button>
  )
}

/**
 * שחקן 12 והאחרון שנחתך — the two decisions that are not on the pitch.
 *
 * They come out of the same roster sheet as everybody else and carry no grade. The
 * twelfth man is an affectionate promotion; the last man cut is the argument you keep
 * having with yourself, and naming him is the most honest thing an all-time eleven can
 * do about the ten men it left out.
 */
function BenchCard({
  title,
  note,
  entry,
  onOpen,
  onClear,
}: {
  title: string
  note: string
  entry: RosterEntry | null
  onOpen: () => void
  onClear: () => void
}) {
  return (
    <div className="border-hair border-ink/40 bg-sheet p-3">
      <h3 className="font-sign text-step--1 text-ink">{title}</h3>
      <p className="mt-0.5 font-body text-[10.5px] leading-snug text-muted">{note}</p>
      <p className="mt-1.5 font-body text-step--1 text-ink">
        {entry ? entry.nameHe : t('xi.bench.none')}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <SlotButton label={entry ? t('xi.bench.change') : t('xi.bench.choose')} onClick={onOpen} />
        {entry && <SlotButton label={t('xi.bench.clear')} onClick={onClear} />}
      </div>
    </div>
  )
}

/**
 * הפוסטר — what the eleven is made of, and nothing about how good it is.
 *
 * A dialog rather than a screen of its own, because a gate that navigates away from the
 * thing you just made has taken it off the table (rule 21 — a run is a run-on sentence).
 * It closes on Escape, on the plate and on its own button; nothing here waits for
 * anything, and nothing plays before it appears.
 *
 * `z-[60]`, because the tab bar is `z-50` (rule 33).
 */
function Poster({
  dna,
  captainHe,
  twelfthHe,
  cutHe,
  worst,
  onClose,
}: {
  dna: ReturnType<typeof xiDna>
  captainHe: string | null
  twelfthHe: string | null
  cutHe: string | null
  worst: boolean
  onClose: () => void
}) {
  const dialogRef = useDialog<HTMLDivElement>(onClose)
  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-[60] flex flex-col justify-end bg-ink/70 outline-none"
      role="dialog"
      aria-modal="true"
      aria-label={t('xi.poster.title')}
    >
      <button type="button" aria-label={t('xi.close')} className="flex-1" onClick={onClose} />
      <div className="max-h-[86vh] animate-slam overflow-y-auto border-t-rule border-ink bg-sheet px-4 pb-[calc(var(--tap)+2rem+env(safe-area-inset-bottom))] pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-step-1 text-ink">{t('xi.poster.title')}</p>
          <button
            type="button"
            onClick={onClose}
            className="min-h-tap px-2 font-body text-[12px] font-extrabold text-red"
          >
            {t('xi.close')}
          </button>
        </div>

        <p className="mt-1 font-body text-[11.5px] leading-snug text-muted">
          {worst ? t('xi.poster.note.worst') : t('xi.poster.note')}
        </p>

        <dl className="mt-3 border-hair border-ink/40">
          <DnaRow label={t('xi.dna.formation')} value={dna.formation} latin />
          <DnaRow label={t('xi.dna.picked')} value={`${dna.picked}/11`} latin />
          {dna.decades.map((row) => (
            <DnaRow
              key={row.decade}
              label={t('xi.dna.decade', { n: String(row.decade) })}
              value={String(row.count)}
              latin
            />
          ))}
          {dna.undated > 0 && (
            <DnaRow label={t('xi.dna.undated')} value={String(dna.undated)} latin />
          )}
          <DnaRow label={t('xi.dna.spread')} value={String(dna.spread)} latin />
          <DnaRow label={t('roster.origin.israeli')} value={String(dna.origin.israeli)} latin />
          <DnaRow label={t('roster.origin.foreign')} value={String(dna.origin.foreign)} latin />
          {dna.origin.unknown > 0 && (
            <DnaRow label={t('xi.dna.unknownOrigin')} value={String(dna.origin.unknown)} latin />
          )}
          <DnaRow label={t('xi.dna.captain')} value={captainHe ?? t('xi.bench.none')} />
          <DnaRow label={t('xi.bench.twelfth')} value={twelfthHe ?? t('xi.bench.none')} />
          <DnaRow label={t('xi.bench.cut')} value={cutHe ?? t('xi.bench.none')} />
        </dl>

        <p className="mt-2 font-body text-[10.5px] leading-snug text-muted">{t('xi.dna.note')}</p>
      </div>
    </div>
  )
}

function DnaRow({ label, value, latin = false }: { label: string; value: string; latin?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b-hair border-ink/20 px-3 py-2 last:border-b-0">
      <dt className="font-body text-[12px] text-muted">{label}</dt>
      <dd className="font-sign text-step--1 text-ink">{latin ? <Num>{value}</Num> : value}</dd>
    </div>
  )
}
