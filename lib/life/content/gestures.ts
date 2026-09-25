import type { Effect } from './script'

/**
 * תנועה של יד — the one thing a five-year-old can do on a pair of shoulders (Director V3
 * §12, "1983 memory: keep it short — reaction, grip, crowd").
 *
 * The prologue was five boxes of choices in a row: where to look, what to do with the
 * noise, what to answer his father, the red thing on the concrete, the stub. Every one of
 * them was a sentence the player picked, and the one moment in the memory that is pure
 * BODY — the shoulders jumping and a child grabbing his father's hair so as not to fall —
 * was a line he read. A gesture is that moment given back to the hand: a mark on the
 * painting, a squeeze (or a reach), and a memory that is a little different for the child
 * who held on and the child who did not. It is never a test: left alone it resolves by
 * itself, and both ways continue into the same next conversation.
 *
 * Content only. `PrologueScene` reads the row when a conversation opens
 * `{ e: 'minigame', id: 'gesture:<id>' }`, and nothing about 1983 lives in the scene.
 */
export type Gesture = {
  id: string
  /** where the mark sits, as fractions of the view (the prologue's painting fills it) */
  spot: { x: number; y: number }
  /** what the prompt says — the verb is the hand, the label the thing */
  verb: 'hold' | 'take'
  labelHe: string
  /**
   * presses to complete. Stage A keeps every gesture at ONE: a child's reaction, never a
   * count (owner decision, delta 90) — `tests/life-stagea-quest-90c` holds it.
   */
  taps: number
  /** what each press before the last one feels like */
  tapHe?: readonly string[]
  /** left alone this long, it resolves by itself, as `ignored` */
  autoMs: number
  /** the picture jumps while the mark waits (the terrace erupting) — transform only */
  shake?: boolean
  done: readonly Effect[]
  ignored: readonly Effect[]
  /** a line for each way it went, at the foot of the glass */
  doneHe: string
  ignoredHe: string
  /** the conversation that follows either way */
  next: string
}

export const GESTURE_PREFIX = 'gesture:'

export const GESTURES: Record<string, Gesture> = {
  /** 1.6.1983 — the eruption, and the fall that does not happen */
  'grip-1983': {
    id: 'grip-1983',
    spot: { x: 0.5, y: 0.78 },
    verb: 'hold',
    labelHe: 'חזק בשיער של אבא',
    /**
     * One reach, not three presses (owner, 23.9.2026: the gestures stay, "but no
     * tap-counting feel — a child's reaction, not a test"). Three presses with a caption
     * after each read as a meter filling; one hand closing on his father's hair is the
     * reaction the memory is about. The terrace still jumps under him while he decides.
     */
    taps: 1,
    autoMs: 5200,
    shake: true,
    done: [
      { e: 'flagValue', flag: 'life:a1:grip', value: 'held' },
      { e: 'rel', who: 'kobi', axis: 'trust', delta: 1 },
      { e: 'personality', key: 'courage', delta: 1 },
    ],
    ignored: [
      { e: 'flagValue', flag: 'life:a1:grip', value: 'caught' },
      { e: 'wellbeing', key: 'stress', delta: 2 },
      { e: 'rel', who: 'kobi', axis: 'familiarity', delta: 2 },
    ],
    doneHe: 'שתי ידיים בשיער שלו. לא נפלת.',
    ignoredHe: 'החלקת. יד גדולה תפסה אותך בקרסול והחזירה אותך למעלה, בלי להסתכל.',
    next: 'a1-goal',
  },
  /** the red thing on the concrete — only for a child who looked at the floor */
  'red-1983': {
    id: 'red-1983',
    spot: { x: 0.42, y: 0.9 },
    verb: 'take',
    // the choice this replaced said "להתכופף ולקחת אותו." — the prompt reads "תיקח את …"
    labelHe: 'הדבר האדום מהבטון',
    taps: 1,
    autoMs: 5000,
    done: [
      { e: 'give', item: 'scarf' },
      // `own:` and `life:`, not `a1:` — a year change empties the inventory and every flag
      // that is not one of those prefixes (`personFlags`); the scrap is kept for life
      { e: 'flag', flag: 'own:red-scrap' },
      { e: 'flag', flag: 'life:a1:red' },
      { e: 'personality', key: 'impulsiveness', delta: 1 },
      { e: 'redheart', key: 'historyMemory', delta: 3 },
    ],
    ignored: [{ e: 'flag', flag: 'life:a1:red-left' }],
    doneHe: 'בד אדום, רטוב מהבטון, בתוך האגרוף.',
    ignoredHe: 'השארת אותו. לא שחררת את אבא.',
    next: 'a1-stub',
  },
}
