from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[2]


def run(*args: str) -> None:
    subprocess.run(args, cwd=ROOT, check=True)


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding='utf-8')


def write(path: str, text: str) -> None:
    (ROOT / path).write_text(text, encoding='utf-8')


def replace_once(path: str, old: str, new: str) -> None:
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one occurrence, found {count}: {old[:80]!r}')
    write(path, text.replace(old, new, 1))


def sub_once(path: str, pattern: str, repl: str, flags: int = 0) -> None:
    text = read(path)
    out, count = re.subn(pattern, repl, text, count=1, flags=flags)
    if count != 1:
        raise RuntimeError(f'{path}: regex matched {count}: {pattern[:100]!r}')
    write(path, out)


# Prepared Stage A changes. Each patch is deliberately strict: drift aborts the RC.
for name in [
    '01-a1-directors-cut.patch',
    '02-a2-a7-flow-redesign.patch',
    '03-a8-1986-start-continuity.patch',
    '04-childhood-life-path-fairness.patch',
]:
    run('git', 'apply', '--check', f'scripts/rc/{name}')
    run('git', 'apply', f'scripts/rc/{name}')

# 1991 — school cleverness is disposition, not adult travel capability.
replace_once(
    'lib/life/content/dialogue1991.ts',
    "{ e: 'personality', key: 'streetSmarts', delta: 5 },",
    "{ e: 'personality', key: 'reliability', delta: 2 },",
)
replace_once(
    'lib/life/content/dialogue1991.ts',
    "{ e: 'personality', key: 'streetSmarts', delta: 4 },",
    "{ e: 'personality', key: 'responsibility', delta: 1 },\n              { e: 'personality', key: 'stubbornness', delta: 1 },",
)

# 1991→1993 — one truthful memory focus, not four props that invent an attendance habit.
sub_once(
    'lib/life/content/chapter1993cup.ts',
    r"export const PASSAGE_1993: PassageObject\[\] = \[[\s\S]*?\n\]\n\nexport const PASSAGE_CARD_1993_HE",
    """export const PASSAGE_1993: PassageObject[] = [
  {
    id: 'years',
    labelHe: 'הקופסה האדומה',
    lookHe: 'שנתיים נכנסו לקופסה בלי לבקש רשות: כרטיסים אם היית, פתקים אם פספסת, ודברים ששמעת מאחרים. היא לא מספרת חיים שלא חיית.',
    afterHe: 'החדר נשאר אותו חדר. אתה כבר בן חמש־עשרה, ופחות דברים דורשים רשות מראש.',
  },
]

export const PASSAGE_CARD_1993_HE""",
)

# PassageScene — one optional focus is enough. The bridge edits time; it never asks for
# four proof-clicks. 1989 becomes the documentary wound before May 1990, without changing
# legacy chapter ids/saves.
replace_once(
    'lib/life/runtime/scenes/PassageScene.ts',
    "objective: 'החדר שלך. תסתכל מסביב.',",
    "objective: 'אם משהו בחדר מושך אותך — תסתכל. הזמן ימשיך גם בלעדיו.',",
)
replace_once(
    'lib/life/runtime/scenes/PassageScene.ts',
    "hint: 'ארבע שנים עוברות בחדר אחד. תסתכל על מה שהשתנה.',",
    "hint: 'בחר זיכרון אחד, או תן לזמן להמשיך.',",
)
replace_once(
    'lib/life/runtime/scenes/PassageScene.ts',
    "if (this.seen >= this.passage.objects.length) this.finish()",
    "if (this.seen >= 1) this.finish()",
)
replace_once(
    'lib/life/runtime/scenes/PassageScene.ts',
    "objective: n >= this.passage.objects.length ? '' : 'החדר שלך. תסתכל מסביב.',",
    "objective: n >= 1 ? '' : 'אם משהו בחדר מושך אותך — תסתכל.',",
)
replace_once(
    'lib/life/runtime/scenes/PassageScene.ts',
    "hint: 'ארבע שנים עוברות בחדר אחד. תסתכל על מה שהשתנה.',",
    "hint: 'זיכרון אחד מספיק. הזמן לא מחכה לקליק רביעי.',",
)

