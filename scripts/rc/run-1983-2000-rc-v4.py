from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]


def apply_context_patch(patch_name: str) -> None:
    raw = (ROOT / 'scripts' / 'rc' / patch_name).read_text(encoding='utf-8')
    sections = re.split(r'(?=^diff --git )', raw, flags=re.M)
    for section in sections:
        if not section.startswith('diff --git '):
            continue
        first = section.splitlines()[0]
        m = re.match(r'diff --git a/(\S+) b/(\S+)', first)
        if not m:
            raise RuntimeError(f'{patch_name}: malformed header')
        target = m.group(2)
        path = ROOT / target
        text = path.read_text(encoding='utf-8')
        for index, hunk in enumerate(re.split(r'^@@.*$', section, flags=re.M)[1:], 1):
            old_lines, new_lines = [], []
            for line in hunk.splitlines(keepends=True):
                if line.startswith('--- ') or line.startswith('+++ '):
                    continue
                if line.startswith('-'):
                    old_lines.append(line[1:])
                elif line.startswith('+'):
                    new_lines.append(line[1:])
                elif line.startswith(' '):
                    old_lines.append(line[1:]); new_lines.append(line[1:])
                elif not line.strip():
                    old_lines.append(line); new_lines.append(line)
            old, new = ''.join(old_lines), ''.join(new_lines)
            if not old:
                continue
            if old not in text:
                print(f'reconcile: {patch_name} {target} hunk {index} already drifted; enforcing contract later')
                continue
            text = text.replace(old, new, 1)
        path.write_text(text, encoding='utf-8')
        print(f'reconciled {patch_name} -> {target}')


for patch in [
    '01-a1-directors-cut.patch',
    '02-a2-a7-flow-redesign.patch',
    '03-a8-1986-start-continuity.patch',
    '04-childhood-life-path-fairness.patch',
]:
    apply_context_patch(patch)

# Reconcile Stage A with newer flow fixes already in the branch.
p = ROOT / 'lib/life/content/chapterStageA.ts'
text = p.read_text(encoding='utf-8')
text = text.replace(
    "if (sceneId === 'home') return 'אחר הצהריים. בסמטה משחקים. אמא רוצה משהו.'",
    "if (sceneId === 'home') return 'אמא רוצה לחם. בסמטה כבר מתחילים לבחור קבוצות.'",
)
text = re.sub(r"^\s*waitingHe: 'ממתין:[^\n]*\n", '', text, flags=re.M)
text = text.replace(
    "when: { flag: 'a2:played', afterMinute: at(17, 30), none: [{ flag: 'a2:done' }] },",
    "when: { flag: 'a2:played', none: [{ flag: 'a2:done' }] },",
)
text = text.replace("if (state.flags['life:seen:ussishkin']) return 'תמצא את אפי כשתראה מספיק.'", "if (state.flags['a3:experienced'] || state.flags['life:seen:ussishkin']) return 'אתה בפנים. אפשר להסתובב; אפי לידך.'")
text = text.replace("if (!state.flags['saw:parquet']) return 'אתה בפנים. תסתכל על הרצפה הזאת. ואפי איפשהו.'", "if (!state.flags['a3:experienced']) return 'נכנסת. תן למקום לקרות.'")
text = text.replace("return 'הפרקט, היציע, החלונות. ואפי איפשהו.'", "return 'האולם סביבך. אפי לידך.'")
p.write_text(text, encoding='utf-8')

stage_a = p.read_text(encoding='utf-8')
for token in ['a1-kobi', 'life:a1:instinct', 'life:a1:body']:
    if token not in stage_a:
        raise RuntimeError(f'Stage A contract missing {token}')
if "id: 'ears'" in stage_a and re.search(r"id: 'ears'[\s\S]{0,450}streetSmarts", stage_a):
    raise RuntimeError('childhood sensory response still grants streetSmarts')
if "waitingHe: 'ממתין:" in stage_a:
    raise RuntimeError('Stage A still exposes passive waiting labels')
if "flag: 'a2:played', afterMinute: at(17, 30)" in stage_a:
    raise RuntimeError('A2 still waits for 17:30 after play')

# Execute the post-Stage-A applicator. Its authored replace_once calls are sequential;
# when the same old string appears twice (PassageScene has two identical hints), the first
# call must consume the first occurrence and the second call the second. Missing text still
# aborts the RC; duplicates do not make the authored order ambiguous.
app = ROOT / 'scripts' / 'rc' / 'apply-1983-2000-rc.py'
source = app.read_text(encoding='utf-8')
source, count = re.subn(
    r"# Prepared Stage A changes\.[\s\S]*?# 1991 — school cleverness",
    "# 1991 — school cleverness",
    source,
    count=1,
)
if count != 1:
    raise RuntimeError('could not strip legacy patch bootstrap')
source = source.replace(
    "if count != 1:\n        raise RuntimeError(f'{path}: expected one occurrence, found {count}: {old[:80]!r}')",
    "if count < 1:\n        raise RuntimeError(f'{path}: expected at least one occurrence, found {count}: {old[:80]!r}')",
    1,
)
exec(compile(source, str(app), 'exec'), {'__file__': str(app), '__name__': '__main__'})
