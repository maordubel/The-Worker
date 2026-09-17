'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { Grain } from '@/components/life/FilmFx'
import { useDialog } from '@/components/ui/useDialog'
import { t } from '@/lib/i18n'
import { FILM } from '@/lib/life/opening'

/**
 * הפתיח, כסרט — 21.4 שניות בשחקנים חיים, ואז המשחק.
 *
 * מאור, 17.9.2026: *"זה הסרטון פתיחה שאני רוצה לצרף לתחילת המשחק החיים המלא במקום המצגת
 * שיש כעת."* זה הקומפוננטה שעושה את זה, ו-`OpeningSequence` — חמש התמונות — היא מעכשיו
 * מה שמנגן כשהסרט **לא יכול** לנגן. לא שרידים: נפילה־לאחור אמיתית, ולשלוש סיבות קונקרטיות.
 *
 * ## למה יש בכלל נפילה־לאחור
 *
 * כלל 30 למד את זה בדרך הקשה על הפתיח של האתר: *"a frozen poster waiting for an `ended`
 * event that will never fire is worse than no opening."* סרט יכול לא לנגן בשלוש דרכים,
 * וכל אחת מהן קורית אצל מישהו אמיתי:
 *
 *  · **`prefers-reduced-motion`** — 21 שניות של קולנוע הן תנועה. מי שביקש פחות תנועה
 *    מקבל את המצגת, שהיא חיתוכים שקטים בלי דריפט.
 *  · **הדפדפן לא יודע לנגן אף אחד משני הפורמטים.** לכן שולחים שניים (כלל 30) — VP9/WebM
 *    ו-h.264/mp4 — ובכל זאת נשאלת השאלה לפני שמציגים אלמנט ריק.
 *  · **הניגון פשוט לא התחיל.** אוטופליי נדחה, הרשת נתקעה, הקובץ לא נטען. שומר־זמן של
 *    שתי שניות בודק אם משהו זז; אם לא — המצגת. זה הלקח של כלל 30 בשורה אחת של קוד.
 *
 * ## מה הקומפוננטה הזאת לא עושה
 *
 * **לא מדפיסה שום מילה על הסרט.** הכתוביות צרובות בתמונה — "דרום תל אביב", "קובי ורחל
 * הקימו משפחה", "ופוגי התאהב" — וכיתוב DOM מעליהן היה כפילות, לא עזרה. לכן אין כאן
 * caption, אין חותמת שנה ואין נקודות התקדמות: כל אלה שייכים למצגת, שבה הטקסט הוא שלנו.
 *
 * **ולא דורשת קול.** הסרט מתחיל מושתק, כי זה הצירוף היחיד שכל דפדפן נייד מרשה בלי מחווה.
 * יש כפתור קול, והלחיצה עליו היא המחווה — כלומר הצליל אפשרי ואף פעם לא תנאי.
 */
export function OpeningFilm({ onDone, onFallback }: { onDone: () => void; onFallback: () => void }) {
  const video = useRef<HTMLVideoElement | null>(null)
  const done = useRef(false)
  const latest = useRef(onDone)
  latest.current = onDone

  const [sound, setSound] = useState(false)
  const fallback = useRef(onFallback)
  fallback.current = onFallback
  /** null = עוד לא ידוע; false = לא מנגן ולכן נופלים למצגת */
  const [rolling, setRolling] = useState<boolean | null>(null)

  const finish = useCallback(() => {
    if (done.current) return
    done.current = true
    latest.current()
  }, [])

  const dialogRef = useDialog<HTMLDivElement>(finish)

  /**
   * שומר הזמן — מה שהופך "לא נטען" מתקיעה לנפילה־לאחור.
   *
   * `onError` תופס קובץ שבור ו-`canplay` תופס טעינה מוצלחת, ואף אחד משניהם לא תופס את
   * המקרה הנפוץ באמת: אוטופליי שנדחה בשקט, שבו האלמנט תקין, הפוסטר מוצג, ו-`ended` לא
   * יגיע לעולם. אז בודקים את השעון של הסרט עצמו — אם הוא לא זז אחרי שתי שניות, הוא לא
   * מנגן, יהיה מה שיהיה הסיבה.
   */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const el = video.current
      const playing = (el?.currentTime ?? 0) > 0.05
      setRolling(playing)
      if (!playing) fallback.current()
    }, 2000)
    return () => window.clearTimeout(timer)
  }, [])

  // הדפדפן לא יודע אף אחד מהשניים — אין מה לחכות לו
  useEffect(() => {
    const el = video.current
    if (!el) return
    const anyFormat =
      el.canPlayType('video/webm; codecs="vp9"') !== '' || el.canPlayType('video/mp4; codecs="avc1.64001f"') !== ''
    if (!anyFormat) {
      setRolling(false)
      fallback.current()
    }
  }, [])

  if (rolling === false) return null

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      dir="rtl"
      role="dialog"
      className="absolute inset-0 z-[60] overflow-hidden bg-ink outline-none"
      aria-modal="true"
      aria-label={t('life.opening.film')}
    >
      <video
        ref={video}
        poster={FILM.poster}
        muted={!sound}
        playsInline
        autoPlay
        preload="auto"
        onEnded={finish}
        onError={() => {
          setRolling(false)
          fallback.current()
        }}
        className="absolute inset-0 h-full w-full object-contain"
      >
        {/* VP9 קודם: הוא מה שנמדד ב-4.4756% מול 4.5682% של ה-h.264, והוא הקטן מהשניים */}
        <source src={FILM.webm} type="video/webm" />
        <source src={FILM.mp4} type="video/mp4" />
      </video>

      <Grain opacity={0.1} />

      <button
        type="button"
        onClick={() => {
          setSound((on) => !on)
          // מחווה של משתמש: מכאן הדפדפן מרשה גם קול
          const el = video.current
          if (el) void el.play().catch(() => undefined)
        }}
        aria-pressed={sound}
        className="absolute bottom-4 flex min-h-tap items-center px-3 font-body text-[11px] text-concrete/55"
        style={{ insetInlineEnd: 12 }}
      >
        {sound ? t('life.opening.sound.on') : t('life.opening.sound.off')}
      </button>

      <button
        type="button"
        onClick={finish}
        data-life="opening-skip"
        className="absolute bottom-4 flex min-h-tap items-center px-3 font-body text-[11px] text-concrete/55"
        style={{ insetInlineStart: 12 }}
      >
        {t('life.cutscene.skip')}
      </button>
    </div>
  )
}
