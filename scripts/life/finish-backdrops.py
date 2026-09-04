#!/usr/bin/env python3
"""
גימור הרקעים — the pass every painted room goes through before a phone is allowed to load it.

Two jobs, one script, run after ANY backdrop lands in `public/life/art/`:

1. **Shrink and quantise.** The September deliveries arrived as 2048×1152 true-colour PNGs
   at ~3 MB each — six of them, 18 MB, for a game whose room budget is 3.6 MB
   (`tests/life.test.ts`, "keeps any single room inside a sane download"). They also
   skipped `build-art.py`, so the manifest still described the files they replaced and
   the yellow scan never saw them. Here each backdrop wider than 1600px is brought down to
   1600, quantised to the same 160-colour dithered palette `build-art.py` uses, de-yellowed
   with the same function, measured from the saved FILE, and its manifest row rewritten.

2. **Extend for portrait.** A 16:9 painting on a 9:19.5 phone can either fill the glass —
   and show a quarter of the room with the child a third of the screen tall — or keep its
   width and leave black bands. Very Little Nightmares, the bar Maor set, does neither:
   its rooms are TALL. Ours are not, so for every backdrop this writes two extension
   strips, `<key>--sky.png` above and `<key>--ground.png` below: the painting's own top
   and bottom rows stretched, blurred and faded toward the ink, so the camera can show a
   taller slice of the world than the painting has and nothing reads as a bar. Sky above
   a street is sky; pavement below it is pavement. The extension is as tall as it needs
   to be to make the picture roughly square, capped at 35% of the painting's height so no
   room is mostly smear. All coordinates in every scene stay fractions of the ORIGINAL
   painting — the strips hang off it at y < 0 and y > H, and nothing else moves.

    python3 scripts/life/finish-backdrops.py            # every backdrop
    python3 scripts/life/finish-backdrops.py street     # just these keys
"""

import json
import os
import sys

from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))


