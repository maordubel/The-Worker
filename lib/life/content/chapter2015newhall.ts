import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'
import { PORTRAIT_GROWTH } from './chapter2012growth'

/**
 * N05–N06 · "בית עם כתובת אחרת" · 2015–2016, פרק אחד.
 *
 * שתי סצנות, שני מקומות שאינם קיימים, **ועוגן אחד** — וזה לא קיצור אלא מה שהתסריט
 * עצמו מורה.
 *
 * **N06 אסור לו עוגן.** הוראת ההפקה כתובה במפורש: *"V4-BLOOMFIELD ו-V4-COVID הם
 * מזהי הקשר תקופתי לפעולה בדיונית, לא טענת אימות חדשה. **אין לחבר אותם לארכיון
 * כמשחק מתועד**."* ולכן הסצנה היא ערב שיוצאים אליו, בלי תאריך ובלי תוצאה. מה שהיא
 * כן מקפידה עליו — *"אין להציג את בלומפילד כמארח בזמן שיפוץ"* — מתקיים מעצמו:
 * כל 63 משחקי הבית של 2015/16–2017/18 ב-`matches.json` נושאים `venueSlug: null`,
 * כלומר המקור לא נוקב באצטדיון ולכן גם המשחק לא.
 *
 * **והאולם החדש הוא עובדה בארכיון, לא משחק.** `ussishkin.json` מחזיק את `drivein`
 * מ-ynet: אולם ביתי חדש במתחם הדרייב-אין בתחילת 2015, 3,400 מקומות מול 2,000
 * באוסישקין, אחרי שבע שנים בלי בית (`homeless`). לכן `2015-drivein` הוא **עוגן
 * סיכום** ולא משחק — אותה צורה בדיוק שנבחרה לעליית 2009, ומאותה סיבה: מה שאין לו
 * תאריך נשאר בלי תאריך (כלל 80).
 *
 * **שני החדרים.** אין דרייב-אין ואין מגרש חלופי, ו-`life:places` מדפיס את שניהם
 * כ-`needs-painting`. הצורה הכנה לזה היא זו של טדי ב-2010: המקום הוא כרטיס וזמן,
 * והחדר הוא המקום שממנו יוצאים אליו — הרחוב לפני, והסלון של אבא אחרי.
 */

export const PORTRAIT_NEWHALL: Record<string, string> = {
  ...PORTRAIT_GROWTH,
}

export function objectiveNewHall(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (!state.flags['nr:hall']) return sceneId === 'drive-in' ? null : 'הדרייב אין. אפי רוצה להראות משהו, ומתוקי בא.'
  if (!state.flags['nr:route']) return sceneId === 'home' ? null : 'אצל אבא. הוא שואל מאיפה יוצאים.'
  return null
}

export const ENDINGS_NEWHALL: Record<string, EndingCard> = {
  led: {
    id: 'led',
    titleHe: 'תן לי פעם אחת',
    bodyHe:
      'בדקת מסלול, הכנת חלופה, והובלת. קובי אמר "לא רע" ואמרת לו לשמור את המחמאה לסוף, והוא אמר שבסוף הוא ישכח שהתכוון — וזה היה נכון, ולא היה חשוב.',
    memoryHe: 'דף עם שתי דרכים, השנייה מסומנת.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  sofa: {
    id: 'sofa',
    titleHe: 'אין פקקים בסלון',
    bodyHe:
      'ראיתם מהבית. הוא אמר שאין פקקים בסלון ואמרת שיש, בדרך למטבח, והוא צחק כמו שהוא צוחק — פעם אחת, בקול נמוך, ואז שקט.',
    memoryHe: 'שני ספלים, אחד מלא.',
    memoryItem: 'folded-paper',
    presence: 'television',
  },
  solo: {
    id: 'solo',
    titleHe: 'תספר איך היה להגיע',
    bodyHe:
      'הלכת לבד, ואמרת לו מראש. הוא ביקש שתספר איך היה להגיע; שאלת מה אם תאחר, והוא אמר שתספר יותר קצר. זה לא היה עלבון ושניכם ידעתם.',
    memoryHe: 'כרטיס נסיעה, מקופל לרוחב.',
    memoryItem: 'ticket-stub',
    presence: 'inside',
  },
}

