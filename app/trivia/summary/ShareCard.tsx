'use client'

import { useEffect, useRef, useState } from 'react'

import { STORY_HEIGHT, STORY_WIDTH, StoryCard, type StoryData } from '@/components/press/StoryCard'
import { t } from '@/lib/i18n'

/**
 * The share surface.
 *
 * The card is rendered at true story size (1080×1920) and scaled to fit with a
 * transform, so the thing on screen IS the thing that gets saved — there is no second
 * layout to drift.
 *
 * Saving uses the native share sheet where the browser has one (which on a phone is
 * how a story actually gets posted) and falls back to a PNG download. Both paths draw
 * the card through an SVG `foreignObject`, so no screenshot library is needed and the
 * page ships nothing extra.
 */
export function ShareCard({ data }: { data: StoryData }) {
  const holder = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.3)
  const [state, setState] = useState<'idle' | 'working' | 'copied'>('idle')

  // Fit the card to whatever width the phone gives us.
  useEffect(() => {
    const fit = () => {
      const width = holder.current?.clientWidth ?? STORY_WIDTH
      setScale(Math.min(1, width / STORY_WIDTH))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  async function save() {
    setState('working')
    try {
      const blob = await renderCardToPng()
      if (!blob) return
      const file = new File([blob], `the-worker-${data.seed}.png`, { type: 'image/png' })
      const shareable = navigator.canShare?.({ files: [file] })
      if (navigator.share && shareable) {
        await navigator.share({ files: [file], text: data.ctaHe })
      } else {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = file.name
        link.click()
        URL.revokeObjectURL(url)
      }
    } catch {
      // A cancelled share sheet is not an error worth shouting about.
    } finally {
      setState('idle')
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(data.url)
      setState('copied')
      window.setTimeout(() => setState('idle'), 1800)
    } catch {
      setState('idle')
    }
  }

  return (
    <div className="mt-stack">
      <div
        ref={holder}
        className="relative w-full overflow-hidden border-rule border-ink"
        style={{ height: STORY_HEIGHT * scale }}
      >
        <div
          style={{
            width: STORY_WIDTH,
            height: STORY_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top right',
          }}
        >
          <StoryCard data={data} />
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 md:flex-row">
        <button
          type="button"
          onClick={save}
          disabled={state === 'working'}
          className="flex min-h-tap flex-1 items-center justify-center bg-red px-4 font-body text-step-1 font-extrabold text-sheet transition-transform duration-press ease-stamp active:scale-[.97] disabled:opacity-50 motion-reduce:transition-none"
        >
          {state === 'working' ? t('state.loading') : t('share.download')}
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="flex min-h-tap flex-1 items-center justify-center border-rule border-ink px-4 font-body text-step-1 font-extrabold text-ink transition-transform duration-press ease-stamp active:scale-[.97] motion-reduce:transition-none"
        >
          {state === 'copied' ? t('share.copied') : t('share.copy')}
        </button>
      </div>

      <p className="mt-2 font-body text-step--1 leading-relaxed text-muted">{t('share.hint')}</p>
    </div>
  )
}

/**
 * Draw the live card into a PNG.
 *
 * The card is wrapped in an SVG `foreignObject` and painted to a canvas. That keeps one
 * source of truth for the design — no second, hand-maintained canvas drawing that
 * slowly stops matching the card on screen — and needs no library.
 *
 * Fonts have to be inlined as data URLs before serialising: an external `@font-face` is
 * not fetched from inside a foreignObject, and the card would silently fall back to a
 * system face.
 */
async function renderCardToPng(): Promise<Blob | null> {
  const node = document.getElementById('story-card')
  if (!node) return null

  const css = await collectStyles()
  const clone = node.cloneNode(true) as HTMLElement
  clone.style.transform = 'none'

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${STORY_WIDTH}" height="${STORY_HEIGHT}">
<foreignObject width="100%" height="100%">
<div xmlns="http://www.w3.org/1999/xhtml" dir="rtl"><style>${css}</style>${clone.outerHTML}</div>
</foreignObject></svg>`

  const image = new Image()
  image.crossOrigin = 'anonymous'
  const loaded = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('render failed'))
  })
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await loaded

  const canvas = document.createElement('canvas')
  canvas.width = STORY_WIDTH
  canvas.height = STORY_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) return null
  context.drawImage(image, 0, 0)

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'))
}

/** Every same-origin rule on the page, plus the custom properties the card reads. */
async function collectStyles(): Promise<string> {
  const chunks: string[] = []
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) chunks.push(rule.cssText)
    } catch {
      // A cross-origin sheet cannot be read. Skipping it is correct — the card's own
      // styles are same-origin.
    }
  }
  return chunks.join('\n')
}
