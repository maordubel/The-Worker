import type {Metadata} from 'next'
import Link from 'next/link'
import {t} from '@/lib/i18n'
import {isOwner} from '@/lib/owner/session'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {title: t('life.owner.title'), robots: {index: false, follow: false}}

/** The owner's dedicated door into LIFE while it is closed to the public (owner, 24.11.2026). */
export default async function OwnerDoor({searchParams}: {searchParams: {e?: string}}) {
  const owner = await isOwner()
  const error = searchParams.e === 'wrong' ? t('life.owner.wrong') : searchParams.e === 'closed' ? t('life.owner.closed') : null
  return (
    <main id="main" className="mx-auto grid min-h-[100dvh] max-w-md content-center gap-4 bg-ink px-5 py-10 text-sheet">
      <h1 className="font-display text-[28px] leading-tight">{t('life.owner.title')}</h1>
      {owner ? (
        <>
          <p className="font-body text-[15px] text-concrete">{t('life.owner.in')}</p>
          <Link href="/life" className="flex min-h-tap items-center justify-center bg-red px-4 font-body text-[16px] font-extrabold text-sheet">{t('life.owner.enter')}</Link>
        </>
      ) : (
        <form method="post" action="/api/owner" className="grid gap-3">
          <p className="font-body text-[15px] text-concrete">{t('life.owner.lede')}</p>
          <label className="grid gap-1 font-body text-[13px] font-bold">
            {t('life.owner.key')}
            <input name="key" type="password" autoComplete="current-password" required dir="ltr" className="min-h-tap border-rule border-sheet bg-ink px-3 text-[16px] text-sheet" />
          </label>
          {error && <p role="alert" className="font-body text-[14px] font-bold text-red">{error}</p>}
          <button type="submit" className="min-h-tap bg-red px-4 font-body text-[16px] font-extrabold text-sheet">{t('life.owner.go')}</button>
        </form>
      )}
    </main>
  )
}
