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
            raise RuntimeError(f'{patch_name}: malformed file header: {first}')
        target = m.group(2)
        path = ROOT / target
        text = path.read_text(encoding='utf-8')
        hunks = re.split(r'^@@.*$', section, flags=re.M)[1:]
        if not hunks:
            raise RuntimeError(f'{patch_name}: no context hunks for {target}')
        for index, hunk in enumerate(hunks, 1):
            old_lines: list[str] = []
            new_lines: list[str] = []
            for line in hunk.splitlines(keepends=True):
                if line.startswith('diff --git '):
                    break
                if line.startswith('--- ') or line.startswith('+++ '):
                    continue
                if line.startswith('-'):
                    old_lines.append(line[1:])
                elif line.startswith('+'):
                    new_lines.append(line[1:])
                elif line.startswith(' '):
                    old_lines.append(line[1:])
                    new_lines.append(line[1:])
                elif not line.strip():
                    old_lines.append(line)
                    new_lines.append(line)
            old = ''.join(old_lines)
            new = ''.join(new_lines)
            if not old:
                raise RuntimeError(f'{patch_name}:{target}: empty old hunk {index}')
            count = text.count(old)
            if count < 1:
                preview = old[:160].replace('\n', '\\n')
                raise RuntimeError(f'{patch_name}:{target}: hunk {index} missing: {preview}')
            # Context patches are applied in authored order. A repeated old fragment is
            # legitimate when two adjacent branches start from the same sentence; after
            # the first replacement, the next hunk reaches the next occurrence.
            text = text.replace(old, new, 1)
        path.write_text(text, encoding='utf-8')
        print(f'applied {patch_name} -> {target}')


for patch in [
    '01-a1-directors-cut.patch',
    '02-a2-a7-flow-redesign.patch',
    '03-a8-1986-start-continuity.patch',
    '04-childhood-life-path-fairness.patch',
]:
    apply_context_patch(patch)

app = ROOT / 'scripts' / 'rc' / 'apply-1983-2000-rc.py'
source = app.read_text(encoding='utf-8')
source, count = re.subn(
    r"# Prepared Stage A changes\.[\s\S]*?# 1991 — school cleverness",
    "# 1991 — school cleverness",
    source,
    count=1,
)
if count != 1:
    raise RuntimeError('could not remove legacy git-apply bootstrap from RC applicator')
namespace = {'__file__': str(app), '__name__': '__main__'}
exec(compile(source, str(app), 'exec'), namespace)
