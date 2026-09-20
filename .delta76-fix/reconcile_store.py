from pathlib import Path

p = Path('lib/polls/store.ts')
text = p.read_text()


def must_replace(old: str, new: str, label: str) -> None:
    global text
    if old not in text:
        raise SystemExit(f'poll store anchor missing: {label}')
    text = text.replace(old, new, 1)


if "from './reasons'" not in text:
    must_replace(
        "import { BALLOT, type Ballot, type Tally, type TallyRow } from './ballot'\n",
        "import { BALLOT, type Ballot, type Tally, type TallyRow } from './ballot'\n"
        "import { cleanReasons, isReasonOf, type Reasons } from './reasons'\n",
        'reasons import',
    )

if 'reasons(): Promise<Reasons>' not in text:
    must_replace(
        "  seal(): Promise<void>\n}\n\nconst KEY",
        "  seal(): Promise<void>\n"
        "  reasons(): Promise<Reasons>\n"
        "  saveReason(questionId: string, reason: string): Promise<void>\n"
        "}\n\nconst KEY",
        'interface',
    )

if "const REASON_KEY = 'worker.ballot.reasons.v1'" not in text:
    must_replace(
        "const SEAL_KEY = 'worker.ballot.sealed.v1'\n",
        "const SEAL_KEY = 'worker.ballot.sealed.v1'\n"
        "const REASON_KEY = 'worker.ballot.reasons.v1'\n",
        'reason key',
    )

text = text.replace(
    "for (const key of [KEY, SEAL_KEY]) window.localStorage.removeItem(key)",
    "for (const key of [KEY, SEAL_KEY, REASON_KEY]) window.localStorage.removeItem(key)",
    1,
)

if 'async reasons(): Promise<Reasons>' not in text:
    anchor = """  async seal(): Promise<void> {
    try {
      window.localStorage.setItem(SEAL_KEY, '1')
    } catch {
      // an unsealed slip locally is still a sealed slip for this session — the stamp
      // already printed on screen, and losing the flag on reload is a smaller failure
      // than throwing during the one action the whole document leads up to
    }
  }
}"""
    replacement = anchor[:-1] + """

  async reasons(): Promise<Reasons> {
    try {
      const raw = window.localStorage.getItem(REASON_KEY)
      if (!raw) return {}
      const parsed: unknown = JSON.parse(raw)
      if (typeof parsed !== 'object' || parsed === null) return {}
      return cleanReasons(parsed as Record<string, unknown>)
    } catch {
      return {}
    }
  }

  async saveReason(questionId: string, reason: string): Promise<void> {
    if (!isReasonOf(questionId, reason)) return
    try {
      const current = await this.reasons()
      const next: Reasons = { ...current }
      if (next[questionId] === reason) delete next[questionId]
      else next[questionId] = reason
      window.localStorage.setItem(REASON_KEY, JSON.stringify(next))
    } catch {
      // reasons are optional and must never break the ballot
    }
  }
}"""
    must_replace(anchor, replacement, 'local reasons')

if 'return this.slip.reasons()' not in text:
    anchor = """  seal(): Promise<void> {
    return this.slip.seal()
  }
}"""
    replacement = anchor[:-1] + """

  reasons(): Promise<Reasons> {
    return this.slip.reasons()
  }

  saveReason(questionId: string, reason: string): Promise<void> {
    return this.slip.saveReason(questionId, reason)
  }
}"""
    must_replace(anchor, replacement, 'supabase reasons')

p.write_text(text)