old_finish = """    this.ctx.bus.emit('toast', { text: this.passage.toastHe, tone: 'plain' })
    this.time.delayedCall(1600, () => {
      this.cameras.main.fadeOut(900, 0, 0, 0)
"""
new_finish = """    this.ctx.bus.emit('toast', { text: this.passage.toastHe, tone: 'plain' })
    const cross = () => this.time.delayedCall(900, () => {
      this.cameras.main.fadeOut(900, 0, 0, 0)
"""
replace_once('lib/life/runtime/scenes/PassageScene.ts', old_finish, new_finish)
replace_once(
    'lib/life/runtime/scenes/PassageScene.ts',
    """      })
    })
  }
}""",
    """      })
    })

    if (this.passage.flag === 'life:passage-1990') {
      this.ctx.bus.emit('card', { titleHe: '1989', subHe: 'לראשונה: ירידה', ms: 2200 })
      this.time.delayedCall(2300, () => {
        this.ctx.dialogue.startLines([
          { who: null, text: 'שנה לפני העלייה, הייתה הירידה. בפעם הראשונה.' },
          { who: null, text: 'קובי קיפל את העיתון והשאיר אותו על השולחן. אף אחד בבית לא הפך את זה לנאום.' },
          { who: null, text: 'ב-1990, כששואלים כמה צריך, אתה כבר יודע למה המספר חשוב.' },
        ], cross)
      })
    } else cross()
  }
}""",
)

# 1997 — replace the false single decisive Ussishkin night with the documented dependency
# chain. Keep the same chapter id and relationship/operations layer so old saves remain valid.
p = 'lib/life/content/chapter1997basket.ts'
text = read(p)
text = text.replace(
    "return 'ערב ירידה. שחור צריך ידיים. אבא צריך אותך בבלומפילד.'",
    "return '27 במרץ. עדיין אפשר להישאר בחיים. שחור צריך ידיים; אבא מחכה במקום אחר.'",
)
text = text.replace(
    "{ who: null, text: 'הערב, אם זה נגמר רע, הקבוצה הזאת יורדת ליגה בפעם הראשונה מאז שנוסדה ב-1935. ובאותו ערב בדיוק, בבלומפילד, משחק שאבא אמר עליו \"אתה חייב להיות\".' }",
    "{ who: null, text: '27 במרץ 1997. עוד לא ערב הירידה. זה ערב שבו עדיין אפשר להשאיר את הסיפור פתוח. ובאותו זמן אבא מחכה לך במקום אחר.' }",
)
old_hall = """      { a: 'flag', flag: 'h1:decided' },
      { a: 'flag', flag: 'h1:hall' },
      { a: 'card', titleHe: 'הערב האחרון', subHe: 'אוסישקין · ליגה', ms: 2400 },
      { a: 'match', script: 'hall-97' },
      { a: 'events', events: DAY(H2, 1998, 2, at(19, 30), 'אביב 1998') },
      { a: 'card', titleHe: 'שנה אחרי', subHe: 'אוסישקין', ms: 2600 },
      { a: 'travel', to: 'ussishkin-outside', spawn: 'start' },
"""
new_hall = """      { a: 'flag', flag: 'h1:decided' },
      { a: 'flag', flag: 'h1:hall' },
      { a: 'card', titleHe: '27.3.1997', subHe: 'אוסישקין · נשארים בחיים', ms: 2400 },
      { a: 'talk', conversation: 'h1-chain' },
"""
if old_hall not in text:
    raise RuntimeError('1997 hall block drifted')
text = text.replace(old_hall, new_hall, 1)
old_football = """      { a: 'card', titleHe: 'בלומפילד', subHe: 'באותו ערב', ms: 2400 },
      { a: 'talk', conversation: 'h1-bloomfield' },
      { a: 'events', events: DAY(H2, 1998, 2, at(19, 30), 'אביב 1998') },
      { a: 'card', titleHe: 'שנה אחרי', subHe: 'אוסישקין', ms: 2600 },
      { a: 'travel', to: 'ussishkin-outside', spawn: 'start' },
"""
new_football = """      { a: 'card', titleHe: '27.3.1997', subHe: 'אתה במקום אחר', ms: 2400 },
      { a: 'talk', conversation: 'h1-bloomfield' },
"""
if old_football not in text:
    raise RuntimeError('1997 football block drifted')
