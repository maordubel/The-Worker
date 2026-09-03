'use client'

import { Num } from '@/components/ui/Num'
import { t } from '@/lib/i18n'
import { ITEM_ART } from '@/lib/life/content/chapter1986'
import { artUrl } from '@/lib/life/runtime/art'
import type { LifeSnapshot } from '@/lib/life/runtime/game'
import type { Band } from '@/lib/life/profile'

/**
 * התיק — the profile screen, and the one screen in the game that describes the player.
 *
 * Brief §33 asks for a premium version of this and then, in the same breath, forbids the
 * obvious way to build one: **no generic progress bars.** That prohibition is the whole
 * design brief, because a bar is not a style decision — it is a promise that the thing it
 * measures can be filled, and the moment a player believes courage can be filled they
 * stop making decisions and start farming one.
 *
 * So nothing here is a bar and nothing here is a number.
 *
 *  · **The Red Heart is set, not plotted.** Each pull the child actually feels is a word
 *    printed at a size that says how much: כדורגל large, היציע medium, לזכור small. It
 *    reads as a poster of a person rather than as a chart of one, it is unmistakably this
 *    game's own language, and a word cannot be "maxed".
 *  · **A relationship is a distance**, drawn as a printed rule with the person at one end
 *    and אתה at the other and a mark placed along it — plus a vermilion slash where there
 *    is friction, because "close and angry" is a real state and one number cannot say it.
 *  · **Wellbeing and personality are sentences.** `lib/life/profile.ts` owns the
 *    translation; this file never sees a value it could accidentally render.
 *
 * All of it is RTL, all of it is logical properties, radius 0 and no shadow — this is
 * the same printed sheet the rest of the product is set on, not a game HUD pasted over it.
 */

const HEART_TYPE: Record<Band, string> = {
  0: 'hidden',
  1: 'text-[13px] text-concrete',
  2: 'text-[19px] text-sheet',
  3: 'text-[27px] text-red',
}

function Section({ titleHe, children }: { titleHe: string; children: React.ReactNode }) {
  return (
    <section className="border-t-hair border-concrete/25 pt-4">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-concrete">
        <bdi>{titleHe}</bdi>
      </h3>
      <div className="mt-2.5">{children}</div>
    </section>
  )
}

