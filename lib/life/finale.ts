import type { LifeEvent } from './events'
import { redHeartReading } from './profile'
import { flagOn, type LifeState } from './types'

/**
 * מה נשאר ממנו — the end of Stage A, as a judgement the game is willing to make.
 *
 * Every other screen in THE WORKER LIFE describes; this one CONCLUDES, and that is a
 * different and much riskier job. A chapter that ends by listing what happened has not
 * ended, it has stopped. So this file answers one question in one sentence — what did
 * this afternoon make of this child — and it answers it from what the player actually
 * did, never from a score.
 *
 * The rules it follows are the ones the systems pass set and this screen must not break:
 *
 * · **No numbers reach the player.** `redHeartReading` already turns the Red Heart into
 *   bands and words; this reads the bands and picks a sentence. Nothing here prints a
 *   value and nothing here can, because it never sees one.
 * · **There is no best ending.** The four sentences below are four different children,
 *   not a ladder with a win at the top. The child who got in on somebody's kindness is
 *   not behind the child who got in on a ticket — §26 of the brief, and the whole reason
 *   the chapter has more than one way into the ground.
 * · **It is pure.** State in, words out, no engine, no bus, no Phaser. Which means
 *   `tests/life-systems.test.ts` can walk a dozen different afternoons through it and
 *   assert that every one of them gets a sentence, and that no two obviously-different
 *   lives get the same one.
 */

export type FinaleCard = {
  titleHe: string
  bodyHe: string
  becameHe: string
  /** the real ticket is only shown to a child who actually had one */
  keptTicket: boolean
  /** paper in the air — earned by being inside the ground, not by finishing */
  carnival: boolean
}

export function buildFinale(state: LifeState, events: readonly LifeEvent[]): FinaleCard {
  const sawGoal = flagOn(state, 'saw:goal')
  const gotIn = flagOn(state, 'entry:granted') || sawGoal
  const alone = flagOn(state, 'went:alone')
  const hadTicket = flagOn(state, 'entry:ticket') || (state.inventory['ticket-stub'] ?? 0) > 0
  const heart = new Map(redHeartReading(state).map((entry) => [entry.key, entry.band]))
  const community = heart.get('community') ?? 0
  const football = heart.get('footballLove') ?? 0
  const kept = events.some((event) => event.t === 'redbox.item_added')

  if (sawGoal) {
    return {
      titleHe: 'היית שם',
      bodyHe:
        'ארבעים שנה אחר כך אנשים עוד יריבו על הנבדל הזה, ואתה תדע בדיוק איפה עמדת כשזה קרה. לא שמעת את זה ברדיו ולא סיפרו לך במוצאי שבת. ראית.',
      becameHe: becameLine({ alone, community, football, gotIn: true }),
      keptTicket: hadTicket || kept,
      carnival: true,
    }
  }

  if (gotIn) {
    return {
      titleHe: 'נכנסת',
      bodyHe:
        'הגעת אחרי שזה כבר קרה, לתוך יציע שכבר צרח. לא ראית את הכדור נכנס — אבל עמדת בפנים כשכולם עוד רעדו, וזה גם משהו שלא לוקחים ממך.',
      becameHe: becameLine({ alone, community, football, gotIn: true }),
      keptTicket: hadTicket || kept,
      carnival: true,
    }
  }

  return {
    titleHe: 'שמעת מבחוץ',
    bodyHe:
      'עמדת ברחוב כשהרעש עלה מכיוון מזרח, וידעת מיד מה זה. כל השכונה ידעה. פשוט לא היית בפנים, והיום הזה נגמר לך אחרת מאיך שהוא נגמר לכולם.',
    becameHe: becameLine({ alone, community, football, gotIn: false }),
    keptTicket: hadTicket || kept,
    carnival: false,
  }
}

/**
 * The one sentence. Four children, no ranking.
 *
 * Order matters and is not arbitrary: the strongest, most specific claim is tested first,
 * so a child who did the hardest thing is not described by a line that would also fit
 * somebody who did the easiest.
 */
function becameLine(args: { alone: boolean; community: number; football: number; gotIn: boolean }): string {
  if (args.gotIn && args.alone && args.community >= 2) {
    return 'הלכת לבד, ואנשים זרים לקחו אותך פנימה. מהיום אתה יודע שהאדומים זה לא הקבוצה — זה מי שעומד לידך.'
  }
  if (args.gotIn && args.alone) {
    return 'יצאת מהדלת לבד וסידרת את זה לבד. אף אחד לא לקח אותך לשם — הלכת.'
  }
  if (args.football >= 2) {
    return 'משהו נכנס לך היום מתחת לעור ולא ייצא משם. עוד לא קוראים לזה בשם, אבל זה כבר שלך.'
  }
  return 'לא כל יום גדול הוא היום שלך. גם את זה למדת היום, וזה שיעור שאף אחד לא בוחר.'
}
