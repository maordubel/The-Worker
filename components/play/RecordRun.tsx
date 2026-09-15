'use client'

import { useEffect, useRef } from 'react'

import { recordRun } from '@/lib/profile/store'

/**
 * הדיווח — the one line that makes a gate part of the personal area.
 *
 * Mounted by a result screen, it reports the finished round into the device's profile:
 * which gate, what it scored, how many were right out of how many asked. That is what
 * lets "המנוי שלך" print a wall of gates with your own history on it instead of a list
 * of links, and it is the whole of the "שהכל ידבר עם הכל" plumbing.
 *
 * **It reports from the RESULT screen, never from the run**, because the only moment
 * the app can honestly say you played something is the moment it ended. Opening a gate
 * and walking away is not a round, and a profile that counted it would be the first
 * number on that page that was not earned.
 *
 * The ref guards React's development double-invoke, which would otherwise record every
 * round twice — the same trap the LIFE intro's seen-flag fell into.
 */
export function RecordRun({
  gate,
  score,
  correct,
  asked,
}: {
  gate: string
  score?: number
  correct?: number
  asked?: number
}) {
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true
    recordRun({ gate, score, correct, asked })
  }, [gate, score, correct, asked])

  return null
}
