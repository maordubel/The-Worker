import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { PlayerFinder } from './PlayerFinder'
import { Num } from '@/components/ui/Num'
import { ReportLink } from '@/components/ui/ReportLink'
import { Screen } from '@/components/ui/Screen'
import { GATES } from '@/lib/gates'
import { clubCounts, crestStages, honours, players, songbook } from '@/lib/club/wing'
import { t, type MessageKey } from '@/lib/i18n'
import { gateMetadata } from '@/lib/seo'

/**
 * ה-פועל — the club's own wing, and the third tab.
 *
 * Maor set the bottom bar as בלומפילד · אוסישקין · ה-פועל · המנוי שלך, and only three of
 * those existed. The ground is the gate plan, the hall is the memorial — and the CLUB
 * had no page at all. The 15.9.2026 audit named the same gap from the other end: the
 * archive is 1,604 sourced rows and the only way in was through a quiz.
 *
 * So this is the club, read rather than played, in four sections that answer the four
 * things a supporter asks:
 *
 *   · **הארון** — what we won, counted out of `trophies.json`, competition by
 *     competition, with the seasons printed rather than summarised. A runners-up line
 *     under each, because the finals we lost are part of the same record.
 *   · **הסמל** — nine documented stages of the badge, with Maor's own artwork where a
 *     variant exists and nothing at all where one does not. Rule 25: print it or leave
 *     the slot empty; a club crest is not a thing to approximate.
 *   · **השירים** — the terrace songs and the player songs, by title, tune and subject.
 *     No verse is printed anywhere (rule 12).
 *   · **השחקנים** — all 637, with the position/origin/decade filters Maor asked for,
 *     and an honest count of how few of them the archive can actually place.
 *
 * It ends by pointing at the gates, because the whole point of a front door is that it
 * leads somewhere: everything above is also something you can play.
 */

export const metadata: Metadata = gateMetadata('hapoel')

/** Which gates are about the club itself — the ones this page hands you on to. */
const PLAYABLE = ['/trivia', '/timeline', '/xi', '/kits', '/goal']

