'use client'

import Image from 'next/image'
import { useState } from 'react'

import { Num } from '@/components/ui/Num'
import { KitShirt } from '@/components/kit/KitShirt'
import { Marks, Shelf, Tag, Thing } from '@/components/life/BagShelf'
import { t } from '@/lib/i18n'
import { artUrl } from '@/lib/life/runtime/art'
import type { LifeSnapshot } from '@/lib/life/runtime/game'
import {
  carriedReading,
  presenceReading,
  purseReading,
  redBoxReading,
  wardrobeReading,
  type Band,
  type PurseId,
  type SubscriptionReading,
} from '@/lib/life/profile'
import { cardForMemory, type ShareCard } from '@/lib/life/share'
import { ShareSheet } from '@/components/life/ShareSheet'
import { useDialog } from '@/components/ui/useDialog'

/**
 * התיק שלי — and the name is the specification.
 *
 * For four passes this screen was a character sheet wearing a bag's name. It printed the
 * Red Heart, wellbeing, personality, relationships and the afternoon's log — five good
 * answers to "who are you" — and then, at the very bottom, one shelf of objects. Maor
 * calls it התיק שלי, and a bag is **what you are carrying and what you kept**. Almost
 * none of that was on it.
 *
 * Six fields of `LifeState` were authored, folded, tested and invisible:
 *
 *  · `inventory` — what is in his hands RIGHT NOW. Cleared at `day.entered` on purpose
 *    (rule 68), which is exactly why a bag is where it belongs and the Red Box is not.
 *  · `savings`  — the tin under the bed. `agorot` is on the HUD; the tin was nowhere, in
 *    a chapter literally named after saving thirty shekels for a shirt.
 *  · `clothing` — the shirts. They survive every year by design and were visible in one
 *    place: the shop that sold them.
 *  · `presence` — inside, late, on the radio, in the army, on a coach north. Five
 *    different biographies of one afternoon, all recorded, none of them drawn.
 *  · `memories` — the parallel keepsake structure, carrying the `anchorId` that joins a
 *    stub to the day it was torn at. Read by the debug panel and by nothing else.
 *  · `RedBoxItem.rarity` — five words, authored, stored, weighted, never once printed.
 *
 * **The hard constraint is rule 46, restated as 63א on 15.9.2026.** Maor kept the numbers
 * on `GaugesSheet` and kept them off this card, in one sentence: *"הגיליון עונה 'כמה',
 * הכרטיס עונה 'מי אתה'."* So a bag that says "7 items, 340 ₪" is a failure however
 * handsome it is. Money is a word measured against what that decade's money buys. A count
 * is drawn as that many objects, or as marks, and never as a figure. Rarity is a word
 * about where a thing came from, and `common` gets no plate at all, because the moment
 * five rarities look like five tiers a player starts farming the fifth.
 *
 * **Two leaves, because they are two questions.** התיק is the default and it is the
 * objects; אני is the person the older sheet always was. Twelve sections on one scroll is
 * a screen nobody reaches the bottom of, and the split is not a compromise — it is the
 * same distinction `GaugesSheet` and this card already make, made once more, one level
 * down.
 *
 * All of it is RTL, all of it is logical properties, radius 0 and no shadow: the same
 * printed sheet the rest of the product is set on, not a game HUD pasted over it.
 */

const HEART_TYPE: Record<Band, string> = {
  0: 'hidden',
  1: 'text-[13px] text-concrete',
  2: 'text-[19px] text-sheet',
  3: 'text-[27px] text-red',
}

/** the two leaves of one bag */
type Leaf = 'bag' | 'me'

/**
 * הכיס והפחית — a purse is named, and what is in it is a sentence.
 *
 * The keys are literal so `tests/i18n.test.ts` can resolve them: a key built at runtime
 * cannot be checked statically and rule 32 is explicit that nobody should pretend it can.
 */
const purseLabel = (purse: PurseId): string => (purse === 'pocket' ? t('life.bag.pocket') : t('life.bag.tin'))

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

/** one leaf of the bag, as a plate you press */
function LeafTab({ live, onClick, children }: { live: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={live}
      className={`min-h-tap flex-1 border-hair px-3 py-2 font-sign text-[13px] leading-none transition-colors duration-press motion-reduce:transition-none ${
        live ? 'border-red bg-red text-sheet' : 'border-concrete/40 text-concrete'
      }`}
    >
      <bdi>{children}</bdi>
    </button>
  )
}

