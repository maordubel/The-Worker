import json
from pathlib import Path

current_path = Path('messages/he.json')
delta_path = Path('/tmp/delta76/messages/he.json')

current = json.loads(current_path.read_text())
delta = json.loads(delta_path.read_text())

# Preserve all current/Delta75 keys, then apply the exact Delta76 values/additions.
current.update(delta)
# Gate 9 shipped after the patch was authored and must stay public.
current['gate.9'] = 'רויאל ראמבל'

current_path.write_text(json.dumps(current, ensure_ascii=False, indent=2) + '\n')