export default function HapoelPage() {
  const cupboard = honours()
  const crests = crestStages()
  const songs = songbook()
  const roster = players()
  const counts = clubCounts()
  const gates = GATES.filter((gate) => PLAYABLE.includes(gate.href.split('?')[0] ?? ''))

  return (
    <Screen title={t('screen.hapoel.title')} sub={t('screen.hapoel.sub')}>
      <p className="mt-stack max-w-prose font-body text-step-0 leading-relaxed text-ink">
        {t('hapoel.lede')}
      </p>

      {/* the five numbers, all counted */}
      <dl className="mt-4 grid grid-cols-3 border-rule border-ink sm:grid-cols-5">
        {[
          { k: 'hapoel.count.trophies' as MessageKey, v: counts.trophies },
          { k: 'hapoel.count.kits' as MessageKey, v: counts.kits },
          { k: 'hapoel.count.songs' as MessageKey, v: counts.songs },
          { k: 'hapoel.count.players' as MessageKey, v: roster.total },
          { k: 'hapoel.count.crests' as MessageKey, v: crests.length },
        ].map((stat, index) => (
          <div
            key={stat.k}
            className={`bg-sheet px-3 py-2.5 ${index > 0 ? 'border-s-hair border-ink/25' : ''}`}
          >
            <dd className="font-poster text-[22px] leading-none text-red">
              <Num>{stat.v}</Num>
            </dd>
            <dt className="mt-1 font-body text-[10px] leading-tight tracking-wide text-muted">
              {t(stat.k)}
            </dt>
          </div>
        ))}
      </dl>

      {/* ---------------------------------------------------------------- the cupboard */}
      <section className="mt-stack" aria-labelledby="club-honours">
        <div className="flex items-baseline justify-between gap-3 border-b-rule border-ink pb-1.5">
          <h2 id="club-honours" className="font-display text-step-2 leading-tight text-ink">
            {t('hapoel.honours')}
          </h2>
          <p className="font-latin text-[9px] font-bold tracking-[0.24em] text-sign" dir="ltr">
            HONOURS
          </p>
        </div>
        <p className="mt-2 max-w-prose font-body text-step--1 leading-relaxed text-muted">
          {t('hapoel.honoursLede')}
        </p>

        <ul className="mt-3">
          {cupboard.map((line) => (
            <li key={line.slug} className="border-b-hair border-ink/25 py-3">
              <div className="flex items-baseline gap-3">
                <span className="min-w-[2.4rem] shrink-0 font-poster text-[30px] leading-none text-red">
                  <Num>{line.won.length}</Num>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-sign text-step-1 leading-tight text-ink">{line.nameHe}</p>
                  {line.won.length > 0 && (
                    <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted">
                      <bdi>{line.won.join(' · ')}</bdi>
                    </p>
                  )}
                  {line.runnerUp.length > 0 && (
                    <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted">
                      <span className="font-body font-extrabold text-sign">
                        {t('hapoel.runnerUp')}
                      </span>{' '}
                      <bdi>{line.runnerUp.join(' · ')}</bdi>
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------------------------- the badge */}
      <section className="mt-stack" aria-labelledby="club-badge">
        <div className="flex items-baseline justify-between gap-3 border-b-rule border-ink pb-1.5">
          <h2 id="club-badge" className="font-display text-step-2 leading-tight text-ink">
            {t('hapoel.crests')}
          </h2>
          <p className="font-latin text-[9px] font-bold tracking-[0.24em] text-sign" dir="ltr">
            THE BADGE
          </p>
        </div>
        <p className="mt-2 max-w-prose font-body text-step--1 leading-relaxed text-muted">
          {t('hapoel.crestsLede')}
        </p>

        <ol className="mt-3 grid gap-2 sm:grid-cols-2">
          {crests.map((crest) => (
            <li
              key={`${crest.fromYear}-${crest.nameHe}`}
              className="flex gap-3 border-rule border-ink bg-sheet p-3"
            >
              <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center border-hair border-ink/30 bg-paper">
                {crest.imageKey ? (
                  // `unoptimized` for the same reason the badge is (rule 8): Next's
                  // re-encode subsamples chroma, and these are red marks on cream.
                  <Image
                    src={`/brand/crests/${crest.imageKey}.png`}
                    alt=""
                    aria-hidden="true"
                    width={50}
                    height={50}
                    unoptimized
                    className="max-h-[50px] w-auto"
                  />
                ) : (
                  <span className="font-mono text-[9px] leading-tight text-muted">
                    {t('hapoel.crestNone')}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] tabular-nums text-red">
                  <Num>{crest.toYear === null ? `${crest.fromYear}—` : `${crest.fromYear}—${crest.toYear}`}</Num>
                </p>
                <p className="mt-0.5 font-sign text-step-0 leading-tight text-ink">
                  {crest.nameHe}
                </p>
                {crest.changeHe && (
                  <p className="mt-1 font-body text-[11.5px] leading-snug text-muted">
                    {crest.changeHe}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------------------------- the songs */}
      <section className="mt-stack" aria-labelledby="club-songs">
        <div className="flex items-baseline justify-between gap-3 border-b-rule border-ink pb-1.5">
          <h2 id="club-songs" className="font-display text-step-2 leading-tight text-ink">
            {t('hapoel.songs')}
          </h2>
          <p className="font-latin text-[9px] font-bold tracking-[0.24em] text-sign" dir="ltr">
            THE SONGBOOK
          </p>
        </div>
        <p className="mt-2 max-w-prose font-body text-step--1 leading-relaxed text-muted">
          {t('hapoel.songsLede')}
        </p>

        {[
          { rows: songs.terrace, key: 'hapoel.songType.terrace' as MessageKey },
          { rows: songs.player, key: 'hapoel.songType.player' as MessageKey },
        ].map((group) =>
          group.rows.length === 0 ? null : (
            <div key={group.key} className="mt-3">
              <h3 className="font-body text-[11px] font-extrabold tracking-widest text-red">
                {t(group.key)} <span className="font-mono text-muted"><Num>{group.rows.length}</Num></span>
              </h3>
              <ul className="mt-1.5 grid gap-1 sm:grid-cols-2">
                {group.rows.map((song) => {
                  // A player song is often TITLED after the tune it borrows, so
                  // printing both read as the same words twice: "16 מלאו לנער ·
                  // ביברס נאתכו · על הלחן של 16 מלאו לנער". The tune line appears
                  // only when it says something the title does not.
                  const tune =
                    song.originalTitle && !song.titleHe.includes(song.originalTitle)
                      ? song.originalTitle
                      : null
                  return (
                    <li key={song.slug} className="border-b-hair border-ink/20 py-1.5">
                      <p className="font-body text-step--1 leading-snug text-ink">
                        <bdi>{song.titleHe}</bdi>
                      </p>
                      {(song.personNameHe || tune) && (
                        <p className="font-mono text-[10.5px] leading-snug text-muted">
                          {song.personNameHe && <bdi>{song.personNameHe}</bdi>}
                          {song.personNameHe && tune && ' · '}
                          {tune && (
                            <>
                              {t('hapoel.songTune')} <bdi>{tune}</bdi>
                            </>
                          )}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ),
        )}
      </section>

      {/* ----------------------------------------------------------------- the players */}
      <section className="mt-stack" aria-labelledby="club-players">
        <div className="flex items-baseline justify-between gap-3 border-b-rule border-ink pb-1.5">
          <h2 id="club-players" className="font-display text-step-2 leading-tight text-ink">
            {t('hapoel.players')}
          </h2>
          <p className="font-latin text-[9px] font-bold tracking-[0.24em] text-sign" dir="ltr">
            EVERY NAME
          </p>
        </div>
        <PlayerFinder roster={roster} />
      </section>

      {/* ------------------------------------------------------------------- the gates */}
      <section className="mt-stack" aria-labelledby="club-gates">
        <div className="flex items-baseline justify-between gap-3 border-b-rule border-ink pb-1.5">
          <h2 id="club-gates" className="font-display text-step-2 leading-tight text-ink">
            {t('hapoel.gates')}
          </h2>
          <p className="font-latin text-[9px] font-bold tracking-[0.24em] text-sign" dir="ltr">
            PLAY IT
          </p>
        </div>
        <p className="mt-2 max-w-prose font-body text-step--1 leading-relaxed text-muted">
          {t('hapoel.gatesLede')}
        </p>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {gates.map((gate) => (
            <li key={gate.number}>
              <Link
                href={gate.href}
                className="flex min-h-tap flex-col justify-between border-rule border-ink bg-ink p-3 transition-transform duration-press ease-stamp active:scale-[.98] motion-reduce:transition-none"
              >
                <span className="font-poster text-[26px] leading-none text-red">
                  <Num>{gate.number}</Num>
                </span>
                <span className="mt-2 font-display text-[14px] leading-tight text-paper">
                  {t(gate.title)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <ReportLink />
    </Screen>
  )
}