text = text.replace(old_football, new_football, 1)
text = text.replace(
    "{ who: null, text: 'במחצית, מישהו עם טרנזיסטור מאחור: \"באוסישקין נגמר. ירדו.\" אבא שמע. הסתכל עליך. לא אמר כלום.' }",
    "{ who: null, text: 'מישהו עם טרנזיסטור מאחור מעביר את הידיעה מאוסישקין: עוד נשארו בחיים. אבא שמע. הסתכל עליך. לא אמר כלום.' }",
)
text = text.replace("{ who: 'קובי', text: 'היית צריך להיות שם?' },", "{ who: 'קובי', text: 'רצית להיות שם?' },")
# Both routes now feed the same historically correct chain.
text = text.replace(
    "{ id: 'yes', text: '\"כן.\"', then: [{ e: 'rel', who: 'kobi', axis: 'trust', delta: 3 }, { e: 'institution', key: 'ussishkinWound', delta: 8 }, { e: 'wellbeing', key: 'regret', delta: 6 }, { e: 'presence', mode: 'heard-from-friend' }] },",
    "{ id: 'yes', text: '\"כן.\"', then: [{ e: 'rel', who: 'kobi', axis: 'trust', delta: 3 }, { e: 'wellbeing', key: 'regret', delta: 3 }, { e: 'presence', mode: 'heard-from-friend' }, { e: 'goto', node: 'h1-chain' }] },",
)
text = text.replace(
    "{ id: 'here', text: '\"הייתי צריך להיות פה.\"', then: [{ e: 'rel', who: 'kobi', axis: 'bond', delta: 3 }, { e: 'redheart', key: 'familyTradition', delta: 3 }, { e: 'institution', key: 'ussishkinWound', delta: 5 }, { e: 'presence', mode: 'heard-from-friend' }] },",
    "{ id: 'here', text: '\"הייתי צריך להיות פה.\"', then: [{ e: 'rel', who: 'kobi', axis: 'bond', delta: 3 }, { e: 'redheart', key: 'familyTradition', delta: 3 }, { e: 'presence', mode: 'heard-from-friend' }, { e: 'goto', node: 'h1-chain' }] },",
)
insert_at = """  {
    id: 'h1-out',
"""
chain = """  {
    id: 'h1-chain',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'הערב באוסישקין השאיר את הקבוצה בחיים. לא יותר.' },
          { who: null, text: '30 במרץ. אילת. הפסד בחוץ, והשליטה כבר לא בידיים שלכם.' },
          { who: null, text: 'המחזור האחרון מגיע, והפועל בכלל לא משחקת. קבוצה אחת נעלמה מהליגה, והחיים שלכם תלויים עכשיו במשחק של מישהו אחר.' },
          { who: null, text: 'הידיעה מהרצליה מגיעה בלי כדור ביד ובלי פרקט מתחת לרגליים. הפעם זה סופי: הירידה הראשונה.' },
        ],
        choices: [
          { id: 'write', text: 'לבקש מלימור לרשום את התאריך.', then: [{ e: 'rel', who: 'crowd-limor', axis: 'sharedHistory', delta: 4 }, { e: 'institution', key: 'ussishkinWound', delta: 8 }, { e: 'redheart', key: 'historyMemory', delta: 4 }, { e: 'goto', node: 'h1-after-chain' }] },
          { id: 'carry', text: 'לעזור לשחור לסגור את הערב.', then: [{ e: 'rel', who: 'shachor', axis: 'bond', delta: 4 }, { e: 'institution', key: 'supporterOwnershipSeed', delta: 5 }, { e: 'institution', key: 'ussishkinWound', delta: 8 }, { e: 'goto', node: 'h1-after-chain' }] },
          { id: 'home', text: 'ללכת לאבא. אין מה לפתור עכשיו.', then: [{ e: 'rel', who: 'kobi', axis: 'bond', delta: 3 }, { e: 'wellbeing', key: 'regret', delta: 3 }, { e: 'institution', key: 'ussishkinWound', delta: 7 }, { e: 'goto', node: 'h1-after-chain' }] },
        ],
      },
    ],
  },
  {
    id: 'h1-after-chain',
    nameHe: null,
    branches: [{ lines: [{ who: null, text: 'שנה עוברת. העלייה חזרה לא מוחקת את הדרך שבה ירדתם.' }], then: [{ e: 'events', events: DAY(H2, 1998, 2, at(19, 30), 'אביב 1998') }, { e: 'travel', to: 'ussishkin-outside', spawn: 'start' }] }],
  },
"""
if insert_at not in text:
    raise RuntimeError('1997 insertion point drifted')
text = text.replace(insert_at, chain + insert_at, 1)
write(p, text)