/** A person on a line, at a distance from you, with or without a slash through it. */
function Bond({
  nameHe,
  lineHe,
  close,
  friction,
}: {
  nameHe: string
  lineHe: string
  close: Band
  friction: Band
}) {
  // 0 is arm's length, 3 is standing next to you. The mark is placed as a percentage of
  // the rule's own length, which is what keeps it honest on every screen width.
  const position = [12, 38, 64, 88][close] ?? 12
  return (
    <div className="py-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-[15px] leading-none text-sheet">
          <bdi>{nameHe}</bdi>
        </p>
        <p className="font-body text-[11px] leading-none text-concrete">
          <bdi>{lineHe}</bdi>
        </p>
      </div>
      <div className="relative mt-2 h-[14px]">
        <div className="absolute inset-x-0 top-[6px] h-[1px] bg-concrete/40" aria-hidden="true" />
        <div
          className="absolute top-0 h-[13px] w-[3px] bg-red"
          style={{ insetInlineStart: `${position}%` }}
          aria-hidden="true"
        />
        <span className="absolute top-[9px] font-mono text-[8px] leading-none text-concrete/70" style={{ insetInlineEnd: 0 }}>
          {t('life.profile.you')}
        </span>
        {friction >= 2 && (
          <div
            className="absolute top-[-1px] h-[16px] w-[2px] rotate-[24deg] bg-red"
            style={{ insetInlineStart: `${Math.min(94, position + 6)}%` }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  )
}

export function ProfileCard({ snapshot, onClose }: { snapshot: LifeSnapshot; onClose: () => void }) {
  const { profile, taken, missed } = snapshot

  return (
    <div role="dialog" className="pointer-events-auto absolute inset-0 z-[60] flex items-stretch justify-center bg-ink/90 p-gutter" aria-modal="true">
      <div className="max-h-full w-full max-w-md overflow-y-auto border-rule border-sheet bg-ink">
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            <div className="h-[6px] w-14 bg-red" aria-hidden="true" />
            <h2 className="mt-3 font-display text-step-2 leading-none text-sheet">
              <bdi>{profile.nameHe}</bdi>
            </h2>
            <p className="mt-1.5 font-mono text-[11px] leading-none tabular-nums text-concrete">
              {t('life.profile.age', { n: String(profile.age) })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-tap items-center border-hair border-concrete/50 px-3 font-body text-[11px] text-sheet transition-colors duration-press active:bg-red motion-reduce:transition-none"
          >
            {t('life.profile.close')}
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 pb-6 pt-5">
          {/* הלב האדום — the identity, set as type. */}
          <Section titleHe={t('life.profile.heart')}>
            {profile.redHeart.length === 0 ? (
              <p className="font-body text-[13px] leading-relaxed text-concrete">
                <bdi>{t('life.profile.heartNone')}</bdi>
              </p>
            ) : (
              <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {profile.redHeart.map((entry) => (
                  <span key={entry.key} className={`font-display leading-none ${HEART_TYPE[entry.band]}`}>
                    <bdi>{entry.labelHe}</bdi>
                  </span>
                ))}
              </p>
            )}
            <p className="mt-3 border-t-hair border-red/40 pt-2 font-body text-[12px] leading-relaxed text-sheet">
              <bdi>{profile.pureLove.readingHe}</bdi>
            </p>
            {profile.pureLove.evidenceHe.length > 0 && (
              <p className="mt-1 font-mono text-[10px] leading-relaxed text-concrete">
                <bdi>{profile.pureLove.evidenceHe.join(' · ')}</bdi>
              </p>
            )}
          </Section>

          {/* איך אתה — three sentences, never six numbers. */}
          <Section titleHe={t('life.profile.state')}>
            <p className="font-body text-[14px] leading-relaxed text-sheet">
              <bdi>{profile.wellbeing.length > 0 ? profile.wellbeing.join(' · ') : t('life.profile.none')}</bdi>
            </p>
          </Section>

          <Section titleHe={t('life.profile.who')}>
            <p className="font-body text-[14px] leading-relaxed text-sheet">
              <bdi>
                {profile.personality.length > 0 ? profile.personality.join(' · ') : t('life.profile.whoNone')}
              </bdi>
            </p>
          </Section>

          {/* אנשים — a distance, not a percentage. */}
          <Section titleHe={t('life.profile.people')}>
            {profile.relationships.length === 0 ? (
              <p className="font-body text-[13px] leading-relaxed text-concrete">
                <bdi>{t('life.profile.peopleNone')}</bdi>
              </p>
            ) : (
              <div className="divide-y divide-concrete/15">
                {profile.relationships.map((entry) => (
                  <Bond
                    key={entry.who}
                    nameHe={entry.nameHe}
                    lineHe={entry.lineHe}
                    close={entry.close}
                    friction={entry.friction}
                  />
                ))}
              </div>
            )}
          </Section>

          {/* היום הזה — what you did, and what the afternoon took away. */}
          <Section titleHe={t('life.profile.day')}>
            <dl className="flex flex-col gap-2">
              <div className="flex items-baseline gap-2">
                <dt className="shrink-0 font-mono text-[10px] text-concrete">{t('life.profile.taken')}</dt>
                <dd className="font-body text-[13px] leading-snug text-sheet">
                  <bdi>{taken.length > 0 ? taken.join(' · ') : t('life.profile.none')}</bdi>
                </dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="shrink-0 font-mono text-[10px] text-concrete">{t('life.profile.missed')}</dt>
                <dd className="font-body text-[13px] leading-snug text-red">
                  <bdi>{missed.length > 0 ? missed.join(' · ') : t('life.profile.none')}</bdi>
                </dd>
              </div>
            </dl>
          </Section>

          {/* הקופסה — the objects a life keeps. */}
          <Section titleHe={t('life.profile.box')}>
            {snapshot.state.redBox.length === 0 ? (
              <p className="font-body text-[13px] leading-relaxed text-concrete">
                <bdi>{t('life.profile.boxEmpty')}</bdi>
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {snapshot.state.redBox.map((item) => {
                  /**
                   * A display case, not a line item.
                   *
                   * The box was a list of Hebrew nouns on a card, and §50 is entirely
                   * about the difference between a noun and an object: "צעיף" is a
                   * receipt, a striped scarf on a lit shelf is a memory. The shelf runs
                   * the full width because half of these things are long and thin — a
                   * scarf, a folded page — and a thumbnail turns them into a smudge.
                   */
                  const art = ITEM_ART[item.item]
                  return (
                    <li key={item.id} className="border-hair border-red/60 bg-red/10">
                      {art && (
                        <span className="flex h-[86px] items-center justify-center border-b-hair border-red/40 bg-sheet/10 px-3 py-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={artUrl(art)}
                            alt=""
                            aria-hidden="true"
                            className="max-h-full max-w-full object-contain"
                          />
                        </span>
                      )}
                      <span className="block px-3 py-2.5">
                        <p className="font-display text-[14px] leading-none text-sheet">
                          <bdi>{item.titleHe}</bdi>
                        </p>
                        {item.noteHe && (
                          <p className="mt-1.5 font-body text-[11px] leading-snug text-concrete">
                            <bdi>{item.noteHe}</bdi>
                          </p>
                        )}
                        <p className="mt-1.5 font-mono text-[9px] leading-none tabular-nums text-concrete/70">
                          <Num>{item.year}</Num>
                        </p>
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}
