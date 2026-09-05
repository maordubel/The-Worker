/**
 * הידיים במשחק — the short things a supporter does with his body while a match runs.
 *
 * The brief's list: lift a scarf, join the song, look towards a noise, take a hand, make
 * room, get carried forward or stay put. None of them changes a score (rule 2.2 of the
 * Stage B brief: results are fixed, lives branch). Each one is one line and two or three
 * choices, answered in a second, and each leaves a flag the night can remember — who you
 * held, whether you sang, where you stood — which is what an NPC means when he says
 * "אתה זוכר?" a chapter later.
 *
 * No score, no scorer, no opponent in any line: `tests/life-stage-b.test.ts` reads these.
 */
import type { Conversation } from './script'

export const CONVERSATIONS_MATCH: Conversation[] = [
  // ------------------------------------------------------------------------ 1986 ---
  {
    id: 'm86-stand',
    nameHe: null,
    branches: [
      {
        lines: [{ who: null, text: 'שמונת אלפים איש, ואתה בגובה של החגורות שלהם. איפה אתה?' }],
        choices: [
          { id: 'fence', text: 'על הגדר. לראות.', then: [{ e: 'flag', flag: 'm86:fence' }, { e: 'personality', key: 'curiosity', delta: 2 }, { e: 'redheart', key: 'footballLove', delta: 2 }] },
          { id: 'step', text: 'על המדרגה, בין הגדולים.', then: [{ e: 'flag', flag: 'm86:step' }, { e: 'redheart', key: 'terraceCulture', delta: 3 }, { e: 'wellbeing', key: 'belonging', delta: 3 }] },
          { id: 'look', text: 'לחפש את אבא בעיניים.', then: [{ e: 'flag', flag: 'm86:looked' }, { e: 'redheart', key: 'familyTradition', delta: 2 }, { e: 'wellbeing', key: 'loneliness', delta: 2 }] },
        ],
      },
    ],
  },
  {
    id: 'm86-breath',
    nameHe: null,
    branches: [
      {
        lines: [{ who: null, text: 'השורה כולה נושמת ביחד. מה אתה עושה?' }],
        choices: [
          { id: 'breathe', text: 'לנשום. לאט.', then: [{ e: 'flag', flag: 'm86:breathed' }, { e: 'personality', key: 'courage', delta: 2 }] },
          { id: 'shout', text: 'לצעוק עם כולם.', then: [{ e: 'flag', flag: 'm86:shouted' }, { e: 'redheart', key: 'terraceCulture', delta: 3 }, { e: 'personality', key: 'impulsiveness', delta: 1 }] },
          { id: 'hand', text: 'לתפוס יד של מישהו שלידך.', then: [{ e: 'flag', flag: 'm86:held' }, { e: 'redheart', key: 'community', delta: 3 }, { e: 'wellbeing', key: 'belonging', delta: 4 }] },
        ],
      },
    ],
  },
  // ------------------------------------------------------------------------ 1998 ---
  {
    id: 'm98-where',
    nameHe: null,
    branches: [
      {
        lines: [{ who: null, text: 'האיש מאחוריך מחזיק טרנזיסטור ליד האוזן. לאן אתה מסתכל?' }],
        choices: [
          { id: 'pitch', text: 'על הדשא. המשחק שלנו.', then: [{ e: 'flag', flag: 'm98:pitch' }, { e: 'redheart', key: 'footballLove', delta: 2 }] },
          { id: 'radio', text: 'על הטרנזיסטור.', then: [{ e: 'flag', flag: 'm98:radio' }, { e: 'wellbeing', key: 'stress', delta: 3 }, { e: 'personality', key: 'curiosity', delta: 1 }] },
          { id: 'room', text: 'לפנות לו מקום, שישמע.', then: [{ e: 'flag', flag: 'm98:room' }, { e: 'personality', key: 'empathy', delta: 2 }, { e: 'redheart', key: 'community', delta: 2 }] },
        ],
      },
    ],
  },
  {
    id: 'm98-listen',
    nameHe: null,
    branches: [
      {
        lines: [{ who: null, text: '"מה שם? מה שם?" — כל השורה שואלת את הטרנזיסטור.' }],
        choices: [
          { id: 'ask', text: 'לשאול גם.', then: [{ e: 'flag', flag: 'm98:asked' }, { e: 'wellbeing', key: 'stress', delta: 2 }] },
          { id: 'sing', text: 'להתחיל שיר. שיפסיקו לשאול.', then: [{ e: 'flag', flag: 'm98:sang' }, { e: 'redheart', key: 'terraceCulture', delta: 3 }, { e: 'personality', key: 'courage', delta: 1 }] },
          { id: 'quiet', text: 'לשתוק. להסתכל על המגרש.', then: [{ e: 'flag', flag: 'm98:quiet' }, { e: 'personality', key: 'independence', delta: 1 }] },
        ],
      },
    ],
  },
  // ------------------------------------------------------------------------ 1999 ---
  {
    id: 'm99-scarf',
    nameHe: null,
    branches: [
      {
        lines: [{ who: null, text: 'הצד שלכם מרים צעיפים. ארבעים אלף ידיים.' }],
        choices: [
          { id: 'scarf', text: 'להרים את הצעיף.', then: [{ e: 'flag', flag: 'm99:scarf' }, { e: 'redheart', key: 'terraceCulture', delta: 3 }, { e: 'wellbeing', key: 'belonging', delta: 3 }] },
          { id: 'song', text: 'להצטרף לשיר.', then: [{ e: 'flag', flag: 'm99:song' }, { e: 'redheart', key: 'community', delta: 3 }] },
          { id: 'watch', text: 'להסתכל על הצד השני.', then: [{ e: 'flag', flag: 'm99:watched' }, { e: 'personality', key: 'curiosity', delta: 2 }] },
        ],
      },
    ],
  },
  {
    id: 'm99-behind',
    nameHe: null,
    branches: [
      {
        lines: [{ who: null, text: 'מאחור, מישהו מקלל בקול. לידך, מישהו שותק. מה אתה?' }],
        choices: [
          { id: 'push', text: 'לדחוף קדימה, לגדר.', then: [{ e: 'flag', flag: 'm99:forward' }, { e: 'personality', key: 'impulsiveness', delta: 2 }, { e: 'redheart', key: 'troubleAffinity', delta: 1 }] },
          { id: 'stay', text: 'להישאר במקום. לנשום.', then: [{ e: 'flag', flag: 'm99:stayed' }, { e: 'personality', key: 'courage', delta: 2 }] },
          { id: 'shoulder', text: 'יד על הכתף של מי ששותק.', then: [{ e: 'flag', flag: 'm99:shoulder' }, { e: 'personality', key: 'empathy', delta: 2 }, { e: 'redheart', key: 'community', delta: 3 }] },
        ],
      },
    ],
  },
  // ------------------------------------------------------------------- 13.5.2000 ---
  {
    id: 'm00-stand',
    nameHe: null,
    branches: [
      {
        lines: [{ who: null, text: 'יציע בטון, בלי מקום. מי לידך?' }],
        choices: [
          { id: 'kobi', text: 'אבא. כמו בשמונים ושלוש.', when: { flag: 't:with-kobi' }, hidden: true, then: [{ e: 'flag', flag: 'm00:kobi' }, { e: 'rel', who: 'kobi', axis: 'bond', delta: 3 }, { e: 'redheart', key: 'familyTradition', delta: 3 }] },
          { id: 'someone', text: 'מי שהגיע. זה מספיק.', then: [{ e: 'flag', flag: 'm00:someone' }, { e: 'wellbeing', key: 'belonging', delta: 3 }] },
          { id: 'fence', text: 'הגדר. אף אחד.', then: [{ e: 'flag', flag: 'm00:fence' }, { e: 'personality', key: 'independence', delta: 2 }, { e: 'wellbeing', key: 'loneliness', delta: 2 }] },
        ],
      },
    ],
  },
  {
    id: 'm00-hold',
    nameHe: null,
    branches: [
      {
        lines: [{ who: null, text: 'עשרים דקות. הידיים לא יודעות מה לעשות.' }],
        choices: [
          { id: 'hold', text: 'להחזיק במי שלידך.', then: [{ e: 'flag', flag: 'm00:held' }, { e: 'redheart', key: 'community', delta: 3 }, { e: 'wellbeing', key: 'belonging', delta: 3 }] },
          { id: 'clock', text: 'להסתכל על השופט. רק על השופט.', then: [{ e: 'flag', flag: 'm00:clock' }, { e: 'wellbeing', key: 'stress', delta: 4 }] },
          { id: 'sing', text: 'לשיר. שיהיה מה לעשות עם הפה.', then: [{ e: 'flag', flag: 'm00:sang' }, { e: 'redheart', key: 'terraceCulture', delta: 3 }] },
        ],
      },
    ],
  },
  // ------------------------------------------------------------------- 17.5.2000 ---
  {
    id: 'm00-memory',
    nameHe: null,
    branches: [
      {
        lines: [{ who: null, text: 'זיכרונות באים כשלא מזמינים אותם. איזה?' }],
        choices: [
          { id: 'shoulders', text: 'הכתפיים. שמונים ושלוש.', then: [{ e: 'flag', flag: 'm00:mem-shoulders' }, { e: 'redheart', key: 'familyTradition', delta: 3 }, { e: 'redheart', key: 'historyMemory', delta: 2 }] },
          { id: 'hall', text: 'האולם. הקיץ שאחרי הגביע.', then: [{ e: 'flag', flag: 'm00:mem-hall' }, { e: 'redheart', key: 'basketballLove', delta: 3 }, { e: 'redheart', key: 'historyMemory', delta: 2 }] },
          { id: 'laces', text: 'השרוכים. לא להאמין לכלום עד הסוף.', then: [{ e: 'flag', flag: 'm00:mem-laces' }, { e: 'wellbeing', key: 'stress', delta: 3 }, { e: 'redheart', key: 'historyMemory', delta: 2 }] },
        ],
      },
    ],
  },
]