# 1999 — the second relegation is an away trip to Galil with a parallel dependency.
p = 'lib/life/content/chapter1999basket.ts'
text = read(p)
text = text.replace("if (state.flags['seed:hall']) return 'kiosk'\n  return 'ussishkin-hall'", "if (state.flags['seed:hall']) return 'kiosk'\n  return 'bus-station'")
text = text.replace("return 'ערב ירידה. שוב. האולם.'", "return '29 במרץ. לצפון. צריך את המשחק שלכם וגם חדשות מהרצליה.'")
text = text.replace(
    "{ who: null, text: 'הערב האחרון של עונה שכולם יודעים איך היא נגמרת. שנה אחרי שעלו. אף אחד לא אמר אז \"הבראנו\". צדקו.' }",
    "{ who: null, text: '29 במרץ 1999. הפינה של אוסישקין היא רק נקודת היציאה. המשחק בצפון, וגם משחק אחר קובע אם נשארים.' }",
)
text = text.replace("at: 'ussishkin-hall',", "at: 'bus-station',", 1)
text = text.replace(
    """      { a: 'card', titleHe: 'הערב האחרון', subHe: 'שוב', ms: 2200 },
      { a: 'match', script: 'hall-99' },
      { a: 'flag', flag: 'seed:hall' },
      { a: 'toast', text: 'הקיוסק. אסף אמר שנשארים שם עד שרפי סוגר.', tone: 'plain' },
""",
    """      { a: 'card', titleHe: '29.3.1999', subHe: 'גליל עליון · בחוץ', ms: 2200 },
      { a: 'talk', conversation: 'seed-away' },
""",
)
text = text.replace("'ירדו שוב, ובמקום לשבור משהו כתבת דף.", "'ירדו שוב, והדרך חזרה מהצפון הייתה ארוכה. במקום לשבור משהו כתבת דף.")
text = text.replace("'ירדו שוב, וכעסת.", "'ירדו שוב, ובדרך חזרה מהצפון כעסת.")
insert_at = """  {
    id: 'seed-gate5',
"""
away = """  {
    id: 'seed-away',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'האוטובוס עולה צפונה. אף אחד לא שר הרבה. לפני המשחק כבר ברור ששני לוחות תוצאות חשובים הערב, לא אחד.' },
          { who: null, text: 'מקנטס לא משחק. כסף שלא שולם הפך מחדר הנהלה לחור בסגל.' },
          { who: null, text: 'כשהערב נגמר אין חישוב להציל: גם המשחק שלכם וגם התלות בהרצליה נסגרו נגדכם. יורדים שוב.' },
          { who: 'שחור', text: 'כשחוזרים לתל אביב לא הולכים הביתה. לרפי.' },
        ],
        choices: [
          { id: 'sit', text: 'לשבת ליד שחור בדרך חזרה.', then: [{ e: 'rel', who: 'shachor', axis: 'sharedHistory', delta: 5 }, { e: 'presence', mode: 'inside' }, { e: 'flag', flag: 'seed:hall' }, { e: 'travel', to: 'kiosk', spawn: 'start' }] },
          { id: 'write', text: 'לרשום בדרך מה קרה, לפני שהכעס מסדר את הזיכרון.', then: [{ e: 'redheart', key: 'historyMemory', delta: 5 }, { e: 'personality', key: 'honesty', delta: 2 }, { e: 'presence', mode: 'inside' }, { e: 'flag', flag: 'seed:hall' }, { e: 'travel', to: 'kiosk', spawn: 'start' }] },
        ],
      },
    ],
  },
"""
if insert_at not in text:
    raise RuntimeError('1999 insertion point drifted')
text = text.replace(insert_at, away + insert_at, 1)
write(p, text)

# Goal geography for 1999 must point north-bound, not to the home hall.
replace_once(
    'lib/life/content/goals.ts',
    "if (flag(state, 'seed:hall')) return 'kiosk'\n  return 'ussishkin-hall'",
    "if (flag(state, 'seed:hall')) return 'kiosk'\n  return 'bus-station'",
)

