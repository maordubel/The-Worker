'use client'

import { Grain, Leak, Letterbox, YearRoll } from '@/components/life/FilmFx'
import { artUrl } from '@/lib/life/runtime/art'

type DocCopy = { world: string; pogi: string }

/**
 * מעברונים דוקומנטריים — not a loading card, an edit in a life.
 *
 * Every big jump gets three beats: TIME → WORLD → PUGI. The copy deliberately avoids
 * scores/opponents/scorers; exact historical facts still belong to the archive layer.
 * What this card is allowed to say is what the passing years did to the person we play.
 */
const DOC: Record<string, DocCopy> = {
  'הסמטה': { world: 'השכונה כבר יודעת איפה כולם משחקים אחר הצהריים.', pogi: 'פוגי לומד בפעם הראשונה שלכל בחירה קטנה יש מחיר.' },
  'הבית האדום השני': { world: 'יש עוד בית אדום בעיר, והוא קטן, צפוף ורועש יותר.', pogi: 'אפי פותח דלת שקובי מעולם לא פתח בשבילו.' },
  'המספר שבע על הקיר': { world: 'הגיבור שעל הקיר הופך לאיש שאנשים מתווכחים עליו.', pogi: 'פוגי מתחיל להבין שאהבה למועדון אינה הסכמה עם כולם.' },
  'אין מקום אחד לעמוד בו': { world: 'החיים מקבלים מדים. גם היציע מתחיל להשתנות.', pogi: 'בפעם הראשונה, לעמוד במקום מסוים הוא גם להגיד מי אתה.' },
  'גם האולם יכול לרדת': { world: 'אוסישקין כבר אינו רק בית. עכשיו צריך גם להחזיק אותו.', pogi: 'פוגי מגלה שאוהד הוא לפעמים האדם שנשאר כשכולם הולכים.' },
  'השרוכים': { world: 'האביב מרגיש כמו חלום עד שהרדיו משנה את האוויר.', pogi: 'פוגי לא בוחר מה קרה. הוא בוחר מה לעשות עם זה.' },
  'זה לא נגמר כשעולים': { world: 'הקירות אותם קירות. הכסף, האנשים והסבלנות כבר לא.', pogi: 'הכאב מתחיל להפוך לעבודה, רשימות וחובות.' },
  'שש־עשרה שנה': { world: 'אחרי שנים של כמעט, שוב יש לילה שאפשר לנסוע אליו.', pogi: 'מי שנוסע איתך כבר חשוב כמעט כמו מה שמחכה בסוף הדרך.' },
  'ארבעה ימים': { world: 'עשור שלם עומד על הקצה של עוד תשובה שמגיעה ממקום אחר.', pogi: 'מאז 1998 הוא כבר לא חוגג לפני שהוא שואל: בטוח?' },
  'הדאבל': { world: 'ארבעה ימים מפרידים בין חגיגה אחת לאחרת. החיים לא עוצרים ביניהן.', pogi: 'עבודה, משפחה, יציע ואוסישקין מתחרים עכשיו על אותו אחר הצהריים.' },
}

export function ChapterCard({
  titleHe,
  subHe,
  nameHe,
  art,
  fromYear,
}: {
  titleHe: string
  subHe: string | null
  nameHe?: string
  art: string
  fromYear?: number | null
}) {
  const year = /^\d{4}$/.test(titleHe) ? Number(titleHe) : null
  const elapsed = year !== null && fromYear !== null && fromYear !== undefined ? Math.max(0, year - fromYear) : 0
  const elapsedHe = elapsed <= 0 ? null : new Intl.NumberFormat('he', { style: 'unit', unit: 'year', unitDisplay: 'long' }).format(elapsed)
  const doc = DOC[nameHe ?? '']

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden bg-ink" data-life="chapter-card" data-documentary="1">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center motion-reduce:animate-none"
        style={{ backgroundImage: `url(${artUrl(art)})`, animation: 'plate-push 5200ms ease-out both' }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/20" />
      <div aria-hidden="true" className="absolute inset-y-0 start-0 w-[5px] bg-red/85" />
      <Leak index={((Math.abs(year ?? 1) % 3) + 1) as 1 | 2 | 3} />
      <Grain opacity={0.26} />
      <Letterbox />

      <div className="absolute inset-x-0 bottom-[17%] flex flex-col items-center px-gutter text-center">
        <div className="mb-3 inline-flex items-center gap-2 border border-sheet/15 bg-ink/65 px-2 py-1 font-mono text-[9px] tracking-[0.18em] text-sheet/65">
          <span className="text-red">THE WORKER · תיעוד חיים</span>
          {elapsedHe && <span>· <bdi>{elapsedHe}</bdi></span>}
        </div>

        <p className="animate-title-rise font-poster text-[72px] leading-none text-sheet sm:text-[96px]" style={{ textShadow: '0 2px 24px rgb(var(--ink) / .9)' }}>
          {year !== null ? <YearRoll from={fromYear ?? null} to={year} /> : <bdi>{titleHe}</bdi>}
        </p>
        <span className="mt-3 block h-[3px] w-16 origin-center animate-rule-draw bg-red" aria-hidden="true" />

        {nameHe && <p className="mt-3 font-display text-[20px] leading-tight text-sheet"><bdi>{nameHe}</bdi></p>}
        {subHe && <p className="mt-2 max-w-[34rem] font-sign text-[13px] leading-snug text-sheet/75"><bdi>{subHe}</bdi></p>}

        {doc && (
          <div className="mt-5 max-w-[36rem] border-t border-sheet/15 pt-4">
            <p className="font-body text-[12px] leading-relaxed text-sheet/78" style={{ animation: 'film-in 700ms 700ms ease-out both' }}>
              <span className="me-2 font-mono text-[9px] tracking-[0.14em] text-red">העולם</span>
              <bdi>{doc.world}</bdi>
            </p>
            <p className="mt-2 font-body text-[13px] leading-relaxed text-sheet/92" style={{ animation: 'film-in 700ms 1500ms ease-out both' }}>
              <span className="me-2 font-mono text-[9px] tracking-[0.14em] text-red">פוגי</span>
              <bdi>{doc.pogi}</bdi>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
