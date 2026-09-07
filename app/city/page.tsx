import { Proof, type Shot } from './Proof'

/**
 * העיר, כדי להסתכל עליה — **ולזוז בה**.
 *
 *   /city?place=panoTamar
 *
 * למה כאן ולא תחת `/qa`: מסכי ה-QA פטורים מכללי המותג בדיוק משום שהם לא נשלחים, ולכן כל
 * אחד מהם עושה `notFound()` בייצור — יש על זה שומר, והוא צדק כשהפיל את הניסיון הראשון
 * שלי לפרסם מסך QA. אבל הדבר שנבדק כאן הוא **תחושת הליכה**, ותמונה סטטית לא יכולה להראות
 * אותה; מאור חייב להחזיק את זה ביד. אז זה עמוד רגיל, שמציית לכללי המותג כמו כל עמוד אחר.
 * הוא לא כותב שום דבר לשמירה ולא נוגע במצב של אף שחקן, והוא נבלע לתוך המשחק ברגע ששלב 2
 * נכנס.
 */
export const dynamic = 'force-dynamic'

type Q = Record<string, string | string[] | undefined>

const num = (q: Q, key: string, fallback: number): number => {
  const raw = Array.isArray(q[key]) ? q[key]?.[0] : q[key]
  const value = Number(raw)
  return Number.isFinite(value) ? value : fallback
}

export default async function Page({ searchParams }: { searchParams: Promise<Q> }) {
  const q = await searchParams
  const place = (Array.isArray(q.place) ? q.place[0] : q.place) ?? 'panoTamar'
  const shot: Shot = {
    place,
    x: num(q, 'x', 0),
    z: num(q, 'z', 0),
    yaw: num(q, 'yaw', 0),
    pitch: num(q, 'pitch', 0),
    fov: num(q, 'fov', 58),
    actor: q.actor !== '0',
    touch: q.touch !== '0',
  }
  return <Proof shot={shot} />
}
