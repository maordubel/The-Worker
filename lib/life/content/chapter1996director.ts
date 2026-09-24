import { at } from '../clock'
import type { LifeState } from '../types'

import type { Beat } from './beats'
import type { EndingCard } from './chapter1986'
import { RHYTHM_SUBJECT, TAXI_AGOROT } from './chapter1996army'
import type { Conversation } from './script'

const ARMY_PROMISE_DONE = 'promise:army:kept'

/**
 * B6 — Director's Cut.
 *
 * The old version had the right ingredients and the wrong seam: 16.11.1996 was used as a
 * home Saturday at Bloomfield although the historical fixture was away, and Gate 5 could
 * become an objective without giving the player a clean physical action that actually
 * took them there. The corrected sequence moves the first-home-in-uniform beat to
 * 23.11.1996 and makes the terrace decision an explicit travel choice.
 *
 * No score/opponent/scorer is authored here. Those remain archive facts.
 */
export const A1 = 'life:army:d1'
export const A2 = 'life:army:d2'
export const A3 = 'life:army:d3'
export const A4 = 'life:army:d4'
export const A5 = 'life:army:d5'

export const PORTRAIT_ARMY: Record<string, string> = {
  'פוגי': 'faceHero80',
  'קובי': 'faceKobi',
  'רחל': 'faceRachel90',
  'אופיר': 'faceOfir',
  'עמית': 'faceAmit',
  'רפי מהקיוסק': 'faceOldMan',
  'בארי': 'faceBarry',
  'אסף': 'faceAsaf',
  'מלמד': 'faceMelamed',
  'פרדי': 'faceFreddy',
  'לירון': 'faceLiron',
  'ירון': 'faceYaron',
  'המפקד': 'faceCommander',
  'נהג': 'faceDriver',
  'אוהד': 'faceSupporter',
  'חייל': 'faceSupporterB',
  'סדרן': 'faceUsher',
  'קופאית': 'faceWoman',
  'המוכר': 'faceVendor',
  'הגבר': 'faceSupporterB',
}

export function objectiveArmy(state: LifeState, sceneId: string): string | null {
  if (state.chapterDone) return null
  if (state.flags[A5]) return state.flags['a5:done'] ? null : 'החורף נגמר. תחליט מה לוקחים ממנו הלאה.'
  if (state.flags[A4]) return state.flags['a4:road'] ? null : 'לירון מחכה ליד הקיוסק. יש נסיעה, ויש בסיס בבוקר.'
  if (state.flags[A3]) return state.flags['a3:decided'] ? null : 'האוטובוס כבר מעלה נוסעים. לבחור עכשיו.'
  if (state.flags[A2]) {
    if (state.flags['a2:gate5-intent'] && !state.flags['a2:gate5-seen']) return 'להיכנס לשער 5. לא רק לדבר עליו.'
    if (!state.flags['a2:chose']) return 'שער 7, שער 5 — או להישאר רגע בין שניהם.'
    return null
  }
  return state.flags['a1:packed'] ? null : sceneId === 'home' ? 'לסגור את התיק. מחר בבוקר — הצבא.' : 'הערב האחרון בבית.'
}

export const ENDINGS_ARMY: Record<string, EndingCard> = {
  home: {
    id: 'home',
    titleHe: 'החורף נגמר',
    bodyHe: 'המדים נשארו, היציע השתנה, והדרך לבסיס התחילה להתחרות בדרך למשחקים. אף בחירה לא סגרה אותך בתוך מסלול אחד — היא רק נתנה לאנשים משהו לזכור.',
    memoryHe: 'טופס חופשה מקופל. בפינה, שעה שנמחקה ונכתבה מחדש.',
    memoryItem: 'folded-paper',
    presence: 'army',
  },
  road: {
    id: 'road',
    titleHe: 'הדרך חזרה',
    bodyHe: 'לילה, רדיו חלש, כביש ארוך. היציע כבר לא מקום שקובי בוחר בשבילך, והבסיס לא מקום שמחכה בסבלנות. מעכשיו כמעט לכל שבת יש מחיר.',
    memoryHe: 'קבלה מתחנת דלק. מאחור נכתב בעט: "שווה".',
    memoryItem: 'folded-paper',
    // (23.9.2026) fixed from 'travelling', which is not a PresenceMode: the pre-overlay
    // ending used 'inside' for this same night in Liron's car, so this restores that.
    presence: 'inside',
  },
}

const DAY = (flag: string, year: number, weekday: number, minute: number, dateHe: string) => [
  { t: 'day.entered', dayId: flag, year, weekday, minute, dateHe } as const,
  { t: 'flag.raised', flag } as const,
]