def _build_art():
    """`build-art.py` has a hyphen in its name; load it as a module for its two functions."""
    import importlib.util

    spec = importlib.util.spec_from_file_location('build_art', os.path.join(HERE, 'build-art.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


_ba = _build_art()
deyellow, count_yellow = _ba.deyellow, _ba.count_yellow

ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
ART = os.path.join(ROOT, 'public', 'life', 'art')
MANIFEST = os.path.join(ART, 'manifest.json')

MAX_WIDTH = 1600
COLOURS = 160
# how tall the extension may grow, as a fraction of the painting's height
EXT_CAP = 0.35
# the far edge of each strip fades to this — the runtime palette's `ink`
INK = (0x15, 0x12, 0x0E)


# Where a painting has GRASS in the yellow band, desaturating it makes dirt and rotating it
# to the badge's brown makes rust — both wrong for a football pitch. Below this fraction of
# the height (the pitch and the near terrace; the far stand's beige concrete is above it)
# every yellow-band pixel is turned GREEN instead, before the general treatment runs.
GREEN_BELOW = {'stand': 0.40}
GREEN_HUE = 84.0


def green_grass(im, from_y):
    import colorsys

    px = im.load()
    w, h = im.size
    lut = {}
    for y in range(int(from_y * h), h):
        for x in range(w):
            p = px[x, y]
            q = lut.get(p)
            if q is None:
                hh, s, v = colorsys.rgb_to_hsv(p[0] / 255, p[1] / 255, p[2] / 255)
                if 36 <= hh * 360 <= 74 and s >= 0.28 and v >= 0.28:
                    r, g, b = colorsys.hsv_to_rgb(GREEN_HUE / 360, min(0.8, s * 0.85), v * 0.97)
                    q = (int(r * 255), int(g * 255), int(b * 255))
                else:
                    q = p
                lut[p] = q
            if q != p:
                px[x, y] = q
    return im


def quantised(im, colours):
    """
    A PALETTE file, de-yellowed through its palette.

    The first version of this pass quantised, converted back to RGB to run `deyellow`
    pixel by pixel, and saved THAT — a true-colour PNG of a 160-colour image, two and a
    half times the size it needed to be. The palette is the image: treating its entries is
    treating every pixel, and the file stays a palette file.
    """
    q = im.quantize(colors=colours, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG)
    palette = q.getpalette()
    colours = len(palette) // 3
    swatch = Image.new('RGB', (colours, 1))
    swatch.putdata([tuple(palette[i * 3 : i * 3 + 3]) for i in range(colours)])
    treated, moved_entries = deyellow(swatch)
    flat = []
    for r, g, b in list(treated.getdata()):
        flat.extend((r, g, b))
    q.putpalette(flat)
    # how many PIXELS changed, for the manifest — the same number the old pass reported
    if moved_entries:
        before = [tuple(palette[i * 3 : i * 3 + 3]) for i in range(colours)]
        after = list(treated.getdata())
        changed = {i for i in range(colours) if before[i] != after[i]}
        moved = sum(1 for index in q.getdata() if index in changed)
    else:
        moved = 0
    return q, moved


def extension_height(w, h):
    """Enough to make the picture about square, never more than the cap."""
    want = (w - h) / 2
    return int(max(0, min(want, h * EXT_CAP)))


def strip(source, height, fade_to_top):
    """One extension strip: the edge band stretched, blurred, and faded into the ink."""
    w = source.width
    stretched = source.resize((w, height), Image.BICUBIC).filter(ImageFilter.GaussianBlur(18))
    grad = Image.linear_gradient('L').resize((w, height))
    if fade_to_top:
        grad = grad.transpose(Image.FLIP_TOP_BOTTOM)
    # The fade is fast then slow: the strip keeps the painting's colour for its first
    # stretch, so sky stays sky and pavement stays pavement right where they meet the
    # picture, and is nearly ink by the far edge. A linear fade left a wide band of
    # mid-grey smear on every phone; this reads instead as the room standing in the dark,
    # which is exactly how Very Little Nightmares lights its dioramas. Never fully black,
    # so a camera resting on it still shows a surface rather than a void.
    mask = grad.point(lambda v: int(255 * 0.92 * (v / 255) ** 0.55))
    ink = Image.new('RGB', (w, height), INK)
    return Image.composite(ink, stretched, mask)


def finish(key, manifest):
    path = os.path.join(ART, f'{key}.png')
    im = Image.open(path).convert('RGB')
    w, h = im.size
    if w > MAX_WIDTH:
        im = im.resize((MAX_WIDTH, round(h * MAX_WIDTH / w)), Image.LANCZOS)
        w, h = im.size
    if key in GREEN_BELOW:
        im = green_grass(im, GREEN_BELOW[key])
    out, moved = quantised(im, COLOURS)
    out.save(path, optimize=True)
    left = count_yellow(Image.open(path))
    row = manifest['backdrops'].get(key, {})
    row.update({'w': w, 'h': h, 'bytes': os.path.getsize(path), 'deyellowed': moved, 'yellowLeft': left})
    row.setdefault('source', 'delivery')
    row.setdefault('box', [0, 0, w, h])
    manifest['backdrops'][key] = row
    print(f'{key:14s} {w:4d}x{h:<4d} {row["bytes"]/1024:7.1f}KB  de-yellowed {moved:6d}  left {left}')

    ext = extension_height(w, h)
    manifest.setdefault('extensions', {})
    rgb = out.convert('RGB')
    for suffix, band, to_top in (('sky', rgb.crop((0, 0, w, max(4, h // 60))), True),
                                 ('ground', rgb.crop((0, h - max(4, h // 50), w, h)), False)):
        name = f'{key}--{suffix}'
        epath = os.path.join(ART, f'{name}.png')
        if ext <= 0:
            if os.path.exists(epath):
                os.remove(epath)
            manifest['extensions'].pop(name, None)
            continue
        s, smoved = quantised(strip(band, ext, to_top), 64)
        s.save(epath, optimize=True)
        sleft = count_yellow(Image.open(epath))
        manifest['extensions'][name] = {
            'w': w, 'h': ext, 'bytes': os.path.getsize(epath), 'source': key,
            'box': [0, 0, w, ext], 'deyellowed': smoved, 'yellowLeft': sleft,
        }
        print(f'  {name:20s} {w:4d}x{ext:<4d} {os.path.getsize(epath)/1024:6.1f}KB  left {sleft}')


def main():
    with open(MANIFEST, encoding='utf8') as fh:
        manifest = json.load(fh)
    keys = sys.argv[1:] or list(manifest['backdrops'].keys())
    for key in keys:
        finish(key, manifest)
    with open(MANIFEST, 'w', encoding='utf8') as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=1)
    bad = [k for g in manifest.values() for k, r in g.items() if r.get('yellowLeft')]
    if bad:
        print('FAIL — rule 8:', bad)
        sys.exit(1)


if __name__ == '__main__':
    main()
