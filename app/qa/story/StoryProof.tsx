'use client'

import { useEffect, useState } from 'react'

import { drawStory, lastInkBoxes, type InkBox, type StoryCard } from '@/lib/share/story'

/**
 * The worst cases, not the pretty ones.
 *
 * Every string here is chosen to be the longest of its kind that the app can actually
 * produce: the longest name on the 637-man roster, a full eight-row ballot with a
 * three-word answer in it, a headline that wraps. A check run on "90%" proves nothing —
 * that was exactly the card that looked fine while "מוחמד קליל טראורה" printed straight
 * through the number under it.
 */
const LONG_NAME = 'מוחמד קליל טראורה'

const CASES: Array<{ name: string; card: StoryCard }> = [
  {
    name: 'score',
    card: {
      template: 'score',
      kicker: 'GATE 2 · SHIRT NUMBERS',
      label: 'טריוויית מספרי שחקנים',
      eyebrow: 'תשובות נכונות',
      hero: '11/12',
      bigStat: { v: '2400', k: 'ניקוד' },
      stats: [
        { k: 'רצף הכי ארוך', v: '9' },
        { k: 'שחקן', v: LONG_NAME },
      ],
      marks: [true, true, false, true, true, true, true, false, true, true, true, true],
      cta: 'תנסה לעבור אותי',
      challenge: 'אותו סבב בדיוק',
    },
  },
  {
    name: 'ink',
    card: {
      template: 'ink',
      kicker: 'GATE 11 · THE HATRED GAME',
      label: 'משחק השנאה',
      eyebrow: 'השנוא ביותר',
      hero: LONG_NAME,
      bigStat: { v: '7', k: 'סבבים' },
      stats: [{ k: 'הכי שנוא', v: LONG_NAME }],
      cta: 'מי שלך?',
      challenge: 'אותו סבב בדיוק',
    },
  },
  {
    name: 'year',
    card: {
      template: 'year',
      kicker: 'GATE 13 · TIMELINE',
      label: 'ציר הזמן',
      eyebrow: 'הוצבו נכון',
      hero: '10/10',
      bigStat: { v: '3200', k: 'ניקוד' },
      stats: [
        { k: 'רצף הכי ארוך', v: '10' },
        { k: 'הוצבו נכון', v: '10/10' },
      ],
      cta: 'תבנה ציר משלך',
      challenge: 'אותו סבב בדיוק',
    },
  },
  {
    name: 'xi',
    card: {
      template: 'xi',
      kicker: 'GATE 1 · ALL-TIME XI',
      label: 'הרכב כל הזמנים',
      eyebrow: '4-4-2',
      hero: 'הרכב כל הזמנים',
      stats: [],
      xi: [
        { roleHe: 'שוער', nameHe: LONG_NAME, x: 50, y: 94 },
        { roleHe: 'מגן', nameHe: LONG_NAME, x: 16, y: 72 },
        { roleHe: 'בלם', nameHe: 'אמסלם', x: 39, y: 72 },
        { roleHe: 'בלם', nameHe: 'אנטביקה', x: 61, y: 72 },
        { roleHe: 'מגן', nameHe: 'בן דיין', x: 84, y: 72 },
        { roleHe: 'כנף', nameHe: LONG_NAME, x: 16, y: 48 },
        { roleHe: 'קשר', nameHe: 'בוזגלו', x: 39, y: 48 },
        { roleHe: 'קשר', nameHe: 'ניסים', x: 61, y: 48 },
        { roleHe: 'כנף', nameHe: 'זהבי', x: 84, y: 48 },
        { roleHe: 'חלוץ', nameHe: LONG_NAME, x: 39, y: 22 },
        { roleHe: 'חלוץ', nameHe: 'דמיאנוביץ', x: 61, y: 22 },
      ],
      cta: 'תרכיב את שלך',
      challenge: 'אותו סבב בדיוק',
    },
  },
  {
    name: 'ballot',
    card: {
      template: 'ballot',
      kicker: 'GATE 7 · THE BALLOT',
      label: 'אגף הסקרים',
      eyebrow: 'פתק ההצבעה',
      hero: 'פתק ההצבעה',
      stats: [],
      ballot: [
        { ask: 'השחקן האהוב עליך בכל הזמנים', latin: 'ALL-TIME FAVOURITE', pick: LONG_NAME },
        { ask: 'השוער של כל הזמנים', latin: 'GOALKEEPER', pick: 'בונימוביץ' },
        { ask: 'הבלם של כל הזמנים', latin: 'CENTRE BACK', pick: LONG_NAME },
        { ask: 'הקשר של כל הזמנים', latin: 'MIDFIELD', pick: 'אבוקסיס' },
        { ask: 'החלוץ של כל הזמנים', latin: 'STRIKER', pick: LONG_NAME },
        { ask: 'הזר הכי טוב שלבש אדום', latin: 'BEST FOREIGNER', pick: 'דאגלס דה סילבה' },
        { ask: 'איזה מספר היית לובש', latin: 'YOUR NUMBER', pick: '10' },
        { ask: 'באיזו עמדה היית משחק', latin: 'YOUR POSITION', pick: 'קשר התקפי' },
      ],
      cta: 'תמלא פתק משלך',
      challenge: 'הפתק שלך מחכה',
    },
  },
]

type Report = Record<string, InkBox[]>

export function StoryProof() {
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      // The faces have to be resident before the first fillText or every box is
      // measured against a system fallback and the report is about a card nobody ships.
      try {
        await Promise.all([
          document.fonts.load('700 200px Karantina'),
          document.fonts.load('400 118px "Suez One"'),
          document.fonts.load('400 30px Heebo'),
          document.fonts.load('800 30px Archivo'),
        ])
        await document.fonts.ready
      } catch {
        // measured against the fallback is still better than not measured
      }
      if (cancelled) return

      // The badge is loaded, not stubbed. The credit strip is where the logo, the name
      // and the address sit, and it is exactly the block Maor caught out of position —
      // a proof that renders it as `null` proves nothing about the part that was wrong.
      const badge = await new Promise<HTMLImageElement | null>((resolve) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = () => resolve(null)
        image.src = '/brand/logo-512.png'
      })

      const report: Report = {}
      for (const item of CASES) {
        // The canvas is mounted, not thrown away. The numbers catch collisions; only a
        // picture catches a card that is technically clear and still ugly, and both
        // checks want the same render — so the harness is a contact sheet as well.
        const host = document.getElementById(`proof-${item.name}`)
        const canvas = document.createElement('canvas')
        canvas.width = 1080
        canvas.height = 1920
        canvas.style.width = '360px'
        canvas.style.height = '640px'
        const ctx = canvas.getContext('2d')
        if (!ctx) continue
        drawStory(ctx, item.card, badge, null)
        report[item.name] = lastInkBoxes()
        host?.replaceChildren(canvas)
      }
      ;(window as unknown as { __storyInk?: Report }).__storyInk = report
      setDone(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main data-story-proof={done ? 'ready' : 'working'} className="p-6 font-mono text-sm">
      <p>{done ? 'ready' : 'working'}</p>
      <div className="mt-4 flex flex-wrap gap-4">
        {CASES.map((item) => (
          <figure key={item.name}>
            <figcaption>{item.name}</figcaption>
            <div id={`proof-${item.name}`} />
          </figure>
        ))}
      </div>
    </main>
  )
}