export function ProfileCard({
  snapshot,
  subscription,
  onClose,
}: {
  snapshot: LifeSnapshot
  /**
   * המנוי — the season subscription, and the one shelf this file does not own.
   *
   * The lead is building the system in the same session as this screen: a yearly purchase
   * at period-correct prices, and a run of consecutive seasons held. A season card is the
   * most literal possible answer to "what are you carrying", so the shelf exists, is
   * named, and renders NOTHING while this prop is absent. The contract is
   * `SubscriptionReading` in `lib/life/profile.ts`; the data model is the lead's and is
   * deliberately not guessed at here.
   */
  subscription?: SubscriptionReading | null
  onClose: () => void
}) {
  const { profile, taken, missed, state } = snapshot
  /**
   * מה שיוצא החוצה — one object at a time, and only when the player asks.
   *
   * The button sits on the shelf next to the thing itself rather than on the box, because
   * what a person shares is never "my collection"; it is one ticket stub and the sentence
   * that came with it. `ShareSheet` does the rest.
   */
  const [sharing, setSharing] = useState<ShareCard | null>(null)
  const [leaf, setLeaf] = useState<Leaf>('bag')
  const dialogRef = useDialog<HTMLDivElement>(onClose)

  const carried = carriedReading(state)
  const purses = purseReading(state)
  const wardrobe = wardrobeReading(state)
  const keepsakes = redBoxReading(state)
  const days = presenceReading(state)

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      className="pointer-events-auto absolute inset-0 z-[60] flex items-stretch justify-center bg-ink/90 p-gutter outline-none"
      aria-modal="true"
      aria-label={profile.nameHe}
    >
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

        {/* שני עלים — the objects, then the person. The bag opens on the bag. */}
        <div className="mt-4 flex gap-2 px-5">
          <LeafTab live={leaf === 'bag'} onClick={() => setLeaf('bag')}>
            {t('life.bag.tabBag')}
          </LeafTab>
          <LeafTab live={leaf === 'me'} onClick={() => setLeaf('me')}>
            {t('life.bag.tabMe')}
          </LeafTab>
        </div>

        {leaf === 'bag' ? (
          <div className="flex flex-col gap-4 px-5 pb-6 pt-5">
            {/* בכיס עכשיו — an afternoon's props, and they are gone by morning. */}
            <Shelf titleHe={t('life.bag.carried')} noteHe={t('life.bag.carriedNote')}>
              {carried.length === 0 ? (
                <p className="font-body text-[13px] leading-relaxed text-concrete">
                  <bdi>{t('life.bag.carriedNone')}</bdi>
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {carried.map((thing) => (
                    <Thing
                      key={thing.item}
                      art={thing.art}
                      nameHe={thing.nameHe}
                      noteHe={thing.noteHe}
                      copies={thing.copies}
                      moreHe={thing.more ? t('life.bag.carriedMore') : null}
                    />
                  ))}
                </ul>
              )}
            </Shelf>

            {/*
              הכסף — two pockets, in words.
              Maor, 16.9.2026: "כל הקטע בארנק זה שהכסף צריך להישמר ולהמשיך עם הדמות. והוא
              מחליט מתי ואיפה ועל מה להוציא." The pocket goes with him; the tin waits. The
              HUD shows only the pocket, so this is the first screen in the game on which
              the tin under the bed exists at all.
            */}
            <Shelf titleHe={t('life.bag.money')} noteHe={t('life.bag.moneyNote')}>
              <dl className="flex flex-col gap-2.5">
                {purses.map((purse) => (
                  <div key={purse.purse} className="flex items-baseline justify-between gap-3">
                    <dt className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-concrete">
                      <bdi>{purseLabel(purse.purse)}</bdi>
                    </dt>
                    <dd className="flex items-center gap-2">
                      <Marks n={purse.band} />
                      <p className={`font-display text-[14px] leading-none ${purse.band === 0 ? 'text-concrete' : 'text-sheet'}`}>
                        <bdi>{purse.readingHe}</bdi>
                      </p>
                    </dd>
                  </div>
                ))}
              </dl>
            </Shelf>

            {/* הארון — the only object in this game that measures the whole life. */}
            <Shelf titleHe={t('life.bag.wardrobe')}>
              {wardrobe.length === 0 ? (
                <p className="font-body text-[13px] leading-relaxed text-concrete">
                  <bdi>{t('life.bag.wardrobeNone')}</bdi>
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {wardrobe.map((shirt) => (
                    <li key={shirt.id} className="border-hair border-concrete/30 bg-sheet/[0.04]">
                      {/*
                        שתי דרכים לצייר חולצה — a photograph of a shirt Maor owns, or the
                        club's own archive spec drawn by the component the kits screen
                        draws it with. A wardrobe that mixed a photograph with a grey box
                        would be a wardrobe with holes in it.
                      */}
                      <div className="flex h-[112px] items-center justify-center border-b-hair border-concrete/25 bg-sheet/10 px-3 py-2">
                        {shirt.spec ? (
                          <KitShirt spec={shirt.spec} className="h-full" title={shirt.nameHe} />
                        ) : (
                          <span className="relative block h-full w-full">
                            <Image
                              src={artUrl(shirt.art)}
                              alt=""
                              aria-hidden="true"
                              fill
                              sizes="200px"
                              className="object-contain"
                            />
                          </span>
                        )}
                      </div>
                      <div className="px-3 py-2.5">
                        <p className="font-display text-[14px] leading-none text-sheet">
                          <bdi>{shirt.nameHe}</bdi>
                        </p>
                        <p className="mt-1.5 font-mono text-[10px] leading-none text-concrete">
                          <bdi>{shirt.sponsorHe}</bdi>
                          <span className="px-2 text-red">·</span>
                          <bdi>{shirt.yearsHe}</bdi>
                        </p>
                        <p className="mt-1.5 font-body text-[11px] leading-snug text-concrete">
                          <bdi>{shirt.noteHe}</bdi>
                        </p>
                        {/*
                          איפה היית איתה — the line that turns a wardrobe into a biography.
                          A price makes a shirt an object; the day you wore it makes it the
                          day itself.
                        */}
                        {shirt.wornHe.length > 0 && (
                          <div className="mt-2 border-t-hair border-red/40 pt-2">
                            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-red">
                              <bdi>{t('life.shop.worn')}</bdi>
                            </p>
                            {shirt.wornHe.map((day) => (
                              <p key={day.id} className="mt-1 font-body text-[11px] leading-snug text-sheet">
                                <bdi>{day.dateHe}</bdi>
                                <span className="px-2 text-concrete">·</span>
                                <bdi className="text-concrete">{day.titleHe}</bdi>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Shelf>

            {/* הקופסה — the objects a life chose to keep, with the word they carry. */}
            <Shelf titleHe={t('life.profile.box')} noteHe={t('life.bag.boxNote')}>
              {keepsakes.length === 0 ? (
                <p className="font-body text-[13px] leading-relaxed text-concrete">
                  <bdi>{t('life.profile.boxEmpty')}</bdi>
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {keepsakes.map((item) => (
                    <Thing
                      key={item.id}
                      art={item.art}
                      nameHe={item.titleHe}
                      noteHe={item.noteHe}
                      standout={item.standout}
                      tags={item.standout ? <Tag tone="red">{item.rarityHe}</Tag> : <Tag>{item.rarityHe}</Tag>}
                      meta={
                        <p className="font-mono text-[9px] leading-none tabular-nums text-concrete/70">
                          <Num>{item.year}</Num>
                        </p>
                      }
                    >
                      <button
                        type="button"
                        data-life="share-memory"
                        onClick={() => setSharing(cardForMemory(state, item.source))}
                        className="mt-2 min-h-tap border-hair border-sheet/50 px-2 py-1 font-sign text-[11px] leading-none text-sheet/80"
                      >
                        <bdi>{t('life.share.take')}</bdi>
                      </button>
                    </Thing>
                  ))}
                </ul>
              )}
            </Shelf>

            {/*
              איפה הייתי — the stub's other half.
              "Missed is a ROUTE, not empty content" (Stage B §7). Inside, late, by a
              radio, in the army, on a road: five biographies of one afternoon, and the
              object the day left is drawn beside the way he was there for it.
            */}
            <Shelf titleHe={t('life.bag.where')}>
              {days.length === 0 ? (
                <p className="font-body text-[13px] leading-relaxed text-concrete">
                  <bdi>{t('life.bag.whereNone')}</bdi>
                </p>
              ) : (
                <ul className="divide-y divide-concrete/15">
                  {days.map((day) => (
                    <li key={day.anchorId} className="flex items-start justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="font-display text-[14px] leading-none text-sheet">
                          <bdi>{day.dateHe}</bdi>
                        </p>
                        <p className="mt-1 font-body text-[11px] leading-snug text-concrete">
                          <bdi>{day.titleHe}</bdi>
                        </p>
                        {day.keepsake && (
                          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-red">
                            <bdi>{t('life.bag.kept')} · {day.keepsake.nameHe}</bdi>
                          </p>
                        )}
                      </div>
                      <div className="shrink-0">
                        <Tag tone={day.wasThere ? 'red' : 'quiet'}>
                          {day.modeHe ?? (day.wasThere ? t('life.bag.there') : t('life.bag.notThere'))}
                        </Tag>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Shelf>

            {/*
              המנוי — THE LEAD'S SHELF. Renders nothing at all until `subscription` is
              handed in; see the prop's own note above for the contract and for whose the
              data model is.
            */}
            {subscription && (subscription.seasonsHe.length > 0 || subscription.currentHe) && (
              <Shelf titleHe={t('life.bag.sub')}>
                {subscription.currentHe && (
                  <p className="font-display text-[15px] leading-none text-sheet">
                    <bdi>
                      {t('life.bag.subCurrent')} · {subscription.currentHe}
                    </bdi>
                  </p>
                )}
                {subscription.streak > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <Marks n={Math.min(subscription.streak, 12)} />
                    <p className="font-body text-[11px] leading-none text-concrete">
                      <bdi>{t('life.bag.subRun')}</bdi>
                    </p>
                  </div>
                )}
                {subscription.seasonsHe.length > 0 && (
                  <p className="mt-2 font-mono text-[10px] leading-relaxed text-concrete">
                    <bdi>{subscription.seasonsHe.join(' · ')}</bdi>
                  </p>
                )}
              </Shelf>
            )}
          </div>
        ) : (
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
          </div>
        )}
      </div>
      {sharing ? <ShareSheet card={sharing} onClose={() => setSharing(null)} /> : null}
    </div>
  )
}
