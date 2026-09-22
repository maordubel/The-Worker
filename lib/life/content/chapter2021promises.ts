import type { LifeState } from '../types'
import { PARTNER_TAG } from '../partner'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import type { Conversation } from './script'
import { PORTRAIT_FAMILY } from './chapter2011family'

/**
 * L07–L09 · "אמרת שתחזור" · 2021 — הפרק השלישי של חיי הבית.
 *
 * **שני חיים עוברים בפרק הזה, ושניהם נגמרים בו** (כלל 75).
 * · **עם ילד** — המשחק הראשון שלו (`L07`), ההבטחה (`L08`), והאירוע שלו (`L09`).
 * · **בלי ילד** — ההבטחה בלבד. היא הסצנה היחידה שהתסריט כותב לכל חיים, ולכן היא
 *   גם זו שמחזיקה את הפרק לבד.
 *
 * **`L08` היא התשלום של הבטחה שנשארה פתוחה.** `L04.3` ("ערב קבוע, בלי לבדוק את
 * היומן") מרים `promise:householdEvening` ואיש לא סגר אותו — חוט פתוח, בדיוק מה
 * ש-`NEEDS_A_HOME` מתאר (*"יש `promise:` כדגל, אין מבנה עם מועד"*). התסריט קובע לו
 * מועד: `due: "L08"`. אז כאן הוא נסגר, בשלוש הצורות שהתסריט כותב — תיקון מוצע,
 * תיקון שבוצע, או "אני עדיין לא מסוגל". ומי שלא הבטיח שומע את הגרסה שבה אין הפרה:
 * *"זוכר ששאלתי מה שלומך?"*, עם קרן.
 *
 * **ו-`TARGET` נפתר לשני אנשים בלבד, וזה נאמר.** התסריט מונה שלושה יעדים — בן/בת
 * זוג, קרן או ילד. אף סצנה במשחק עוד לא נותנת **לילד** הבטחה שאפשר להפר, ולכן
 * היעד הזה אינו כאן; ענף שנפתח על הבטחה שלא ניתנה היה מדבר על משהו שלא קרה.
 *
 * **הילד אינו שורה במרשם.** הוא `RUNTIME_ROLES['הילד']` — תפקיד — והתסריט אומר
 * שהשם והתאריך נקבעים בסיכום חיים מפורש שעוד לא נבנה. לכן אין כאן `rel` על הילד:
 * יחסים עם אדם שאין לו מזהה הם מספר שאין לו בעלים. מה שנשאר הוא מה שהוא עשה,
 * כדגל, ומה שזה עשה לפוגי.
 */

export const PORTRAIT_PROMISES: Record<string, string> = {
  ...PORTRAIT_FAMILY,
  /** הילד — תפקיד בלי פיגורה משלו; ניצב כללי עד שהציור שלו ינחת (כלל 67) */
  'הילד': 'faceYoung',
}

export function objectivePromises(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  const child = Boolean(state.flags['life:child'])
  if (child && !state.flags['pr:first']) return sceneId === 'home' ? null : 'בבית. הוא שואל אם חייבים להישאר עד הסוף.'
  if (!state.flags['pr:promise']) return sceneId === 'home' ? null : 'בבית, ליד המקרר. מישהו מחכה לשמוע מה נעשה בפעם הבאה.'
  if (child && !state.flags['pr:scarf']) return sceneId === 'pitch' ? null : 'במגרש. בשבת הוא משחק, והוא ביקש שתבוא.'
  return null
}

