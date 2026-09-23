from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
subprocess.run(['python3', 'scripts/rc/run-1983-2000-rc-v4.py'], cwd=ROOT, check=True)

p = ROOT / 'lib/life/content/chapter1997basket.ts'
text = p.read_text(encoding='utf-8')
old = "{ e: 'events', events: DAY(H2, 1998, 2, at(19, 30), 'אביב 1998') }, { e: 'travel', to: 'ussishkin-outside', spawn: 'start' }"
if old not in text:
    raise RuntimeError('1997 post-chain conversation transition not found')
text = text.replace(old, "{ e: 'flag', flag: 'h1:chain-complete' }", 1)

marker = """  {
    id: 'h2-open',
"""
beat = """  {
    id: 'h1-chain-to-h2',
    trigger: 'clock',
    when: { flag: 'h1:chain-complete', none: [{ flag: H2 }] },
    delayMs: 700,
    do: [
      { a: 'events', events: DAY(H2, 1998, 2, at(19, 30), 'אביב 1998') },
      { a: 'card', titleHe: 'שנה אחרי', subHe: 'אוסישקין', ms: 2200 },
      { a: 'travel', to: 'ussishkin-outside', spawn: 'start' },
    ],
  },
"""
if marker not in text:
    raise RuntimeError('1997 H2 beat insertion point missing')
text = text.replace(marker, beat + marker, 1)
p.write_text(text, encoding='utf-8')

# The transition now uses the layer whose vocabulary owns raw LifeEvents.
if "e: 'events'" in text:
    raise RuntimeError('1997 conversation still contains unsupported raw events effect')
print('1997 chain transition moved to Beat action layer')
