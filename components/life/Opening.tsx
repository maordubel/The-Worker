'use client'

import { useEffect, useState } from 'react'

import { OpeningFilm } from '@/components/life/OpeningFilm'
import { OpeningSequence } from '@/components/life/OpeningSequence'
import type { HistoricalAnchor } from '@/lib/life/anchors'

/**
 * הפתיח — הסרט, ומה שמנגן כשהסרט לא יכול.
 *
 * מאור, 17.9.2026: *"זה הסרטון פתיחה שאני רוצה לצרף לתחילת המשחק החיים המלא במקום המצגת
 * שיש כעת"*, ואז, אחרי שהמדידה הוצגה לו: *"הסרטון מאושר כפי שהוא."*
 *
 * הקומפוננטה הזאת היא ה**החלטה** ולא אף אחד משני המסכים, וזו הנקודה: `OpeningFilm`
 * ו-`OpeningSequence` לא יודעות זו על קיומה של זו ולא יכולות להיות מוצגות בבת אחת. כל
 * אחת מהן היא פתיח שלם.
 *
 * ## למה בכלל שתיים
 *
 * כלל 30 למד את זה על הפתיח של הקיר, בדם: *"a frozen poster waiting for an `ended` event
 * that will never fire is worse than no opening."* סרט הוא הדבר במשחק שהכי קל לו לא
 * לנגן — אוטופליי נדחה, רשת איטית, קודק חסר, ומשתמש שביקש פחות תנועה. **החלופה כאן אינה
 * "לוותר על הפתיח", היא הפתיח הקודם**, שהוא חמש תמונות, חיתוכים שקטים, וטקסט DOM שקורא
 * קורא מסך יודע לקרוא. זה לא שריד; זו הגרסה הנגישה של אותו סיפור.
 *
 * ## שתי דרכים לבחור, ושתיהן נחוצות
 *
 * `prefers-reduced-motion` נבדק **לפני** שמשהו מוצג, כי 21 שניות של קולנוע הן בדיוק מה
 * שהבקשה הזאת מבקשת לא לקבל. כל השאר — אוטופליי, קודק, רשת — אינו ניתן לשאלה מראש
 * ונקבע בתוך `OpeningFilm`, שמודיעה דרך `onFallback`.
 *
 * `ready === null` הוא הרגע שלפני שהדפדפן נשאל. מציגים בו את הסרט כדי שהוא יתחיל
 * להיטען מיד; מסך שמחכה לתשובה על עצמו הוא מסך שחור שהמשתמש סופר.
 */
export function Opening({ anchor, onDone }: { anchor: HistoricalAnchor; onDone: () => void }) {
  const [film, setFilm] = useState<boolean | null>(null)

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    setFilm(!reduced)
  }, [])

  if (film === false) return <OpeningSequence anchor={anchor} onDone={onDone} />
  return <OpeningFilm onDone={onDone} onFallback={() => setFilm(false)} />
}