export const ENDINGS_PROMISES: Record<string, EndingCard> = {
  repaired: {
    id: 'repaired',
    titleHe: 'לא למה לא הודעת',
    bodyHe:
      'איחרת, ולא הודעת. לא ביקשת שיקראו לזה בסדר — הצעת תיקון שאפשר לבדוק, או ביצעת את זה שכבר סוכם. זה לא מוחק את הערב ההוא, וזה גם לא היה אמור.',
    memoryHe: 'יומן, עם שורה אחת שנכתבה פעמיים.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  kept: {
    id: 'kept',
    titleHe: 'עכשיו יש לי תשובה',
    bodyHe:
      'לא הייתה הבטחה שבורה לתקן. קרן שאלה אם אתה זוכר ששאלה מה שלומך, ואמרת שעכשיו יש לך תשובה — והפעם היא הייתה עליך, לא על המשחק.',
    memoryHe: 'שיחה שנמשכה יותר מתוצאה.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
  his: {
    id: 'his',
    titleHe: 'רשמתי את השעה שלך',
    bodyHe:
      'הוא ביקש שתבוא לראות אותו, ואמר שהוא יודע מה יש בשבת. באת — או סידרת חלק שבאמת אפשר, או אמרת בכנות שלא — ובכל אחת מהן הוא שמע שהשעה שלו נרשמה.',
    memoryHe: 'דף משחק של ילדים, עם שם אחד מוקף.',
    memoryItem: 'folded-paper',
    presence: 'inside',
  },
}

export const BEATS_PROMISES: Beat[] = [
  { id: 'pr-first', at: 'home', trigger: 'enter', when: { all: [{ flag: 'life:child' }], none: [{ flag: 'pr:first' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'pr-first' }] },
  /**
   * ההבטחה — ראשונה למי שאין לו ילד, ושנייה למי שיש: הביט הזה מחכה לסצנת הילד רק
   * כשיש ילד לחכות לו.
   */
  // ליד המקרר של הבית שלו (`homeAdult`) — אותו חדר כמו הילד, ולכן שעון: הוא לא יוצא ונכנס כדי לשמוע
  { id: 'pr-promise', at: 'home', trigger: 'clock', when: { none: [{ flag: 'pr:promise' }], any: [{ flag: 'pr:first' }, { notFlag: 'life:child' }] }, delayMs: 1200, do: [{ a: 'talk', conversation: 'pr-promise' }] },
  { id: 'pr-scarf', at: 'pitch', trigger: 'enter', when: { all: [{ flag: 'life:child' }, { flag: 'pr:promise' }], none: [{ flag: 'pr:scarf' }] }, delayMs: 700, do: [{ a: 'talk', conversation: 'pr-scarf' }] },
  /** הסגירה — אחרי ההבטחה למי שאין לו ילד, ואחרי האירוע שלו למי שיש */
  { id: 'pr-close', trigger: 'clock', when: { all: [{ flag: 'pr:promise' }], none: [{ flag: 'pr:done' }], any: [{ flag: 'pr:scarf' }, { notFlag: 'life:child' }] }, delayMs: 1200, do: [{ a: 'flag', flag: 'pr:done' }, { a: 'talk', conversation: 'pr-close' }] },
]

export const CONVERSATIONS_PROMISES: Conversation[] = [
  {
    id: 'pr-first',
    nameHe: 'הילד',
    branches: [
      {
        lines: [
          { who: 'הילד', text: 'חייבים להישאר עד הסוף?' },
          { who: 'פוגי', text: 'לא.' },
          { who: 'הילד', text: 'גם אם יש גול?' },
          { who: 'פוגי', text: 'גם.' },
          { who: 'קובי', text: 'הוא לא מאמין לך. אני מבין אותו.' },
        ],
        choices: [
          {
            id: 'exit',
            text: '"אתה אומר לי מתי מספיק."',
            then: [
              { e: 'flag', flag: 'pr:first' },
              { e: 'flagValue', flag: 'pr:firstMatch', value: 'exit_agreed' },
              { e: 'time', minutes: 90 },
              { e: 'energy', delta: -8 },
              { e: 'memory', item: 'ticket-stub', id: 'pr-child-first-match' },
              { e: 'proof', kind: 'child_agency', proofId: 'child_agency:{chapter}:first', subjectHe: 'המשחק הראשון שלו', noteHe: 'היציאה סוכמה לפני הכניסה, והוא החליט מתי.' },
              { e: 'toast', text: 'הילד: "אז אני רוצה לנסות." — "אתה אומר לי מתי מספיק."', tone: 'plain' },
            ],
          },
          {
            id: 'home',
            text: '(לראות קודם בבית, ולהחליט יחד בהמשך.)',
            then: [
              { e: 'flag', flag: 'pr:first' },
              { e: 'flagValue', flag: 'pr:firstMatch', value: 'tv' },
              { e: 'time', minutes: 90 },
              { e: 'proof', kind: 'child_agency', proofId: 'child_agency:{chapter}:first', subjectHe: 'המשחק הראשון שלו', noteHe: 'לא התחיל ביציע; התחיל בשאלה.' },
              { e: 'toast', text: 'הילד: "פה אפשר לדבר?" — "אצלנו אפשר גם שם. בבית שומעים יותר טוב."', tone: 'plain' },
            ],
          },
          {
            id: 'must',
            text: '"צריך להישאר עד הסוף. ככה זה."',
            then: [
              { e: 'flag', flag: 'pr:first' },
              { e: 'flagValue', flag: 'pr:firstMatch', value: 'declined' },
              { e: 'flag', flag: 'pr:childPressured' },
              { e: 'wellbeing', key: 'regret', delta: 5 },
              { e: 'toast', text: 'הילד: "אז אני לא רוצה לבוא." — "טוב. לא נלך ככה."', tone: 'red' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'pr-promise',
    nameHe: null,
    branches: [
      /** ההבטחה של `L04.3` נשארה פתוחה, ויש מי שאליו היא ניתנה */
      {
        when: { all: [{ flag: 'promise:householdEvening' }, { flag: 'life:partner' }] },
        lines: [
          { who: PARTNER_TAG, text: 'אמרת שתחזור.' },
          { who: 'פוגי', text: 'המשחק התארך.' },
          { who: PARTNER_TAG, text: 'זה מסביר למה איחרת. לא למה לא הודעת.' },
          { who: 'פוגי', text: 'נכון.' },
          { who: PARTNER_TAG, text: 'אני רוצה לדעת מה נעשה בפעם הבאה.' },
        ],
        choices: [
          {
            id: 'offer',
            text: '(להודות — ולהציע תיקון שהצד השני מסכים לו.)',
            then: [
              { e: 'flag', flag: 'pr:promise' },
              { e: 'flagValue', flag: 'pr:kind', value: 'repaired' },
              { e: 'flagValue', flag: 'pr:repair', value: 'specific' },
              { e: 'personality', key: 'honesty', delta: 3 },
              { e: 'proof', kind: 'promise_renegotiated', proofId: 'promise_renegotiated:{chapter}:evening', subjectHe: 'הערב הקבוע', noteHe: 'הודה בהפרה, והציע תוכנית שאפשר לבדוק — לא "יהיה בסדר".' },
              { e: 'toast', text: '"את התוכנית הזאת אפשר לבדוק." — "אני לא מבקש שתקרא לזה בסדר."', tone: 'plain' },
            ],
          },
          {
            id: 'do',
            text: '(לבצע את התיקון שכבר סוכם. הפעם בזמן.)',
            then: [
              { e: 'flag', flag: 'pr:promise' },
              { e: 'flagValue', flag: 'pr:kind', value: 'repaired' },
              { e: 'time', minutes: 45 },
              { e: 'proof', kind: 'promise_kept', proofId: 'promise_kept:{chapter}:evening', subjectHe: 'הערב הקבוע', noteHe: 'הגיע בזמן, לפי מה שאמר.' },
              { e: 'toast', text: '"הפעם הגעת בזמן." — "הפעם תכננתי לפי מה שאמרתי."', tone: 'plain' },
            ],
          },
          {
            id: 'not-yet',
            text: '"אני עדיין לא מסוגל להתחייב."',
            then: [
              { e: 'flag', flag: 'pr:promise' },
              { e: 'flagValue', flag: 'pr:kind', value: 'repaired' },
              { e: 'flagValue', flag: 'pr:commitment', value: 'paused' },
              { e: 'wellbeing', key: 'regret', delta: 3 },
              { e: 'toast', text: '"אז לא נתכנן כרגע על בסיס ההבטחה הזאת." — "אני מבין."', tone: 'plain' },
            ],
          },
        ],
      },
      /** אין הפרה פתוחה — הגרסה שבה ההבטחה מתקיימת, עם קרן */
      {
        lines: [
          { who: 'קרן', text: 'זוכר ששאלתי מה שלומך?' },
          { who: 'פוגי', text: 'עכשיו יש לי תשובה.' },
          { who: 'קרן', text: 'לקח לך.' },
          { who: 'פוגי', text: 'עשר שנים ומשהו.' },
        ],
        choices: [
          {
            id: 'meet',
            text: '(לקיים את המפגש. בלי למהר.)',
            then: [
              { e: 'flag', flag: 'pr:promise' },
              { e: 'flagValue', flag: 'pr:kind', value: 'kept' },
              { e: 'time', minutes: 30 },
              { e: 'rel', who: 'keren', axis: 'bond', delta: 2 },
              { e: 'rel', who: 'keren', axis: 'trust', delta: 5 },
              { e: 'proof', kind: 'promise_kept', proofId: 'promise_kept:{chapter}:keren', subjectHe: 'המפגש עם קרן, עשר שנים אחרי', noteHe: 'לא הייתה הפרה לתקן; היה מפגש, והוא קרה.' },
              { e: 'toast', text: 'קרן: "זוכר ששאלתי מה שלומך?" — "עכשיו יש לי תשובה."', tone: 'plain' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'pr-scarf',
    nameHe: 'הילד',
    branches: [
      {
        lines: [
          { who: 'הילד', text: 'אני רוצה שתבוא לראות אותי.' },
          { who: 'פוגי', text: 'מתי?' },
          { who: 'הילד', text: 'בשבת.' },
          { who: 'פוגי', text: 'בשבת יש—' },
          { who: 'הילד', text: 'אני יודע מה יש בשבת.' },
        ],
        choices: [
          {
            id: 'go',
            text: '(לבחור באירוע שלו, ולסדר את השאר.)',
            then: [
              { e: 'flag', flag: 'pr:scarf' },
              { e: 'time', minutes: 90 },
              { e: 'energy', delta: -10 },
              { e: 'flagValue', flag: 'pr:interest', value: 'respected' },
              { e: 'proof', kind: 'child_event', proofId: 'child_event:{chapter}:saturday', subjectHe: 'השבת שלו', noteHe: 'רשם את השעה שלו, לא רק את שלהם.' },
              { e: 'toast', text: 'הילד: "אתה באמת בא?" — "כן. רשמתי את השעה שלך, לא רק את שלהם."', tone: 'plain' },
            ],
          },
          {
            id: 'split',
            text: '(למצוא חלוקה אפשרית. בלי להבטיח את הבלתי אפשרי.)',
            then: [
              { e: 'flag', flag: 'pr:scarf' },
              { e: 'time', minutes: 60 },
              { e: 'energy', delta: -10 },
              { e: 'flagValue', flag: 'pr:interest', value: 'coordinated' },
              { e: 'proof', kind: 'child_event', proofId: 'child_event:{chapter}:saturday', subjectHe: 'השבת שלו', noteHe: 'בדק קודם, ואז אמר כן על החלק שבאמת אפשר.' },
              { e: 'toast', text: 'הילד: "אתה תהיה בחלק שלי?" — "בדקתי. כן. אחר כך אצא." — "אז בסדר."', tone: 'plain' },
            ],
          },
          {
            id: 'miss',
            text: '"הפעם לא אגיע." (ולשמוע את האכזבה.)',
            then: [
              { e: 'flag', flag: 'pr:scarf' },
              { e: 'flagValue', flag: 'pr:childEvent', value: 'missed' },
              { e: 'wellbeing', key: 'regret', delta: 6 },
              { e: 'toast', text: 'הילד: "רציתי שתהיה." — "אני יודע. לא אגיד שזה לא חשוב."', tone: 'red' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'pr-close',
    nameHe: null,
    branches: [
      { when: { flag: 'pr:scarf' }, lines: [{ who: null, text: 'דף המשחק של הילדים נשאר על המקרר, ליד היומן.' }], then: [{ e: 'ending', id: 'his' }] },
      { when: { flagIs: { flag: 'pr:kind', value: 'repaired' } }, lines: [{ who: null, text: 'השורה ביומן נכתבה שוב, הפעם בעט.' }], then: [{ e: 'ending', id: 'repaired' }] },
      { lines: [{ who: null, text: 'השיחה נגמרה מאוחר, ואף אחד לא הסתכל בשעון.' }], then: [{ e: 'ending', id: 'kept' }] },
    ],
  },
]