export const BEATS_NEWHALL: Beat[] = [
  // N05 *"הדרייב אין, 2015"* — מ-21.9.2026 יש לו ציור, והפרק מתחיל בתוכו
  { id: 'nr-hall', at: 'drive-in', trigger: 'enter', when: { none: [{ flag: 'nr:hall' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'nr-hall' }] },
  { id: 'nr-route', at: 'home', trigger: 'enter', when: { all: [{ flag: 'nr:hall' }], none: [{ flag: 'nr:route' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'nr-route' }] },
]

export const CONVERSATIONS_NEWHALL: Conversation[] = [
  {
    id: 'nr-hall',
    nameHe: 'אפי',
    branches: [
      {
        lines: [
          { who: 'אפי', text: 'פה יהיה לנו מקום.' },
          { who: 'פוגי', text: 'זה לא אוסישקין.' },
          { who: 'אפי', text: 'לא אמרתי שזה אוסישקין.' },
          { who: 'מתוקי', text: 'מותר לי לאהוב את זה בלי לעבור מבחן?' },
          { who: 'פוגי', text: 'כן. מגיע לך.' },
        ],
        choices: [
          {
            id: 'short',
            text: '(זיכרון אחד קצר — ואז שיבחר מקום בעצמו.)',
            then: [
              { e: 'flag', flag: 'nr:hall' },
              { e: 'time', minutes: 20 },
              { e: 'rel', who: 'metuki', axis: 'bond', delta: 3 },
              { e: 'memory', item: 'folded-paper', id: 'nr-new-hall' },
              { e: 'toast', text: 'מתוקי: "אז איפה עומדים היום?" — "בוא נמצא."', tone: 'plain' },
            ],
          },
          {
            id: 'gatekeep',
            text: '(להתעקש על איך היה פעם.)',
            then: [
              { e: 'flag', flag: 'nr:hall' },
              { e: 'flagValue', flag: 'nr:gatekeeping', value: true },
              { e: 'rel', who: 'metuki', axis: 'bond', delta: -1 },
              { e: 'toast', text: 'אפי: "אתה מראה לו אולם או בודק אם הוא ראוי לו?" — "נסחפתי קצת."', tone: 'red' },
            ],
          },
          {
            id: 'ritual',
            text: '(לשמור את ההשוואה לעצמי, ולקבוע טקס חדש.)',
            then: [
              { e: 'flag', flag: 'nr:hall' },
              { e: 'flagValue', flag: 'nr:ritual', value: true },
              { e: 'rel', who: 'efi', axis: 'bond', delta: 3 },
              { e: 'redheart', key: 'terraceCulture', delta: 3 },
              { e: 'toast', text: 'אפי: "לפני משחק נפגשים פה?" — "כן. נקבע משהו משלנו."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'nr-route',
    nameHe: 'קובי',
    branches: [
      {
        lines: [
          { who: 'קובי', text: 'מאיפה יוצאים?' },
          { who: 'פוגי', text: 'הפעם אני בדקתי.' },
          { who: 'קובי', text: 'גם אני פעם בדקתי.' },
          { who: 'פוגי', text: 'אז תן לי פעם אחת.' },
          { who: 'קובי', text: 'אני נותן. אני רק שואל שוב.' },
        ],
        choices: [
          {
            id: 'lead',
            text: '(מסלול, חלופה — ואני מוביל.)',
            then: [
              { e: 'flag', flag: 'nr:route' },
              { e: 'time', minutes: 45 },
              { e: 'energy', delta: -5 },
              { e: 'skill', skill: 'organization', delta: 3, why: 'מסלול, וגם מה עושים אם הוא ייסגר' },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 2 },
              { e: 'rel', who: 'kobi', axis: 'trust', delta: 3 },
              { e: 'proof', kind: 'travel_preparation', proofId: 'travel_preparation:{chapter}:route', subjectHe: 'הדרך למגרש החלופי', noteHe: 'שתי דרכים, והשנייה נבדקה לפני שיצאו.' },
              { e: 'presence', mode: 'inside' },
              { e: 'attend' },
              { e: 'toast', text: 'קובי: "לא רע." — "תשמור את המחמאה לסוף." — "בסוף אני אשכח שהתכוונתי."', tone: 'plain' },
              { e: 'ending', id: 'led' },
            ],
          },
          {
            id: 'sofa',
            text: '(הפעם רואים איתו בבית.)',
            then: [
              { e: 'flag', flag: 'nr:route' },
              { e: 'time', minutes: 90 },
              { e: 'energy', delta: -5 },
              { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 },
              { e: 'presence', mode: 'television' },
              { e: 'ending', id: 'sofa' },
            ],
          },
          {
            id: 'solo',
            text: '"אני מגיע לבד. אמרתי לך מראש."',
            then: [
              { e: 'flag', flag: 'nr:route' },
              { e: 'flagValue', flag: 'nr:temporaryHome', value: 'solo' },
              { e: 'personality', key: 'honesty', delta: 2 },
              { e: 'presence', mode: 'inside' },
              { e: 'attend' },
              { e: 'ending', id: 'solo' },
            ],
          },
        ],
      },
    ],
  },
]
