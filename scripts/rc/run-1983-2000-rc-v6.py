from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
subprocess.run(['python3', 'scripts/rc/run-1983-2000-rc-v5.py'], cwd=ROOT, check=True)

p = ROOT / 'lib/life/content/chapter2000double.ts'
text = p.read_text(encoding='utf-8')
if "id: 'd-page'" not in text:
    marker = """  {
    id: 'd-next-afternoon', nameHe: null, branches: [
"""
    node = """  {
    id: 'd-page',
    nameHe: null,
    branches: [
      {
        lines: [
          { who: null, text: 'הדף הישן עדיין שם. הפעם אתה לא רק זוכר מה כאב בו — אתה יודע מה צריך לתקן.' },
          { who: null, text: 'אתה מוסיף הערה קטנה בשוליים ומשאיר את המקור ליד. לא מנצח ויכוח; משאיר עקבה אמינה יותר.' },
        ],
        then: [
          { e: 'redheart', key: 'historyMemory', delta: 5 },
          { e: 'personality', key: 'honesty', delta: 2 },
          { e: 'flag', flag: 'd:pick1:page' },
          { e: 'goto', node: 'd-next-afternoon' },
        ],
      },
    ],
  },
"""
    if marker not in text:
        raise RuntimeError('d-next-afternoon insertion point missing')
    text = text.replace(marker, node + marker, 1)
p.write_text(text, encoding='utf-8')
print('2000 kiosk archive route closed with d-page node')