# 2000 title: our final whistle does not itself declare the title. Information must arrive.
p = 'lib/life/content/chapter2000double.ts'
text = read(p)
text = text.replace("return 'תיקו מספיק. איך מגיעים — ועם מי.'", "return 'האליפות יכולה להיסגר היום. איך מגיעים — ועם מי.'")
text = text.replace(
    "{ who: null, text: 'שבת, אמצע מאי. עשרים ושתיים. תיקו היום במגרש קטן בשכונת התקווה — ואתם אלופים. תיקו. רק תיקו.' }, { who: null, text: 'שתיים ותשעים לימדו אותך לא לחשב לפני. אז אתה לא מחשב. אתה רק לא מצליח לאכול.' }",
    "{ who: null, text: 'שבת, אמצע מאי. עשרים ושתיים. האליפות יכולה להיסגר היום במגרש קטן בשכונת התקווה — אבל המשחק שלכם הוא לא כל החשבון.' }, { who: null, text: 'שתיים ותשעים לימדו אותך לא לחגוג מספר לפני שאתה יודע מה קרה גם במקום האחר. אתה רק לא מצליח לאכול.' }",
)
old_match = """  {
    id: 't-match',
    nameHe: null,
    branches: [
      {
        lines: [{ who: null, text: 'השריקה. יציע שלם לא בטוח שמותר.' }],
        choices: [
          { id: 'believe', text: 'להאמין. עכשיו.', then: [{ e: 'wellbeing', key: 'happiness', delta: 12 }, { e: 'goto', node: 't-champions' }] },
          { id: 'wait', text: 'לחכות. שמישהו יגיד את המילה.', when: { lacesIs: 'witness' }, hidden: true, then: [{ e: 'goto', node: 't-champions' }] },
          { id: 'wait2', text: 'לחכות. שמישהו יגיד את המילה.', when: { none: [{ lacesIs: 'witness' }] }, hidden: true, then: [{ e: 'goto', node: 't-champions' }] },
        ],
      },
    ],
  },
"""
new_match = """  {
    id: 't-match',
    nameHe: null,
    branches: [
      {
        lines: [{ who: null, text: 'השריקה אצלכם. היציע מסתכל הצידה, אל רדיו, טלפון, פנים של מישהו שיודע.' }],
        choices: [
          { id: 'listen', text: 'לחפש את הידיעה, לא את החגיגה.', then: [{ e: 'goto', node: 't-confirm' }] },
          { id: 'wait', text: 'לחכות. 1998 לימדה אותך מה שווה שמועה.', then: [{ e: 'goto', node: 't-confirm' }] },
        ],
      },
    ],
  },
  {
    id: 't-confirm',
    nameHe: null,
    branches: [
      { when: { flag: 't:with-kobi' }, lines: [{ who: null, text: 'הידיעה מגיעה מהמשחק המקביל. עכשיו החשבון סגור.' }, { who: 'פוגי', text: 'בטוח?' }, { who: 'קובי', text: 'בטוח.' }], then: [{ e: 'flag', flag: 't:confirmed' }, { e: 'goto', node: 't-champions' }] },
      { lines: [{ who: null, text: 'הידיעה מגיעה מהמשחק המקביל. לא שמועה, לא מישהו שחשב ששמע. עכשיו החשבון סגור.' }], then: [{ e: 'flag', flag: 't:confirmed' }, { e: 'goto', node: 't-champions' }] },
    ],
  },
"""
if old_match not in text:
    raise RuntimeError('2000 title match block drifted')
text = text.replace(old_match, new_match, 1)
text = text.replace("'תיקו במגרש קטן בשכונה, ואתם אלופים.", "'השריקה אצלכם לא הספיקה; רק כשהגיעה הידיעה מהמשחק המקביל ידעתם. ואז אתם אלופים.")

