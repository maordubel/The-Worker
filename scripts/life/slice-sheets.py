#!/usr/bin/env python3
"""
פריסת גיליונות — a character sheet becomes numbered frames, automatically.

The boards arrive as one image with a row of poses on a flat ground: green screen for
the newer sheets, near-black for the older ones. Cutting them by hand means measuring
pixels off a screenshot and being wrong by three, so this measures them instead: key the
ground, find the columns that contain anything, and split wherever there is a gap wide
enough to be between two figures rather than between two legs.

Output goes straight into `public/life/art/` with the same de-yellow and palette-PNG
treatment every other asset gets — see `build-art.py`, whose helpers this imports.
"""
import importlib.util
import json
import os
import sys

from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ROOT, 'public/life/art')
BOARDS = os.environ.get('WORKER_BOARDS', '/root/.claude/uploads/13cbdfeb-c68d-5459-8ba2-6a01b0061153')

spec = importlib.util.spec_from_file_location('ba', os.path.join(HERE, 'build-art.py'))
ba = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ba)


def key_green(im):
    """Chroma key. The sheets use a saturated screen green nothing in 1980 Jaffa wears."""
    im = im.convert('RGB')
    px = im.load()
    w, h = im.size
    alpha = Image.new('L', (w, h), 255)
    ap = alpha.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if g > 90 and g > r * 1.35 and g > b * 1.35:
                ap[x, y] = 0
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert('RGBA')
    out.putalpha(alpha)
    return out


def key_dark(im, limit=70):
    """The older sheets sit on a flat near-black card."""
    im = im.convert('RGB')
    px = im.load()
    w, h = im.size
    alpha = Image.new('L', (w, h), 255)
    ap = alpha.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if max(r, g, b) < limit and max(r, g, b) - min(r, g, b) < 26:
                ap[x, y] = 0
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert('RGBA')
    out.putalpha(alpha)
    return out


def columns(im, floor=6):
    """Which columns hold anything at all."""
    alpha = im.split()[-1]
    w, h = im.size
    px = alpha.load()
    filled = []
    for x in range(w):
        n = 0
        for y in range(0, h, 2):
            if px[x, y] > 40:
                n += 1
                if n >= floor:
                    break
        filled.append(n >= floor)
    return filled


def slice_row(im, gap=10, min_width=18):
    """Split a keyed row into figures on the empty columns between them."""
    filled = columns(im)
    runs = []
    start = None
    blank = 0
    for x, on in enumerate(filled):
        if on:
            if start is None:
                start = x
            blank = 0
        elif start is not None:
            blank += 1
            if blank >= gap:
                if x - blank - start >= min_width:
                    runs.append((start, x - blank))
                start = None
                blank = 0
    if start is not None and len(filled) - start >= min_width:
        runs.append((start, len(filled)))
    return runs


def emit(im, key, scale):
    im = ba.trim(ba.defringe(im))
    if scale != 1:
        im = ba.upscale(im, scale)
    out = im.convert('RGBA')
    flat = out.convert('RGB').quantize(colors=200, method=Image.FASTOCTREE).convert('RGBA')
    flat.putalpha(out.split()[-1])
    # De-yellow LAST, on the quantised pixels, and measure the file that is written.
    flat, moved = ba.deyellow(flat)
    path = os.path.join(OUT, f'{key}.png')
    flat.save(path, optimize=True)
    left = ba.count_yellow(Image.open(path))
    print(f'{key:16s} {flat.width:4d}x{flat.height:<4d} {os.path.getsize(path)/1024:7.1f}KB  moved {moved:5d}  yellow {left}')
    return {'w': flat.width, 'h': flat.height, 'bytes': os.path.getsize(path), 'yellowLeft': left}


JOBS = [
    # (board file, band (x0,y0,x1,y1), keyer, output names in order, scale)
    #
    # Only the sheets that key CLEANLY are sliced here. Ofir, Amit and Efi live on an
    # older card whose background is nearly the same value as Ofir's black tracksuit —
    # keying it ate his jacket and merged him with his neighbour — so they keep coming
    # from the painted Stage A cast row via `build-art.py`. A sheet that does not key is
    # not a sheet to force.
    ('d8a1a9b7-image.png', (290, 40, 1120, 430), 'green',
     ['kid', 'kid-3q', 'kid-side', 'kid-side-b', 'kid-back', 'kid-back-b'], 1.6),
    ('d8a1a9b7-image.png', (95, 710, 1360, 975), 'green',
     [f'kid-walk{i}' for i in range(1, 9)], 1.6),
    # y starts below the card's own "רחל / אמא" heading — a label inside a sprite is the
    # concept board leaking into the game.
    ('cc456e2f-image.png', (10, 82, 380, 300), 'green',
     ['rachel-tray', 'rachel', 'rachel-smoke'], 3.0),
]


def main():
    report = {}
    for board, band, mode, names, scale in JOBS:
        im = Image.open(os.path.join(BOARDS, board)).convert('RGB').crop(band)
        keyed = key_green(im) if mode == 'green' else key_dark(im)
        runs = slice_row(keyed)
        print(f'\n{board} {band} → {len(runs)} figure(s) for {len(names)} name(s)')
        for i, name in enumerate(names):
            if i >= len(runs):
                print(f'  !! {name}: no figure at slot {i}')
                continue
            x0, x1 = runs[i]
            report[name] = emit(keyed.crop((x0, 0, x1, keyed.height)), name, scale)
    with open(os.path.join(OUT, 'sheets.json'), 'w', encoding='utf8') as fh:
        json.dump(report, fh, ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
