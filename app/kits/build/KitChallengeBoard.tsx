'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'

import { KitShirt } from '@/components/kit/KitShirt'
import { Num } from '@/components/ui/Num'
import { Stamp } from '@/components/ui/Stamp'
import { t } from '@/lib/i18n'
import { DEFAULT_SPEC } from '@/lib/kit/spec'
import type { KitChallenge, KitVerdict } from '@/lib/game/kitChallenge'
import { submitKit } from './actions'
import { ShareRow } from '@/components/share/ShareRow'

/** Two choices, graded on the server, then the real answer with its source. */
export function KitChallengeBoard({
  challenge,
  seed,
}: {
  challenge: KitChallenge
  seed: number
}) {
  const [maker, setMaker] = useState<string | null>(null)
  const [sponsor, setSponsor] = useState<string | null>(null)
  const [verdict, setVerdict] = useState<KitVerdict | null>(null)
  const [pending, startTransition] = useTransition()

  const submit = () =>
    startTransition(async () => setVerdict(await submitKit(seed, { maker, sponsor })))

  const chip = (selected: boolean, settled: boolean | null) =>
    settled === null
      ? selected
        ? 'border-red text-red'
        : 'border-ink text-ink'
      : settled
        ? 'border-red bg-red text-sheet'
        : 'border-ink text-ink line-through'

  return (
    <>
      {/* The gap lives on the flex row, never on the <Num>. A <bdi dir="ltr"> resolves
          its own logical margins against LTR, so `me-*` there lands on the wrong side. */}
      <p className="mt-stack flex flex-wrap items-baseline gap-x-2 gap-y-1 border-rule border-ink bg-sheet p-3 font-sign text-step-2 leading-tight text-ink">
        <Num className="font-mono text-red">{challenge.season}</Num>
        <span>{challenge.competition ?? t('kitChallenge.allCompetitions')}</span>
      </p>

      {/* The shirt with the two slots cut out of it. Asking "which maker, which
          sponsor" over a bare season label is a form; asking it over the actual shirt
          with two navy dashed boxes where the answers go is a game — the player is
          looking at the gap they have to fill. Straight off the handoff's
          "מה חסר בחולצה?" screen. */}
      <div className="mt-3 border-rule border-ink bg-paper p-4">
        <KitShirt
          spec={{
            ...DEFAULT_SPEC,
            seasonLabel: challenge.season,
            sponsorHe: verdict ? verdict.sponsor : null,
            makerHe: verdict ? verdict.maker : null,
          }}
          missing={verdict ? [] : ['sponsor', 'maker']}
          className="mx-auto block w-full max-w-[210px]"
          title={challenge.season}
        />
      </div>

      <fieldset className="mt-stack border-rule border-ink p-3" disabled={verdict !== null}>
        <legend className="px-1 font-body text-[11px] font-extrabold tracking-widest text-muted">
          {t('kitChallenge.maker')}
        </legend>
        <div className="flex flex-wrap gap-2">
          {challenge.makers.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setMaker(name)}
              aria-pressed={maker === name}
              className={`min-h-tap border-rule px-3 font-body text-[13px] transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none ${chip(
                maker === name,
                verdict ? (name === verdict.maker ? true : maker === name ? false : null) : null,
              )}`}
            >
              {name}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-3 border-rule border-ink p-3" disabled={verdict !== null}>
        <legend className="px-1 font-body text-[11px] font-extrabold tracking-widest text-muted">
          {t('kitChallenge.sponsor')}
        </legend>
        <div className="flex flex-wrap gap-2">
          {challenge.sponsors.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setSponsor(name)}
              aria-pressed={sponsor === name}
              className={`min-h-tap border-rule px-3 font-body text-[13px] transition-transform duration-press ease-stamp active:scale-[.96] motion-reduce:transition-none ${chip(
                sponsor === name,
                verdict
                  ? name === verdict.sponsor
                    ? true
                    : sponsor === name
                      ? false
                      : null
                  : null,
              )}`}
            >
              {name}
            </button>
          ))}
        </div>
      </fieldset>

      {!verdict && (
        <button
          type="button"
          onClick={submit}
          disabled={pending || maker === null || sponsor === null}
          className="mt-stack flex min-h-tap w-full items-center bg-red px-4 font-body text-step-1 font-extrabold text-sheet transition-transform duration-press ease-stamp active:scale-[.96] disabled:opacity-40 motion-reduce:transition-none"
        >
          {pending ? t('state.loading') : t('kitChallenge.submit')}
        </button>
      )}

      {verdict && (
        <>
          <div className="mt-stack flex items-center gap-3">
            <Stamp
              label={verdict.makerCorrect && verdict.sponsorCorrect ? 'verified' : 'rejected'}
              ring={false}
              size={56}
              animate
            />
            <p className="font-display text-step-2 leading-tight text-ink">
              {verdict.maker} · {verdict.sponsor}
            </p>
          </div>
          {verdict.noteHe && (
            <p className="mt-2 font-body text-step-0 text-muted">{verdict.noteHe}</p>
          )}
          <Link
            href={`/kits/build?seed=${seed + 1}`}
            className="mt-stack flex min-h-tap w-full items-center bg-ink px-4 font-body text-step-1 font-extrabold text-sheet"
          >
            {t('kitChallenge.next')}
          </Link>
          <ShareRow
            kind="kit"
            params={{ s: String(seed), total: '2' }}
            headline={`${Number(verdict.makerCorrect) + Number(verdict.sponsorCorrect)}`}
            card={{
              kicker: 'GATE 4 · GUESS THE KIT',
              label: t('screen.kitChallenge.title'),
              eyebrow: t('kitChallenge.submit'),
              hero: verdict.sponsor,
              stats: [
                { k: t('kitChallenge.maker'), v: verdict.maker },
                { k: t('kitChallenge.sponsor'), v: verdict.sponsor },
              ],
              cta: t('share.challenge'),
              challenge: t('share.sameRound'),
            }}
          />
        </>
      )}
    </>
  )
}