# Four days: remove the global optimisation board. The first afternoon is chosen by where
# the player walks; local conversations offer only things that make sense in that place.
text = text.replace("return 'ארבעה ימים. שני דברים. לא יותר.'", "return state.flags['d:pick1'] ? 'עוד אחר הצהריים אחד לפני הגמר. לך למקום שחשוב לך.' : 'יום ראשון אחרי האליפות. הגוף, הבית, העבודה, היציע או האולם — לא הכול.'")
text = text.replace("{ a: 'talk', conversation: 'd-days' },", "{ a: 'flag', flag: 'd:afternoon1' }, { a: 'lines', lines: [{ who: null, text: 'יום ראשון. ארבעה ימים לגמר. אין רשימת משימות — יש עיר, גוף, משפחה ואנשים שמחכים. לך לאן שאתה בוחר.' }] },")
# Insert location beats before the stadium beat.
needle = """  {
    id: 'd-stadium',
"""
beats = """  { id: 'd-home-afternoon', at: 'home', trigger: 'enter', when: { flag: 'd:opened', none: [{ flag: 'd:final' }] }, do: [{ a: 'talk', conversation: 'd-home-afternoon' }] },
  { id: 'd-kiosk-afternoon', at: 'kiosk', trigger: 'enter', when: { flag: 'd:opened', none: [{ flag: 'd:final' }] }, do: [{ a: 'talk', conversation: 'd-kiosk-afternoon' }] },
  { id: 'd-gate5-afternoon', at: 'bloomfield-outside', trigger: 'enter', when: { flag: 'd:opened', none: [{ flag: 'd:final' }] }, do: [{ a: 'talk', conversation: 'd-gate5-afternoon' }] },
  { id: 'd-uss-afternoon', at: 'ussishkin-outside', trigger: 'enter', when: { flag: 'd:opened', none: [{ flag: 'd:final' }] }, do: [{ a: 'talk', conversation: 'd-uss-afternoon' }] },
"""
if needle not in text:
    raise RuntimeError('2000 beat insertion point drifted')
text = text.replace(needle, beats + needle, 1)
# Replace global d-days through d-days-2 with local conversations; leave d-box/d-go intact.
start = text.index("  {\n    id: 'd-days',")
end = text.index("  {\n    /**\n     * הקופסה האדומה", start)
local = """  {
    id: 'd-home-afternoon', nameHe: null, branches: [
      { lines: [{ who: null, text: 'בבית השקט נשמע פתאום חזק יותר מהאליפות.' }], choices: [
        { id: 'sleep', text: 'לישון באמת.', when: { none: [{ flag: 'd:pick1:sleep' }] }, then: [{ e: 'energy', delta: 40 }, { e: 'flag', flag: 'd:pick1:sleep' }, { e: 'goto', node: 'd-next-afternoon' }] },
        { id: 'family', text: 'לשבת עם אבא ואמא בלי לדבר על הגמר.', when: { none: [{ flag: 'd:pick1:family' }] }, then: [{ e: 'rel', who: 'kobi', axis: 'bond', delta: 6 }, { e: 'rel', who: 'rachel', axis: 'bond', delta: 6 }, { e: 'energy', delta: 10 }, { e: 'flag', flag: 'd:pick1:family' }, { e: 'goto', node: 'd-next-afternoon' }] },
        { id: 'box', text: 'לעלות לחדר ולפתוח את הקופסה האדומה.', when: { none: [{ flag: 'd:pick1:box' }] }, then: [{ e: 'redheart', key: 'historyMemory', delta: 6 }, { e: 'flag', flag: 'd:pick1:box' }, { e: 'box' }, { e: 'goto', node: 'd-box' }] },
      ] },
    ],
  },
  {
    id: 'd-kiosk-afternoon', nameHe: null, branches: [
      { lines: [{ who: null, text: 'אצל רפי יש עבודה, ויש בחלון דף ישן שאתה מכיר טוב מדי.' }], choices: [
        { id: 'work', text: 'לקחת משמרת. הגמר עולה כסף.', when: { none: [{ flag: 'd:pick1:work' }] }, then: [{ e: 'money', agorot: 9000, why: 'משמרת כפולה' }, { e: 'energy', delta: -15 }, { e: 'flag', flag: 'd:pick1:work' }, { e: 'goto', node: 'd-next-afternoon' }] },
        { id: 'page', text: 'לחזור לדף ולתקן את מה שאתה יודע שלא נכון.', when: { all: [{ flag: 'life:page:pinned' }], none: [{ flag: 'd:pick1:page' }] }, hidden: true, then: [{ e: 'flag', flag: 'd:pick1:page' }, { e: 'goto', node: 'd-page' }] },
      ] },
    ],
  },
  {
    id: 'd-gate5-afternoon', nameHe: null, branches: [
      { when: { gateEver: 'gate5' }, lines: [{ who: null, text: 'ליד בלומפילד כבר פרוש בד על הרצפה. אף אחד לא קורא לזה משימה.' }], choices: [{ id: 'banner', text: 'לרדת על הברכיים ולעבוד איתם.', when: { none: [{ flag: 'd:pick1:gate5' }] }, then: [{ e: 'rel', who: 'asaf', axis: 'bond', delta: 6 }, { e: 'redheart', key: 'terraceCulture', delta: 5 }, { e: 'energy', delta: -20 }, { e: 'flag', flag: 'd:pick1:gate5' }, { e: 'flag', flag: 'life:banner:2000' }, { e: 'proof', kind: 'creation_proof', proofId: 'creation_proof:{chapter}:banner', subjectHe: BANNER_SUBJECT, noteHe: 'לילה שלם על הרצפה של מחסן, עם צבע שמתייבש לאט.' }, { e: 'skill', skill: 'creativity', delta: 3, why: 'הכין בד' }, { e: 'goto', node: 'd-next-afternoon' }] }] },
      { lines: [{ who: null, text: 'אתה מכיר את המקום. לא את העבודה הזאת. היום אין לך סיבה להישאר.' }] },
    ],
  },
  {
    id: 'd-uss-afternoon', nameHe: null, branches: [
      { lines: [{ who: 'שחור', text: 'אליפות יפה. עכשיו תרים את הצד הזה.' }], choices: [{ id: 'help', text: 'להרים. ברור.', when: { none: [{ flag: 'd:pick1:uss' }] }, then: [{ e: 'rel', who: 'shachor', axis: 'bond', delta: 6 }, { e: 'institution', key: 'supporterOwnershipSeed', delta: 6 }, { e: 'energy', delta: -10 }, { e: 'flag', flag: 'd:pick1:uss' }, { e: 'goto', node: 'd-next-afternoon' }] }] },
    ],
  },
  {
    id: 'd-next-afternoon', nameHe: null, branches: [
      { when: { flag: 'd:pick1' }, lines: [{ who: null, text: 'זה הדבר השני. מחר הגמר.' }], then: [{ e: 'flag', flag: 'd:final' }, { e: 'goto', node: 'd-go' }] },
      { lines: [{ who: null, text: 'יום שלישי. נשאר עוד אחר הצהריים אחד לפני הגמר.' }], then: [{ e: 'flag', flag: 'd:pick1' }] },
    ],
  },
"""
text = text[:start] + local + text[end:]
# Existing d-page branches used to return to the deleted d-days-2 menu. Return to local day turn.
text = text.replace("{ e: 'goto', node: 'd-days-2' }", "{ e: 'goto', node: 'd-next-afternoon' }")
write(p, text)

