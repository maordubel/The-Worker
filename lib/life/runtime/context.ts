import type { HistoricalAnchor } from '../anchors'
import type { LifeEngine } from '../engine'

import type { LifeBus } from './bus'
import type { DialogueRunner } from './dialogue'
import type { InputState } from './input'

/**
 * מה שכל סצנה צריכה. Held in Phaser's registry under one key, so a scene reaches the
 * life through a typed object instead of through a global — and so a test can build the
 * whole context without a canvas.
 */
export type LifeContext = {
  engine: LifeEngine
  bus: LifeBus
  input: InputState
  dialogue: DialogueRunner
  /** the chapter's canonical anchor, resolved server-side from the archive */
  anchor: HistoricalAnchor
  prologueAnchor: HistoricalAnchor
}

export const CONTEXT_KEY = 'life'