export const BEATS_ARMY: Beat[] = [
  {
    id: 'army-d1-open',
    at: 'street',
    trigger: 'enter',
    when: { none: [{ flag: A1 }] },
    delayMs: 500,
    do: [
      { a: 'flag', flag: A1 },
      { a: 'card', titleHe: '18 בנובמבר 1996', subHe: 'הערב האחרון לפני הגיוס', ms: 2100 },
      { a: 'lines', lines: [
        { who: null, text: 'אותו רחוב. אותו קיוסק. מחר בבוקר כבר יהיו לך שעות שמישהו אחר קובע.' },
        { who: null, text: 'בבית מחכה תיק פתוח. רחל כבר הכניסה לתוכו יותר גרביים ממה שאדם אחד יכול ללבוש.' },
      ] },
      { a: 'travel', to: 'home', spawn: 'start' },
    ],
  },
  {
    id: 'army-d1-home',
    at: 'home',
    trigger: 'enter',
    when: { flag: A1, none: [{ flag: 'a1:packed' }] },
    delayMs: 350,
    do: [{ a: 'talk', conversation: 'rachel-army' }],
  },
  {
    id: 'army-d1-to-gates',
    trigger: 'clock',
    when: { flag: 'a1:packed', none: [{ flag: A2 }] },
    do: [
      { a: 'card', titleHe: '23 בנובמבר 1996', subHe: 'השבת הראשונה שאתה מגיע אליה במדים', ms: 2600 },
      { a: 'events', events: DAY(A2, 1996, 6, at(14, 30), '23 בנובמבר 1996') },
      { a: 'travel', to: 'bloomfield-outside', spawn: 'start' },
    ],
  },
  {
    id: 'army-d2-open',
    at: 'bloomfield-outside',
    trigger: 'enter',
    when: { flag: A2, none: [{ flag: 'a2:seen' }] },
    delayMs: 600,
    do: [
      { a: 'flag', flag: 'a2:seen' },
      { a: 'talk', conversation: 'a2-arrive' },
    ],
  },
  {
    id: 'army-d2-gate5',
    at: 'gate5',
    trigger: 'enter',
    when: { flag: 'a2:gate5-intent', none: [{ flag: 'a2:gate5-seen' }] },
    delayMs: 350,
    do: [
      { a: 'flag', flag: 'a2:gate5-seen' },
      { a: 'talk', conversation: 'a2-gate5' },
    ],
  },
  {
    id: 'army-d2-close',
    trigger: 'clock',
    when: { all: [{ flag: A2 }, { flag: 'a2:chose' }], none: [{ flag: A3 }] },
    do: [
      { a: 'card', titleHe: 'דצמבר 1996', subHe: 'התחנה המרכזית · לפני הזריחה', ms: 2400 },
      { a: 'events', events: DAY(A3, 1996, 0, at(5, 52), 'דצמבר 1996') },
      { a: 'travel', to: 'bus-station', spawn: 'start' },
    ],
  },
  {
    id: 'army-d3-open',
    at: 'bus-station',
    trigger: 'enter',
    when: { flag: A3, none: [{ flag: 'a3:seen' }] },
    delayMs: 400,
    do: [
      { a: 'flag', flag: 'a3:seen' },
      { a: 'sfx', key: 'bus-door', level: 0.7 },
      { a: 'talk', conversation: 'a3-bus' },
    ],
  },
  {
    id: 'army-d3-to-winter',
    trigger: 'clock',
    when: { flag: 'a3:done', none: [{ flag: A4 }] },
    do: [
      { a: 'card', titleHe: 'חורף 1997', subHe: 'הצבא לא עוצר. גם המועדון לא.', ms: 2500 },
      { a: 'events', events: DAY(A4, 1997, 6, at(13, 0), 'חורף 1997') },
      { a: 'travel', to: 'kiosk', spawn: 'start' },
    ],
  },
  {
    id: 'army-d4-kiosk',
    at: 'kiosk',
    trigger: 'enter',
    when: { flag: A4, none: [{ flag: 'a4:drive' }, { flag: 'a4:stayed' }] },
    delayMs: 350,
    do: [{ a: 'talk', conversation: 'a4-liron' }],
  },
  {
    id: 'army-d4-road',
    at: 'route',
    trigger: 'enter',
    when: { flag: 'a4:drive', none: [{ flag: 'a4:road' }] },
    delayMs: 350,
    do: [
      { a: 'flag', flag: 'a4:road' },
      { a: 'talk', conversation: 'a4-road' },
      { a: 'events', events: DAY(A5, 1997, 2, at(19, 10), 'אביב 1997') },
      { a: 'travel', to: 'kiosk', spawn: 'start' },
    ],
  },
  {
    id: 'army-d4-stay',
    trigger: 'clock',
    when: { flag: 'a4:stayed', none: [{ flag: A5 }] },
    do: [
      { a: 'flag', flag: 'a4:road' },
      { a: 'events', events: DAY(A5, 1997, 2, at(19, 10), 'אביב 1997') },
      { a: 'travel', to: 'kiosk', spawn: 'start' },
    ],
  },
  {
    id: 'army-d5-open',
    at: 'kiosk',
    trigger: 'enter',
    when: { flag: A5, none: [{ flag: 'a5:seen' }] },
    delayMs: 450,
    do: [
      { a: 'flag', flag: 'a5:seen' },
      { a: 'talk', conversation: 'a5-close-army' },
    ],
  },
  /**
   * *"לא אעשה שטויות."* — restored from the pre-overlay unit (§7 B6). The promise is made
   * on the last evening at home and tested across the whole winter, so it cannot close
   * inside a branch: it closes here, only once the winter itself is over, and only if the
   * two things it was about did not happen — no unauthorized leave, no lie to the commander.
   */
  {
    id: 'a5-promise-kept',
    trigger: 'clock',
    when: {
      all: [{ flag: 'a5:done' }, { flag: 'promise:rachel-army' }],
      none: [{ flag: 'life:awol' }, { flag: 'life:lied:army' }, { flag: ARMY_PROMISE_DONE }],
    },
    do: [
      { a: 'flag', flag: ARMY_PROMISE_DONE },
      {
        a: 'derive',
        events: (state) => [
          {
            t: 'proof.recorded',
            proof: {
              kind: 'promise_kept',
              proofId: `promise_kept:${state.chapter}:army`,
              chapter: state.chapter,
              year: state.year,
              subjectHe: 'ההבטחה לאמא לפני הגיוס',
              noteHe: 'חורף שלם. בלי נסיעה בלי חופשה, ובלי לשקר למפקד.',
            },
          },
        ],
      },
    ],
  },
]