# Historical media registry: add only items safe enough to classify. Context-only material is
# explicitly typed in the title/subtitle and never used as exact-match evidence.
p = 'lib/life/cutscenes.ts'
text = read(p)
insert = """  '1993-cup': {
    id: '1993-cup', youtubeId: 'I5FHT27dRgY', titleHe: 'גמר הגביע — ארכיון', subtitleHe: 'אחרי שפוגי כבר יודע מה קרה',
    sourceTitle: 'ארכיון וידאו — YouTube', sourceUrl: 'https://www.youtube.com/watch?v=I5FHT27dRgY', completionFlag: 'cutscene:1993-cup', watchedFlag: 'watched:1993-cup', nextObjectiveHe: 'הלילה עוד לא נגמר.', fallbackHe: 'הארכיון לא נפתח. הזיכרון המאויר ממשיך.',
  },
  '1999-basket-context': {
    id: '1999-basket-context', youtubeId: 'GFRF2t7jXXE', titleHe: '1999 — הקשר מהארכיון', subtitleHe: 'תיעוד תקופה, לא צילום של משחק הירידה',
    sourceTitle: 'תיעוד תקופה — YouTube', sourceUrl: 'https://www.youtube.com/watch?v=GFRF2t7jXXE', completionFlag: 'cutscene:1999-basket-context', watchedFlag: 'watched:1999-basket-context', nextObjectiveHe: 'חזרה לתל אביב.', fallbackHe: 'התיעוד לא נפתח. הסיפור ממשיך בלי להמציא צילום שלא קיים.',
  },
  '2000-title': {
    id: '2000-title', youtubeId: 'pdQLDp_-Xgo', titleHe: 'האליפות — ארכיון', subtitleHe: 'רק אחרי שהאישור הגיע',
    sourceTitle: 'ארכיון וידאו — YouTube', sourceUrl: 'https://www.youtube.com/watch?v=pdQLDp_-Xgo', completionFlag: 'cutscene:2000-title', watchedFlag: 'watched:2000-title', nextObjectiveHe: 'עוד ארבעה ימים גמר גביע.', fallbackHe: 'הארכיון לא נפתח. החגיגה המאוירת ממשיכה.',
  },
  '2000-double': {
    id: '2000-double', youtubeId: 'RO14bGFcD-Q', titleHe: 'גמר הגביע — ארכיון', subtitleHe: 'הדאבל',
    sourceTitle: 'ארכיון וידאו — YouTube', sourceUrl: 'https://www.youtube.com/watch?v=RO14bGFcD-Q', completionFlag: 'cutscene:2000-double', watchedFlag: 'watched:2000-double', nextObjectiveHe: 'הדרך הביתה.', fallbackHe: 'הארכיון לא נפתח. הגמר והדרך הביתה ממשיכים במשחק.',
  },
  '2000-penalties': {
    id: '2000-penalties', youtubeId: 'EGlBnUQN5AQ', titleHe: 'הפנדלים — ארכיון', subtitleHe: 'רגע ממוקד מתוך הגמר',
    sourceTitle: 'ארכיון וידאו — YouTube', sourceUrl: 'https://www.youtube.com/watch?v=EGlBnUQN5AQ', completionFlag: 'cutscene:2000-penalties', watchedFlag: 'watched:2000-penalties', nextObjectiveHe: 'לנשום. ואז הביתה.', fallbackHe: 'הקטע לא נפתח. רגע הפנדלים המאויר ממשיך.',
  },
"""
marker = "export const CUTSCENES: Record<string, HistoricalCutscene> = {\n"
if marker not in text:
    raise RuntimeError('cutscene registry marker missing')
