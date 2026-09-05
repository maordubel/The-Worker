#!/usr/bin/env python3
"""
בדיקת כיוון — does every profile in the folder still face right?

    python3 scripts/life/facing-check.py

The convention (`WorldScene.ART_FACES = 1`) was wrong for a day and the game walked
backwards for that day, so it is no longer left to memory. For every `-side`, `-walk`,
`-march` and `-w1…w8` file this measures the head: skin is at the front of a profile and
hair is at the back, so if the skin centroid sits to the RIGHT of the hair centroid the
figure faces right. Exits non-zero on a disagreement, and prints the file so a new sheet
is mirrored on ingest rather than at runtime.

It is a heuristic and it says so: three-quarter poses and backs of heads are reported as
UNSURE rather than as failures, because there the measurement has nothing to measure.
"""
import glob
import os
import re
import sys

import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
ART = os.path.join(ROOT, 'public/life/art')
PROFILE = re.compile(r'-(side|walk\d*|march|w\d)\.png$')


def facing(path):
    """+ve means the face is forward of the middle of the head, i.e. the figure faces right.

    Skin against the head's own silhouette, not against hair: hair reads the same as a
    dark collar and a dark collar is not a direction. Measured over the top 14% of the
    figure — above the shoulders, where a profile is only face and hair — and checked by
    eye against twenty-four files on 5.9.2026 before it was allowed to fail a build.
    """
    a = np.array(Image.open(path).convert('RGBA'))
    alpha = a[..., 3] > 40
    if alpha.sum() < 400:
        return None
    ys, xs = np.where(alpha)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    top = a[y0:y0 + max(6, int((y1 - y0 + 1) * 0.14)), x0:x1 + 1]
    m = top[..., 3] > 40
    if m.sum() < 80:
        return None
    r, g, b = (top[..., i].astype(int) for i in range(3))
    v = np.maximum(np.maximum(r, g), b)
    skin = m & (v > 95) & (r > g) & (g >= b) & ((r - b) > 14) & ((r - b) < 140)
    if skin.sum() < 40:
        return None
    w = top.shape[1]
    grid = np.arange(w)[None, :].repeat(top.shape[0], 0)
    lead = grid[skin].mean() / w - grid[m].mean() / w
    if abs(lead) < 0.015:
        return None          # a front view, a back of a head, or a hood: nothing to say
    return 'right' if lead > 0 else 'left'


# The illustrated child the photographic one replaced in September. Nothing loads these,
# they face left, and mirroring dead art only makes the next audit longer.
DEAD = {f'kid-walk{i}' for i in range(1, 9)}

# `ofir90-walk` is a BACK view that was named like a side one — the delivery drew Ofir
# walking away. Nothing turns it, so it is not wrong on disk; it is only wrong in the
# name, and a rename would break the manifest for no gain. Noted here so an audit does not
# find it again.
BACKS = {'ofir90-walk'}


def main():
    wrong, unsure, ok = [], [], 0
    for path in sorted(glob.glob(os.path.join(ART, '*.png'))):
        if not PROFILE.search(os.path.basename(path)):
            continue
        who = facing(path)
        name = os.path.basename(path)[:-4]
        if name in DEAD or name in BACKS:
            continue
        if who is None:
            unsure.append(name)
        elif who == 'right':
            ok += 1
        else:
            wrong.append(name)
    print(f'{ok} face right · {len(unsure)} unsure · {len(wrong)} face LEFT')
    for name in unsure:
        print(f'  unsure  {name}')
    for name in wrong:
        print(f'  WRONG   {name}  — mirror it on ingest, not at runtime')
    return 1 if wrong else 0


if __name__ == '__main__':
    sys.exit(main())