export const CONVERSATIONS_ARMY: Conversation[] = [
  {
    id: 'rachel-army',
    nameHe: 'רחל',
    branches: [
      {
        when: { flag: 'a1:packed' },
        lines: [{ who: 'רחל', text: 'התיק סגור. תאכל משהו. מחר כבר אף אחד שם לא ישאל אם אכלת.' }],
      },
      {
        lines: [
          { who: 'רחל', text: 'שמתי גרביים. ועוד גרביים. ואל תתחיל עם המשחקים בשבת לפני שאתה יודע איפה אתה עומד עם המפקד.' },
          { who: 'רחל', text: 'הצבא זה לא שער 7. אי אפשר פשוט להגיע כשמתחשק.' },
        ],
        choices: [
          /**
           * *"אמא. הערב ההוא באוסישקין, כשחזרתי אחרי השעה."* — restored from the
           * pre-overlay unit. It exists only for a player Rachel **remembers** coming home
           * late (`relationshipMemory`, not a flag — a thing a person remembers about you),
           * and it is what `ACH_REPAIR` waits for: the breach was recorded in 1991 as
           * evidence, and this is the room to return to it. The repair does not erase the
           * incident — both proofs carry the same subject and sit side by side in the ledger.
           */
          { id: 'repair', text: '"אמא. הערב ההוא באוסישקין, כשחזרתי אחרי השעה."', when: { relationshipMemory: { who: 'rachel', eventId: 'came-home-late-1991' } }, hidden: true, then: [{ e: 'goto', node: 'rachel-army-curfew' }] },
          {
            id: 'pack', text: 'לסגור את התיק ולשבת איתה עוד קצת.',
            then: [
              { e: 'flag', flag: 'a1:packed' },
              { e: 'flag', flag: 'promise:rachel-army' },
              { e: 'rel', who: 'rachel', axis: 'bond', delta: 4 },
              { e: 'personality', key: 'responsibility', delta: 2 },
              { e: 'remember', who: 'rachel', eventId: 'last-night-before-army', significance: 'major' },
            ],
          },
          {
            id: 'joke', text: '"אם יתנו לי לצאת למשחק — אני מסודר."',
            then: [
              { e: 'flag', flag: 'a1:packed' },
              { e: 'rel', who: 'rachel', axis: 'tension', delta: 2 },
              { e: 'redheart', key: 'footballLove', delta: 1 },
            ],
          },
        ],
      },
    ],
  },
  {
    /**
     * *"ראיתי מה השעה."* — restored from the pre-overlay unit. Five years, and one
     * sentence not said since. The branch pays trust and lowers tension — it does not
     * zero it out — and then returns to the same two answers about tomorrow evening: the
     * chapter does not move from where it stands, a bag on the floor and a lift at six.
     */
    id: 'rachel-army-curfew',
    nameHe: 'רחל',
    branches: [
      {
        lines: [
          { who: 'רחל', text: '(לא מרימה את הראש מהגרביים.) אה. זה.' },
          { who: 'פוגי', text: 'ידעתי מה השעה. נשארתי בכל זאת.' },
          { who: 'רחל', text: 'ידעתי שידעת. זה מה שהיה קשה, לא השעה.' },
          { who: null, text: 'היא קיפלה את הזוג האחרון והניחה אותו על התיק.' },
          { who: 'רחל', text: 'טוב שאמרת את זה עכשיו ולא אז. אז לא היית מתכוון.' },
        ],
        then: [
          { e: 'rel', who: 'rachel', axis: 'trust', delta: 6 },
          { e: 'rel', who: 'rachel', axis: 'tension', delta: -5 },
          { e: 'proof', kind: 'repair_completed', proofId: 'repair_completed:{chapter}:curfew', subjectHe: 'השעה שאמא אמרה', noteHe: 'חמש שנים אחרי, בערב האחרון בבית.' },
          { e: 'remember', who: 'rachel', eventId: 'came-back-to-1991', significance: 'major' },
          { e: 'personality', key: 'honesty', delta: 2 },
        ],
        choices: [
          { id: 'promise', text: '"לא אעשה שטויות."', then: [{ e: 'flag', flag: 'a1:packed' }, { e: 'flag', flag: 'promise:rachel-army' }, { e: 'rel', who: 'rachel', axis: 'trust', delta: 3 }] },
          { id: 'honest', text: '"אני לא מבטיח."', then: [{ e: 'flag', flag: 'a1:packed' }, { e: 'rel', who: 'rachel', axis: 'trust', delta: -1 }, { e: 'personality', key: 'independence', delta: 2 }, { e: 'toast', text: 'היא לא כעסה. היא ידעה.', tone: 'plain' }] },
        ],
      },
    ],
  },
  {
    id: 'ofir-army',
    nameHe: 'אופיר',
    branches: [{
      lines: [
        { who: 'אופיר', text: 'יש ליד שער 5 חבר\'ה צעירים. פחות עומדים ומסתכלים, יותר עושים רעש ודברים בעצמם.' },
        { who: 'אופיר', text: 'אבא שלך בטח יגיד שזה שטויות. בגלל זה כדאי לפחות לראות בעיניים.' },
      ],
      then: [{ e: 'flag', flag: 'knows:gate5' }, { e: 'redheart', key: 'terraceCulture', delta: 1 }],
    }],
  },
  {
    id: 'a2-arrive',
    nameHe: null,
    branches: [{
      lines: [
        { who: null, text: 'בלומפילד. מדים על הגוף. קובי הולך כמעט אוטומטית לכיוון המקום שהוא מכיר.' },
        { who: null, text: 'מהצד השני שומעים תוף וקול צעיר יותר. בפעם הראשונה שתי הדרכים נמצאות מולך באותו רגע.' },
      ],
      choices: [
        {
          id: 'gate7', text: 'ללכת עם קובי. שער 7.',
          then: [
            { e: 'gate', to: 'gate7', reason: 'family' },
            { e: 'flag', flag: 'a2:chose' },
            { e: 'rel', who: 'kobi', axis: 'sharedHistory', delta: 4 },
            { e: 'remember', who: 'kobi', eventId: 'chose-gate7-in-uniform', significance: 'notable' },
          ],
        },
        {
          id: 'gate5', text: 'ללכת לראות בעצמך מה קורה בשער 5.',
          then: [
            { e: 'flag', flag: 'a2:gate5-intent' },
            { e: 'gate', to: 'gate5', reason: 'culture' },
            { e: 'rel', who: 'kobi', axis: 'distance', delta: 2 },
            { e: 'travel', to: 'gate5', spawn: 'start' },
          ],
        },
        {
          id: 'between', text: 'להישאר בחוץ עוד רגע. לא לבחור בשביל שמישהו אחר יהיה רגוע.',
          then: [
            { e: 'gate', to: 'between', reason: 'conflict' },
            { e: 'flag', flag: 'a2:chose' },
            { e: 'personality', key: 'independence', delta: 2 },
          ],
        },
      ],
    }],
  },
  {
    id: 'a2-gate5',
    nameHe: 'אסף',
    branches: [{
      lines: [
        { who: null, text: 'מתחת ליציע יש פחות מקום ממה שדמיינת. בד מקופל, תוף, כמה אנשים שמכירים אחד את השני בשם.' },
        { who: 'אסף', text: 'אם באת רק לראות — תראה. אם אתה נשאר, תזיז את התיק מהמעבר.' },
        { who: 'מלמד', text: 'עזוב אותו. פעם ראשונה. גם אנחנו היינו פעם ראשונה.' },
      ],
      choices: [
        {
          id: 'stay', text: 'להישאר כאן הערב.',
          then: [
            { e: 'flag', flag: 'a2:chose' },
            { e: 'redheart', key: 'terraceCulture', delta: 5 },
            { e: 'rel', who: 'asaf', axis: 'familiarity', delta: 4 },
            { e: 'remember', who: 'asaf', eventId: 'first-night-gate5', significance: 'major' },
          ],
        },
        {
          id: 'back', text: 'ראיתי. לחזור לכיוון קובי לפני שזה נהיה ריב.',
          then: [
            { e: 'gate', to: 'between', reason: 'family' },
            { e: 'flag', flag: 'a2:chose' },
            { e: 'redheart', key: 'terraceCulture', delta: 2 },
            { e: 'travel', to: 'bloomfield-outside', spawn: 'start' },
          ],
        },
      ],
    }],
  },
  /**
   * B6 — the bus, kept exactly (restored verbatim from the pre-overlay unit; canon per
   * the brief: a regular Egged public bus, branded with Beit"ar Jerusalem symbols because
   * it carries them on match days, at the central station — Pogi refuses it and arrives
   * two hours late to base). The director's cut still gets its "direct choice instead of
   * passive waiting": this conversation was already exactly that.
   */
  {
    id: 'a3-bus',
    nameHe: null,
    branches: [
      { when: { flag: 'a3:decided' }, lines: [{ who: null, text: 'הרציף ריק. החלטת.' }] },
      {
        lines: [
          { who: null, text: 'האוטובוס. הנהג בדלת: "חייל, עולה? אני נוסע דרך הצומת שלך. בזמן."' },
          { who: null, text: 'אגד רגיל, קו רגיל — והצדדים שלו צבועים בסמלים של בית"ר ירושלים, כי בימי משחק הוא מסיע אותם. השעון בתחנה אומר חמש חמישים ושש, וזה שלושים וארבע דקות לשער של הבסיס.' },
        ],
        choices: [
          { id: 'refuse', text: '"לא. לא על האוטובוס הזה."', then: [{ e: 'sfx', key: 'bus-door', level: 0.6, delayMs: 900 }, { e: 'consequence', id: 'a3:refused', text: 'האוטובוס יצא. בלעדיך.', laterText: 'שעתיים איחור. זה יירשם.', afterMinutes: 30 }, { e: 'plate', art: 'armyRoom', titleHe: 'הבסיס', subHe: 'שעתיים אחרי השעה', ms: 2600 }, { e: 'flag', flag: 'a3:decided' }, { e: 'flag', flag: 'life:bus:refused' }, { e: 'redheart', key: 'loyaltyReturn', delta: 6 }, { e: 'personality', key: 'stubbornness', delta: 4 }, { e: 'goto', node: 'a3-refused' }] },
          { id: 'board', text: 'לעלות. לשתוק. להגיע בזמן.', then: [{ e: 'flag', flag: 'a3:decided' }, { e: 'flag', flag: 'life:bus:boarded' }, { e: 'wellbeing', key: 'regret', delta: 8 }, { e: 'redheart', key: 'loyaltyReturn', delta: -3 }, { e: 'personality', key: 'responsibility', delta: 2 }, { e: 'goto', node: 'a3-boarded' }] },
          { id: 'other', text: 'לרוץ לחפש רציף אחר.', then: [{ e: 'flag', flag: 'a3:decided' }, { e: 'flag', flag: 'life:bus:searched' }, { e: 'personality', key: 'streetSmarts', delta: 2 }, { e: 'goto', node: 'a3-searched' }] },
          { id: 'wait', text: 'לעמוד. עוד רגע.', then: [{ e: 'personality', key: 'impulsiveness', delta: -1 }, { e: 'toast', text: 'הנהג הסתכל בשעון. אתה הסתכלת באוטובוס.', tone: 'plain' }] },
        ],
      },
    ],
  },
  {
    id: 'a3-refused',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'הנהג משך בכתפיים וסגר. האוטובוס יצא עם השירים שלו. הרציף נשאר עם השעון.' },
          { who: null, text: 'קו אחר, צומת אחר, והמתנה על מעקה. איך הגעת זה כבר לא הסיפור. הגעת שעתיים אחרי השעה.' },
          { who: 'המפקד', text: 'שעתיים.' },
          { who: 'פוגי', text: 'שעתיים.' },
          { who: 'המפקד', text: 'סיבה?' },
        ],
        choices: [
          { id: 'truth', text: '"האוטובוס בזמן היה ממותג בית"ר. לא עליתי."', then: [{ e: 'army', key: 'commanderTrust', delta: -15 }, { e: 'army', key: 'leaveDebt', delta: 1 }, { e: 'armyRoute', route: 'rebellious' }, { e: 'flag', flag: 'a3:done' }, { e: 'toast', text: 'הוא הסתכל עליך זמן ארוך. ואז כתב משהו. לא ידעת אם זה עונש או סיפור.', tone: 'plain' }] },
          { id: 'lie', text: '"האוטובוס התקלקל."', then: [{ e: 'army', key: 'commanderTrust', delta: -5 }, { e: 'flag', flag: 'life:lied:army' }, { e: 'personality', key: 'streetSmarts', delta: 1 }, { e: 'wellbeing', key: 'regret', delta: 3 }, { e: 'flag', flag: 'a3:done' }, { e: 'toast', text: 'עבד. פעם אחת זה עובד.', tone: 'plain' }] },
          { id: 'silent', text: 'לשתוק.', then: [{ e: 'army', key: 'commanderTrust', delta: -20 }, { e: 'armyRoute', route: 'punished' }, { e: 'army', key: 'leaveDebt', delta: 2 }, { e: 'flag', flag: 'a3:done' }, { e: 'toast', text: 'שבת הבאה — בבסיס. הוא לא צעק. הוא רק אמר.', tone: 'red' }] },
        ],
      },
    ],
  },
  {
    id: 'a3-boarded',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'ישבת מאחור, עם התיק על הברכיים, ושתקת שעה. הם שרו כל הדרך. אחד הציע לך גרעינים. לקחת. זה היה הדבר הכי גרוע.' },
          { who: null, text: 'הגעת בזמן. המפקד לא ידע כלום. אתה ידעת.' },
        ],
        then: [{ e: 'army', key: 'commanderTrust', delta: 3 }, { e: 'armyRoute', route: 'trusted' }, { e: 'flag', flag: 'a3:done' }],
      },
    ],
  },
  {
    id: 'a3-searched',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'רצת בין הרציפים. אין. יש אחד בשש וחצי לעיר אחרת, ומשם — לא ידעת. עלית עליו בכל זאת.' },
          { who: null, text: 'הגעת בשמונה ורבע. שעה ושלושת רבעי. המפקד שאל. אמרת "אוטובוסים". זה היה נכון, בערך.' },
        ],
        then: [{ e: 'army', key: 'commanderTrust', delta: -8 }, { e: 'armyRoute', route: 'negotiator' }, { e: 'redheart', key: 'travelDrive', delta: 2 }, { e: 'flag', flag: 'a3:done' }],
      },
    ],
  },
  {
    id: 'a4-liron',
    nameHe: 'לירון',
    branches: [{
      lines: [
        { who: 'לירון', text: 'יש מקום באוטו. אין הרבה דלק, אין הרבה זמן, ויש לך בסיס בבוקר. מושלם.' },
        { who: 'רפי מהקיוסק', text: 'מושלם למי שאין לו שכל.' },
      ],
      choices: [
        {
          id: 'drive', text: 'לנסוע. את הבוקר נפתור בבוקר.',
          then: [
            { e: 'flag', flag: 'a4:drive' },
            { e: 'army', key: 'fatigue', delta: 10 },
            { e: 'redheart', key: 'travelDrive', delta: 5 },
            { e: 'travel', to: 'route', spawn: 'start' },
          ],
        },
        {
          id: 'stay', text: 'להישאר. פעם אחת לא להסתבך.',
          then: [
            { e: 'flag', flag: 'a4:stayed' },
            { e: 'army', key: 'commanderTrust', delta: 3 },
            { e: 'personality', key: 'responsibility', delta: 2 },
          ],
        },
      ],
    }],
  },
  /**
   * The ride itself — restored from the pre-overlay unit's `road-2` (life-reachable
   * flagged `liron-cup99`'s `rel.liron.sharedHistory ≥ 4` gate as impossible once this
   * chapter's only other source of it, inside the old `road-1..road-back` chain, stopped
   * being reachable). One quiet moment in the car, before the kiosk beat picks the day
   * back up.
   */
  {
    id: 'a4-road',
    nameHe: null,
    branches: [{
      lines: [
        { who: null, text: 'האוטו של לירון רועד מעל שמונים. הרדיו תופס תחנה, מאבד אותה, ותופס אחרת.' },
        { who: 'לירון', text: 'אתה מסתכל כל הדרך על השעון. זה לא גורם לנו להגיע מהר יותר.' },
      ],
      then: [
        { e: 'rel', who: 'liron', axis: 'sharedHistory', delta: 6 },
        { e: 'personality', key: 'empathy', delta: 2 },
      ],
    }],
  },
  {
    id: 'a5-close-army',
    nameHe: 'רפי מהקיוסק',
    branches: [{
      lines: [
        { who: 'רפי מהקיוסק', text: 'אז מה למדת בצבא?' },
        { who: 'פוגי', text: 'שהכול רחוק יותר ממה שנראה במפה.' },
        { who: 'רפי מהקיוסק', text: 'יפה. עכשיו תלמד שזה נכון גם לגבי מועדון.' },
      ],
      choices: [
        {
          id: 'road', text: 'להסתכל על הכביש. "עוד לא סיימתי לנסוע."',
          then: [
            { e: 'flag', flag: 'a5:done' },
            { e: 'redheart', key: 'travelDrive', delta: 2 },
            { e: 'ending', id: 'road' },
          ],
        },
        {
          id: 'home', text: 'להסתכל לכיוון הבית. "מספיק להיום."',
          then: [
            { e: 'flag', flag: 'a5:done' },
            { e: 'redheart', key: 'familyTradition', delta: 2 },
            { e: 'ending', id: 'home' },
          ],
        },
      ],
    }],
  },
  // Compatibility ids used by old actors/hotspots in this era. They all lead back into
  // the Director's Cut instead of failing because an older scene still points at them.
  { id: 'kobi-army', nameHe: 'קובי', branches: [{ lines: [{ who: 'קובי', text: 'מדים זה מדים. במשחק אתה עדיין עומד לידי רק אם אתה רוצה.' }] }] },

  /**
   * The world-static ids scenes.ts already draws bodies and hotspots for — restored
   * verbatim from the pre-overlay unit rather than rewritten, because none of them are
   * about the seam this director's cut fixes (the 16.11 → 23.11 date, the Gate 5 travel
   * choice, the direct bus choice). They stand outside the beat chain, gated by the same
   * A2–A5 flags the new beats raise, so they slot back in without touching the sequence.
   */
  {
    id: 'sign-shelf',
    nameHe: null,
    branches: [
      {
        when: { flag: 'saw:shelf' },
        lines: [{ who: null, text: 'המדף עדיין חצי ריק.' }],
      },
      {
        lines: [
          { who: null, text: 'המדף מאחורי רפי חצי ריק. לא חסר משהו אחד — חסרה שורה שלמה.' },
          { who: 'רפי מהקיוסק', text: 'לא הביאו השבוע. וגם לא בשבוע שעבר. אני לא שואל למה, הם לא עונים.' },
        ],
        then: [{ e: 'flag', flag: 'saw:shelf' }, { e: 'institution', key: 'footballOwnershipTrust', delta: -2 }],
      },
    ],
  },
  {
    id: 'sign-till',
    nameHe: 'רפי מהקיוסק',
    branches: [
      {
        when: { hasSticker: 'tikva' },
        lines: [{ who: 'רפי מהקיוסק', text: 'שמת אותה באלבום? יופי. עכשיו זה כבר לא שלי.' }],
      },
      {
        lines: [
          { who: null, text: 'רפי פותח את הקופה ומזיז את המגש. מתחת למגש, בין שטרות ישנים, מדבקה אחת.' },
          { who: 'רפי מהקיוסק', text: 'זאת נשארה לי משנה שעברה. מאתיים שלושים ואחת. אף אחד לא ביקש.' },
          { who: 'רפי מהקיוסק', text: 'קח. אתה היחיד פה שעוד סופר.' },
        ],
        then: [
          { e: 'sticker', id: 'tikva' },
          { e: 'toast', text: 'שלום תקוה, 231.', tone: 'red' },
          { e: 'bond', who: 'shopkeeper', delta: 4 },
          { e: 'redheart', key: 'historyMemory', delta: 3 },
        ],
      },
    ],
  },
  {
    id: 'sign-paper',
    nameHe: null,
    branches: [
      {
        when: { flag: 'saw:figures' },
        lines: [{ who: null, text: 'אותו עמוד. אותם מספרים.' }],
      },
      {
        lines: [
          { who: null, text: 'העיתון פתוח על הדלפק בעמוד שאף אחד לא קורא — טור של מספרים, וכמה מהם בסוגריים.' },
          { who: null, text: 'אתה לא יודע מה זה סוגריים במספר. אתה יודע שאף אחד לא שם אותם שם סתם.' },
        ],
        then: [
          { e: 'flag', flag: 'saw:figures' },
          { e: 'institution', key: 'legalUnderstanding', delta: 2 },
          { e: 'redheart', key: 'historyMemory', delta: 2 },
        ],
      },
    ],
  },
  {
    id: 'sign-window',
    nameHe: null,
    branches: [
      {
        when: { flag: 'saw:window' },
        lines: [{ who: null, text: 'התריס עדיין למטה.' }],
      },
      {
        lines: [
          { who: null, text: 'החלון של המשרד סגור בתריס פח, ועליו דף שנתלה במסקינטייפ ונקרע בפינה.' },
          { who: null, text: 'מתחת לדף מישהו כתב בעט משהו קצר, ואז מחק. את המחיקה רואים יותר טוב מהמילה.' },
        ],
        then: [{ e: 'flag', flag: 'saw:window' }, { e: 'institution', key: 'footballOwnershipTrust', delta: -3 }],
      },
    ],
  },
  {
    id: 'sign-tickets',
    nameHe: 'קופאית',
    branches: [
      {
        when: { flag: 'saw:tickets' },
        lines: [{ who: 'קופאית', text: 'עוד לא. אמרתי לך, עוד לא.' }],
      },
      {
        lines: [
          { who: null, text: 'בקופה יש תור של ארבעה. השלט על הזכוכית הוא של העונה שעברה.' },
          { who: 'קופאית', text: 'מנויים לעונה הבאה? עוד לא פתחנו. כשיהיה ברור — יהיה.' },
        ],
        choices: [
          {
            id: 'ask',
            text: '"ברור לגבי מה?"',
            then: [
              { e: 'flag', flag: 'saw:tickets' },
              { e: 'institution', key: 'legalUnderstanding', delta: 2 },
              { e: 'toast', text: 'היא הסתכלה עליך שנייה ואמרה "אתה בן כמה?" ואז חייכה ולא ענתה.', tone: 'plain' },
            ],
          },
          { id: 'go', text: 'לא לשאול.', then: [{ e: 'flag', flag: 'saw:tickets' }] },
        ],
      },
    ],
  },
  {
    id: 'sign-two-jobs',
    nameHe: 'סדרן',
    branches: [
      {
        when: { flag: 'saw:twojobs' },
        lines: [{ who: 'סדרן', text: 'מה, עוד לא הלכת? יאללה, יש לי עוד ערימה.' }],
      },
      {
        lines: [
          { who: null, text: 'הסדרן שמכיר אותך בשם עומד היום עם ערימת דפים ביד ומוכר אותם. את החולצה של הסדרנים הוא עוד לובש.' },
          { who: 'סדרן', text: 'גם וגם. לא הוסיפו לי, הורידו למישהו אחר.' },
        ],
        then: [
          { e: 'flag', flag: 'saw:twojobs' },
          { e: 'redheart', key: 'community', delta: 3 },
          { e: 'institution', key: 'footballOwnershipTrust', delta: -2 },
        ],
      },
    ],
  },
  {
    id: 'sign-creditor',
    nameHe: null,
    branches: [
      {
        when: { flag: 'saw:creditor' },
        lines: [{ who: null, text: 'הם כבר לא שם.' }],
      },
      {
        lines: [
          { who: null, text: 'שני גברים בחליפות עומדים ליד המשרד. אחד מחזיק תיק, השני מחזיק סיגריה שהוא לא מעשן.' },
          { who: null, text: '"...בסוף החודש," אמר הראשון, ואז ראה אותך והפסיק.' },
          { who: null, text: 'עברת לידם לאט יותר משהיית צריך, וזה לא עזר.' },
        ],
        then: [
          { e: 'flag', flag: 'saw:creditor' },
          { e: 'institution', key: 'footballOwnershipTrust', delta: -4 },
          { e: 'wellbeing', key: 'stress', delta: 3 },
        ],
      },
    ],
  },
  {
    id: 'kobi-gate7',
    nameHe: 'קובי',
    branches: [
      { when: { flag: 'a2:chose', gateIs: 'gate7' }, lines: [{ who: 'קובי', text: 'פה. איפה שתמיד.' }, { who: null, text: 'הוא לא שאל למה. הוא לא היה צריך.' }] },
      { when: { flag: 'a2:chose', gateIs: 'gate5' }, lines: [{ who: 'קובי', text: 'לך. לך לשם. אני לא אחזיק אותך.' }, { who: null, text: 'הוא הסתכל למגרש כשאמר את זה. לא עליך.' }] },
      { when: { flag: 'a2:chose' }, lines: [{ who: 'קובי', text: 'אתה לא פה ולא שם. תחליט מתישהו. זה לא מקום, זה בין.' }] },
      {
        lines: [
          { who: 'קובי', text: 'שמעת אותם? מתחת ליציע? עשרים שנה שרים פה אותו שיר, ופתאום צריך תוף.' },
          { who: 'בארי', text: 'תעזוב, קובי. גם אנחנו היינו פעם רעש.' },
          { who: 'קובי', text: 'היינו רעש בשער 7. לא מתחתיו.' },
        ],
        choices: [
          { id: 'stay', text: 'להישאר פה. ליד אבא.', then: [{ e: 'flag', flag: 'a2:chose' }, { e: 'gate', to: 'gate7', reason: 'family' }, { e: 'rel', who: 'kobi', axis: 'bond', delta: 4 }, { e: 'redheart', key: 'familyTradition', delta: 4 }, { e: 'remember', who: 'kobi', eventId: 'stayed-gate7-1996', significance: 'major' }, { e: 'goto', node: 'a2-after' }] },
          { id: 'look', text: '"אני הולך לראות. אני חוזר."', then: [{ e: 'flag', flag: 'a2:looked' }, { e: 'toast', text: '"תחזור," הוא אמר, כמו שאומרים משהו שלא בטוחים בו.', tone: 'plain' }] },
        ],
      },
    ],
  },
  {
    id: 'barry-gate7',
    nameHe: 'בארי',
    branches: [
      {
        lines: [{ who: 'בארי', text: 'אבא שלך צודק וטועה באותו משפט. ראיתי את זה קורה פה לאנשים טובים. תעמוד איפה שתעמוד — רק שזה יהיה אתה שהחלטת.' }],
        then: [{ e: 'rel', who: 'barry', axis: 'familiarity', delta: 4 }, { e: 'personality', key: 'independence', delta: 1 }],
      },
    ],
  },
  {
    id: 'asaf-gate5',
    nameHe: 'אסף',
    branches: [
      { when: { gateIs: 'gate5' }, lines: [{ who: 'אסף', text: 'אתה פה. יופי. בשבוע הבא אתה מגיע שעה לפני ומחזיק בד. אין "אני רק בא לשיר".' }] },
      {
        lines: [
          { who: null, text: 'מתחת ליציע. תוף, עשרים בחורים, בד שמישהו צייר ביד. אסף באמצע, לא שר — מסתכל.' },
          { who: 'אסף', text: 'חייל. תשמע טוב: פה לא באים לראות משחק. פה עובדים. סוחבים, תולים, מגיעים שעה לפני. כבוד מקבלים אחר כך, אם בכלל.' },
          { who: 'מלמד', text: 'תן לו לשמוע קודם. (מלמד, עם דרבוקה בין הברכיים, מנסה קצב.) ככה? או ככה?' },
        ],
        choices: [
          { id: 'join', text: '"אני איתכם."', then: [{ e: 'flag', flag: 'a2:chose' }, { e: 'gate', to: 'gate5', reason: 'friends' }, { e: 'rel', who: 'asaf', axis: 'trust', delta: 3 }, { e: 'rel', who: 'kobi', axis: 'tension', delta: 5 }, { e: 'redheart', key: 'terraceCulture', delta: 5 }, { e: 'remember', who: 'asaf', eventId: 'joined-gate5-1996', significance: 'major' }, { e: 'goto', node: 'a2-after' }] },
          { id: 'rhythm', text: 'לענות למלמד: "ככה." (הראשון)', then: [{ e: 'sfx', key: 'darbuka-three-two', level: 0.8 }, { e: 'flag', flag: 'life:melamed:rhythm' }, { e: 'rel', who: 'melamed', axis: 'bond', delta: 4 }, { e: 'redheart', key: 'terraceCulture', delta: 2 }, { e: 'proof', kind: 'creation_proof', proofId: 'creation_proof:{chapter}:rhythm', subjectHe: RHYTHM_SUBJECT, noteHe: 'שלוש, הפסקה, שתיים. מתחת ליציע, על דרבוקה של מישהו אחר.' }, { e: 'skill', skill: 'creativity', delta: 3, why: 'נתן למלמד קצב' }, { e: 'toast', text: 'מלמד ניגן את זה שוב. ושוב. אתה לא יודע עוד מה עשית.', tone: 'plain' }] },
          { id: 'back', text: '"אני חוזר לאבא."', then: [{ e: 'flag', flag: 'a2:chose' }, { e: 'gate', to: 'gate7', reason: 'family' }, { e: 'rel', who: 'asaf', axis: 'distance', delta: 3 }, { e: 'goto', node: 'a2-after' }] },
          { id: 'neither', text: 'ללכת. לא לפה ולא לשם.', then: [{ e: 'flag', flag: 'a2:chose' }, { e: 'gate', to: 'outside', reason: 'conflict' }, { e: 'wellbeing', key: 'loneliness', delta: 6 }, { e: 'goto', node: 'a2-after' }] },
        ],
      },
    ],
  },
  {
    id: 'a2-after',
    nameHe: null,
    branches: [
      { when: { gateIs: 'gate5' }, lines: [{ who: null, text: 'מהמקום החדש רואים את שער 7 באלכסון. בהפסקה אנשים נצמדים לגדר שבין 5 ל-7 ומדברים דרכה. אבא לא בא לגדר.' }, { who: null, text: 'התוף לא הפסיק תשעים דקות. בסוף לא שמעת אותו. הוא היה בפנים.' }] },
      { when: { gateIs: 'outside' }, lines: [{ who: null, text: 'עמדת ליד הגדר שבין 5 ל-7 — מקום שעוברים בו בהפסקה ולא עומדים בו במשחק. ראית תשעים דקות לבד. זה היה הדבר הכי לא־בלומפילד שעשית.' }] },
      { lines: [{ who: null, text: 'שער 7. השיר האיטי. הכתף של אבא ליד הכתף שלך. ומתחת ליציע, כל המשחק, תוף שאתה שומע ולא רואה.' }] },
    ],
  },
  {
    id: 'yaron-base',
    nameHe: 'ירון',
    branches: [
      { when: { flag: 'life:bus:refused' }, lines: [{ who: 'ירון', text: 'שמעתי. האוטובוס. אתה יודע שזה או הסיפור הכי טוב שלך או הכי מטומטם, ותלוי מי מספר.' }, { who: 'פוגי', text: 'תלוי מי מספר.' }], then: [{ e: 'rel', who: 'yaron', axis: 'familiarity', delta: 5 }] },
      { lines: [{ who: 'ירון', text: 'ירון, מהאוהל ליד. אם מישהו יספר לך מי אבא שלי — תגיד שכבר שמעת ותעבור נושא. אתה מהפועל? אז אנחנו מסתדרים.' }], then: [{ e: 'rel', who: 'yaron', axis: 'familiarity', delta: 4 }] },
    ],
  },
  {
    id: 'a4-winter',
    nameHe: null,
    branches: [
      {
        when: { all: [{ flag: 'saw:window' }, { flag: 'saw:figures' }] },
        lines: [
          { who: null, text: 'פברואר. הקיוסק, שבת בצהריים. הפעם לא מדברים על מאמן. מדברים על כסף.' },
          { who: 'פוגי', text: 'החלון של המשרד סגור כבר שבועיים. ובעיתון יש מספרים בסוגריים.' },
          { who: 'פרדי', text: 'אז אתה כבר יודע. סוגריים זה מינוס. וההסתדרות מוכרת.' },
          { who: 'פרדי', text: 'יש קבוצת אנשי עסקים. זה יכול להציל את המועדון וזה יכול לקנות אותו. שני הדברים נכונים באותו רגע.' },
          { who: 'עמית', text: 'ואנחנו נאבקים להישאר בליגה. המאמן הלך באמצע השבוע, אחרי כל השנים.' },
        ],
        choices: [
          { id: 'legal', text: 'לפרדי: "מי חותם על זה בכלל?"', then: [{ e: 'institution', key: 'legalUnderstanding', delta: 8 }, { e: 'rel', who: 'freddy', axis: 'trust', delta: 4 }, { e: 'goto', node: 'a4-freddy' }] },
          { id: 'protest', text: '"אז נלך למשרדים. שיראו אותנו."', then: [{ e: 'institution', key: 'protestEscalation', delta: 8 }, { e: 'institution', key: 'footballOwnershipTrust', delta: -5 }, { e: 'rel', who: 'freddy', axis: 'tension', delta: 3 }, { e: 'goto', node: 'a4-freddy' }] },
          { id: 'sinai', text: 'על המאמן: "הוא כבר לא התשובה."', then: [{ e: 'sinai', stance: 'broken' }, { e: 'flag', flag: 'life:sinai:broken' }, { e: 'wellbeing', key: 'regret', delta: 4 }, { e: 'redheart', key: 'historyMemory', delta: 3 }, { e: 'goto', node: 'a4-liron' }] },
        ],
      },
      {
        lines: [
          { who: null, text: 'פברואר. הקיוסק, שבת בצהריים. הפעם לא מדברים על מאמן. מדברים על כסף.' },
          { who: 'עמית', text: 'אל תסתכל עלי, תסתכל בטבלה. אנחנו נאבקים להישאר בליגה. והמאמן הלך באמצע השבוע, אחרי כל השנים.' },
          { who: 'פרדי', text: 'וזה עוד לא הכל. ההסתדרות מוכרת, ויש קבוצת אנשי עסקים. זה יכול להציל את המועדון וזה יכול לקנות אותו. שני הדברים נכונים באותו רגע.' },
          { who: 'רפי מהקיוסק', text: 'העיקר שיהיה מועדון. לא אכפת לי של מי.' },
          { who: 'אוהד', text: 'לי אכפת.' },
        ],
        choices: [
          { id: 'sinai', text: 'על המאמן: "הוא לימד אותי מה זו החולצה הזאת. הוא כבר לא התשובה."', then: [{ e: 'sinai', stance: 'broken' }, { e: 'flag', flag: 'life:sinai:broken' }, { e: 'wellbeing', key: 'regret', delta: 4 }, { e: 'redheart', key: 'historyMemory', delta: 3 }, { e: 'goto', node: 'a4-liron' }] },
          { id: 'reconcile', text: '"אני עדיין אוהב את השחקן. על המאמן — נדבר בעוד עשר שנים."', then: [{ e: 'sinai', stance: 'reconciled-memory' }, { e: 'flag', flag: 'life:sinai:reconciled' }, { e: 'personality', key: 'empathy', delta: 2 }, { e: 'redheart', key: 'loyaltyReturn', delta: 3 }, { e: 'goto', node: 'a4-liron' }] },
          { id: 'protest', text: 'על המכירה: "אז נלך למשרדים. שיראו אותנו."', then: [{ e: 'institution', key: 'protestEscalation', delta: 8 }, { e: 'institution', key: 'footballOwnershipTrust', delta: -5 }, { e: 'rel', who: 'freddy', axis: 'tension', delta: 3 }, { e: 'goto', node: 'a4-freddy' }] },
          { id: 'legal', text: 'לפרדי: "מה חוקי לעשות, ומה לא?"', then: [{ e: 'institution', key: 'legalUnderstanding', delta: 8 }, { e: 'rel', who: 'freddy', axis: 'trust', delta: 4 }, { e: 'goto', node: 'a4-freddy' }] },
        ],
      },
    ],
  },
  {
    id: 'a4-freddy',
    nameHe: 'פרדי',
    branches: [
      {
        lines: [
          { who: 'פרדי', text: 'חוקי: לעמוד, לצעוק, לכתוב, לחתום. לא חוקי: לשבור, לאיים, לחסום. ההבדל הוא לא מוסר, הוא מה שיישאר לכם למחרת.' },
          { who: 'פרדי', text: 'ומי שרוצה שיהיה לו יום אחד מה להגיד על המועדון הזה — שילמד לקרוא מאזן. לא היום. אבל שיתחיל.' },
        ],
        then: [{ e: 'institution', key: 'supporterOwnershipSeed', delta: 6 }, { e: 'goto', node: 'a4-liron' }],
      },
    ],
  },
  {
    id: 'a5-kiosk',
    nameHe: 'רפי מהקיוסק',
    branches: [
      {
        when: { flag: 'a5:done' },
        lines: [{ who: 'רפי מהקיוסק', text: 'נסעת? יופי. עכשיו לך לישון, יש לך בסיס בבוקר.' }],
      },
      {
        lines: [
          { who: 'רפי מהקיוסק', text: 'שניים ביקשו ממני להעביר לך הודעה, ואני לא דואר.' },
          { who: 'רפי מהקיוסק', text: 'אחד: יש משחק בצפון, גביע הטוטו, ואין הסעה כי נוסעים בערך עשרה. אם אתה רוצה — אתה מוצא דרך.' },
          { who: 'רפי מהקיוסק', text: 'שתיים: מישהו הבטיח לאסוף אותך למשחק ולא בא. הוא הבטיח, ולא בא.' },
          { who: null, text: 'אתה יכול להספיק אחד. לא שניים.' },
        ],
        choices: [
          {
            id: 'north',
            text: 'לצאת צפונה. בטרמפים.',
            then: [
              { e: 'flag', flag: 'a5:north' },
              { e: 'redheart', key: 'travelDrive', delta: 6 },
              { e: 'personality', key: 'riskTolerance', delta: 3 },
              { e: 'goto', node: 'a5-north-1' },
            ],
          },
          {
            id: 'wait',
            text: 'לחכות להסעה שהבטיחו.',
            then: [{ e: 'flag', flag: 'a5:pickup' }, { e: 'goto', node: 'a5-pickup-1' }],
          },
          { id: 'neither', text: 'לחזור לבסיס מוקדם.', then: [{ e: 'army', key: 'commanderTrust', delta: 5 }, { e: 'wellbeing', key: 'regret', delta: 3 }, { e: 'flag', flag: 'a5:done' }, { e: 'ending', id: 'home' }] },
        ],
      },
    ],
  },
  {
    /** the road north — the journey IS the unit, per §7 B6 */
    id: 'a5-north-1',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'בצומת שבקצה העיר עומדים שניים שאתה מכיר מהיציע ואחד שלא. ארבעה אנשים, יד אחת מורמת, וכל אוטו שעובר הוא הימור.' },
          { who: null, text: 'הראשון שעצר לקח שניים. אמרו לך "תמשיך אחרינו" והלכו.' },
        ],
        choices: [
          {
            id: 'alone',
            text: 'להישאר בצומת לבד.',
            then: [
              { e: 'personality', key: 'stubbornness', delta: 3 },
              { e: 'wellbeing', key: 'loneliness', delta: 3 },
              { e: 'time', minutes: 55 },
              { e: 'goto', node: 'a5-north-2' },
            ],
          },
          {
            id: 'pair',
            text: 'לעצור עם השלישי ולנסות ביחד.',
            then: [
              { e: 'redheart', key: 'community', delta: 4 },
              { e: 'rel', who: 'shachor', axis: 'familiarity', delta: 2 },
              { e: 'time', minutes: 35 },
              { e: 'goto', node: 'a5-north-2' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'a5-north-2',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'משאית, אחר כך מסחרית, אחר כך אחד שנסע לחתונה והוריד אותך במקום הלא נכון. שלוש שעות, ארבעה אוטואים, וגשם קטן שלא הפסיק.' },
          { who: null, text: 'בשער היו בערך עשרה. אתה הכרת שמונה מהם.' },
          { who: null, text: 'אחד מהם אמר "אתה הגעת בטרמפים?" ואז לא אמר כלום, וזה היה הדבר הכי טוב ששמעת באותו חורף.' },
        ],
        then: [
          { e: 'presence', mode: 'inside' },
          { e: 'flag', flag: 'life:north:hitched' },
          { e: 'redheart', key: 'travelDrive', delta: 5 },
          { e: 'redheart', key: 'community', delta: 4 },
          { e: 'remember', who: 'shachor', eventId: 'hitched-north', significance: 'major' },
          { e: 'flag', flag: 'a5:done' },
          { e: 'ending', id: 'road' },
        ],
      },
    ],
  },
  {
    /** the lift that never came, and the coins that made up for it */
    id: 'a5-pickup-1',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'עמדת בפינה שסיכמתם עליה. ארבע וחצי, חמש פחות רבע, חמש. האוטו לא בא.' },
          { who: null, text: 'בטלפון הציבורי אין תשובה. בכיס יש ארבעים שקל, ומונית לשם עולה יותר.' },
        ],
        choices: [
          {
            id: 'ask',
            text: 'ללכת לשער ולהגיד שאין לך.',
            then: [
              { e: 'personality', key: 'courage', delta: 3 },
              { e: 'goto', node: 'a5-pickup-2' },
            ],
          },
          {
            id: 'home',
            text: 'ללכת הביתה ולא להגיד לאף אחד.',
            then: [
              { e: 'wellbeing', key: 'loneliness', delta: 5 },
              { e: 'wellbeing', key: 'regret', delta: 4 },
              { e: 'flag', flag: 'a5:done' },
              { e: 'ending', id: 'home' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'a5-pickup-2',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'אמרת את זה מהר, כדי לגמור. מישהו הוציא עשרים. מישהו אחר עשר. אחד נתן חמישה ואמר "זה מה שיש".' },
          { who: null, text: 'תוך שתי דקות היה מספיק למונית, ועוד עשרה שהוא לא לקח בחזרה.' },
          { who: null, text: 'הנהג שאל למה אתם ממהרים. אף אחד לא ענה לו.' },
        ],
        then: [
          { e: 'presence', mode: 'inside' },
          { e: 'flag', flag: 'life:carried:taxi' },
          { e: 'flag', flag: 'owe:stand' },
          { e: 'debt', agorot: TAXI_AGOROT, why: 'המונית ששער 5 שילם עליה' },
          { e: 'redheart', key: 'community', delta: 7 },
          { e: 'wellbeing', key: 'belonging', delta: 5 },
          { e: 'personality', key: 'empathy', delta: 3 },
          { e: 'remember', who: 'asaf', eventId: 'stand-paid-my-taxi', significance: 'major' },
          { e: 'flag', flag: 'a5:done' },
          { e: 'ending', id: 'road' },
        ],
      },
    ],
  },
]