text = text.replace(marker, marker + insert, 1)
write(p, text)

# RC contract guards the specific regressions this pass exists to eliminate.
test = r"""import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const f = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

describe('1983–2000 release candidate contract', () => {
  it('gates A1 behind Opening and keeps childhood out of Traveller capability', () => {
    expect(f('lib/life/runtime/scenes/BootScene.ts')).toContain('OPENING_FLAG')
    const a = f('lib/life/content/chapterStageA.ts')
    expect(a).toContain("life:a1:instinct")
    expect(a).toContain("a1-kobi")
    expect(a).not.toMatch(/id: 'ears'[\s\S]{0,400}streetSmarts/)
  })
  it('starts 1986 from continuity, not a key hunt', () => {
    expect(f('lib/life/content/chapters.ts')).toContain("{ t: 'flag.raised', flag: 'knows:match' }")
    expect(f('lib/life/content/goals.ts')).not.toContain("return (state.inventory['house-key'] ?? 0) > 0 ? 'home' : 'bedroom'")
  })
  it('turns the 1986 passage into a documentary bridge with the 1989 wound', () => {
    const p = f('lib/life/runtime/scenes/PassageScene.ts')
    expect(p).toContain("titleHe: '1989'")
    expect(p).toContain('if (this.seen >= 1) this.finish()')
  })
  it('does not train Traveller capability at school', () => {
    expect(f('lib/life/content/dialogue1991.ts')).not.toContain("key: 'streetSmarts'")
  })
  it('models 1997 as a chain, not one fake relegation night', () => {
    const c = f('lib/life/content/chapter1997basket.ts')
    expect(c).toContain('27 במרץ 1997')
    expect(c).toContain('30 במרץ')
    expect(c).toContain('הרצליה')
    expect(c).not.toContain("match', script: 'hall-97'")
  })
  it('models 1999 as an away trip with parallel dependency', () => {
    const c = f('lib/life/content/chapter1999basket.ts')
    expect(c).toContain('29 במרץ 1999')
    expect(c).toContain('גליל עליון')
    expect(c).toContain('הרצליה')
    expect(c).not.toContain("script: 'hall-99'")
  })
  it('confirms the 2000 title from parallel information and removes the seven-item board', () => {
    const c = f('lib/life/content/chapter2000double.ts')
    expect(c).toContain("id: 't-confirm'")
    expect(c).toContain('המשחק המקביל')
    expect(c).not.toContain('יש שבעה דברים שצריך. יש זמן לשניים.')
    expect(c).not.toContain("id: 'd-days'")
  })
  it('classifies the 1999 film as context, not exact match footage', () => {
    const c = f('lib/life/cutscenes.ts')
    expect(c).toContain('1999-basket-context')
    expect(c).toContain('תיעוד תקופה, לא צילום של משחק הירידה')
    expect(c).toContain('pdQLDp_-Xgo')
    expect(c).toContain('RO14bGFcD-Q')
  })
})
"""
write('tests/life-1983-2000-rc.test.ts', test)

print('1983–2000 RC applied successfully')
