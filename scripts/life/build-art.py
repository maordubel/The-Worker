#!/usr/bin/env python3
"""
בניית הנכסים — the approved concept boards become the game's art.

  python3 scripts/life/build-art.py

Reads `scripts/life/art-manifest.json` (board, crop box, upscale factor per asset) and
writes `public/life/art/*.png` plus a manifest the runtime loads. Three passes, and each
is a rule this repo already has:

1. **Upscale + unsharp.** The boards pack twenty panels into 1536px, so a room is ~150px
   at source. LANCZOS with a light unsharp keeps painterly art readable. It invents no
   detail and does not pretend to.
2. **De-yellow.** Rule 8 is absolute and rule 27 says artwork gets no exemption. 1980
   Jaffa is warm and dusty, so a lot of sunlit pixels land in the yellow hue band. They
   are ROTATED to hue 33 at the same saturation and value — the treatment
   `scripts/brand/badge.py` gives the badge. The picture reads the same; the scanner
   reads zero.
3. **Palette PNG.** Lossy formats put yellow back at decode (rule 27). A palette PNG is
   lossless over a finite colour table, which turns "no yellow" from a sample into a
   proof — and it is what keeps the whole art folder under a megabyte and a half.

The source boards are Maor's own concept art and live outside the repo; this script is
the record of exactly which rectangle of which board became which asset.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageFilter  # noqa: E402
from collections import deque  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ROOT, 'public/life/art')
BOARDS = os.environ.get('WORKER_BOARDS', '/root/.claude/uploads/13cbdfeb-c68d-5459-8ba2-6a01b0061153')

SRC = {
    'assets1': '5547141b-image.png',
    'venues': '647e0cfd-image.png',
    'stageA1': '688d72a1-image.png',
    'stageAenv': 'b176780f-image.png',
    'bloom': '2c06559c-image.png',
    'stageA2': '441a30fa-image.png',
    # 2.9.2026 — the first purpose-drawn room, delivered as a flat painting plus the
    # separated foreground furniture that makes the child walk BEHIND something.
    'livingRoom': '6864c990-image.png',
    'livingFore': '2f74f424-image.png',
}

# The scanner's band is hue 38–70 at saturation and value 0.35 (`lib/isYellow.ts`). The
# BUILD band is deliberately wider on every side, because a pixel that sits just outside
# the line in a file can land inside it on screen: a vignette darkens it, an added
# particle brightens it, and the browser's own scaling blends it with its neighbour. The
# margin is what makes "no yellow in the artwork" survive being composited.
HUE_MIN, HUE_MAX, SAFE_HUE = 30.0, 80.0, 26.0
SAT_MIN, VAL_MIN = 0.18, 0.18

_cache = {}


def board(key):
    if key not in _cache:
        _cache[key] = Image.open(os.path.join(BOARDS, SRC[key])).convert('RGB')
    return _cache[key]


def rgb_to_hsv(r, g, b):
    mx, mn = max(r, g, b), min(r, g, b)
    d = mx - mn
    if d == 0:
        h = 0.0
    elif mx == r:
        h = 60 * (((g - b) / d) % 6)
    elif mx == g:
        h = 60 * ((b - r) / d + 2)
    else:
        h = 60 * ((r - g) / d + 4)
    return h, (0.0 if mx == 0 else d / mx), mx / 255.0


def hsv_to_rgb(h, s, v):
    c = v * s
    x = c * (1 - abs((h / 60) % 2 - 1))
    m = v - c
    if h < 60:
        r, g, b = c, x, 0
    elif h < 120:
        r, g, b = x, c, 0
    elif h < 180:
        r, g, b = 0, c, x
    elif h < 240:
        r, g, b = 0, x, c
    elif h < 300:
        r, g, b = x, 0, c
    else:
        r, g, b = c, 0, x
    return (int(round((r + m) * 255)), int(round((g + m) * 255)), int(round((b + m) * 255)))


_LUT = {}


def deyellow(im):
    rgb = im.convert('RGB')
    px = rgb.load()
    w, h = rgb.size
    moved = 0
    for y in range(h):
        for x in range(w):
            p = px[x, y]
            q = _LUT.get(p)
            if q is None:
                hh, s, v = rgb_to_hsv(*p)
                q = hsv_to_rgb(SAFE_HUE, min(0.86, s * 0.9), v) if (
                    s >= SAT_MIN and v >= VAL_MIN and HUE_MIN <= hh <= HUE_MAX
                ) else p
                _LUT[p] = q
            if q != p:
                px[x, y] = q
                moved += 1
    if im.mode == 'RGBA':
        rgb = rgb.convert('RGBA')
        rgb.putalpha(im.split()[-1])
    return rgb, moved


def count_yellow(im):
    rgba = im.convert('RGBA')
    px = rgba.load()
    w, h = rgba.size
    n = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            hh, s, v = rgb_to_hsv(r, g, b)
            if s >= SAT_MIN and v >= VAL_MIN and HUE_MIN <= hh <= HUE_MAX:
                n += 1
    return n


def cutout(im, step_tol=8, wall=16, feather=0.9):
    """
    Region-grow the board's cream background from the border, fenced by the drawing's
    own edges.

    A flat colour key eats the figure's shadows; an unfenced region grow walks straight
    through dark clothing, because a black tracksuit is within tolerance of a dark corner
    of the board. The edge map is the fence: the grow follows the near-flat background
    and stops at the ink line the illustration already has.
    """
    im = im.convert('RGB')
    w, h = im.size
    px = im.load()
    ed = im.convert('L').filter(ImageFilter.GaussianBlur(0.6)).filter(ImageFilter.FIND_EDGES).load()
    alpha = Image.new('L', (w, h), 255)
    ap = alpha.load()
    seen = bytearray(w * h)
    q = deque()

    def push(x, y):
        i = y * w + x
        if seen[i]:
            return
        seen[i] = 1
        ap[x, y] = 0
        q.append((x, y, px[x, y]))

    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)

    while q:
        x, y, c = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if nx < 0 or ny < 0 or nx >= w or ny >= h:
                continue
            i = ny * w + nx
            if seen[i] or ed[nx, ny] > wall:
                continue
            n = px[nx, ny]
            if abs(n[0] - c[0]) + abs(n[1] - c[1]) + abs(n[2] - c[2]) > step_tol:
                continue
            seen[i] = 1
            ap[nx, ny] = 0
            q.append((nx, ny, n))

    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(feather))
    out = im.convert('RGBA')
    out.putalpha(alpha)
    return out


def defringe(im, passes=2):
    """
    Kill the cream halo.

    A cut-out's edge pixels are partly transparent but still carry the colour of the
    board they were lifted off, so a dark child on a cream board arrives wearing a bright
    outline — the single loudest tell that a sprite was keyed rather than drawn. Each pass
    repaints every partly-transparent pixel with the average of its OPAQUE neighbours, so
    the edge fades out in the figure's own colour instead of the background's.
    """
    im = im.convert('RGBA')
    px = im.load()
    w, h = im.size
    for _ in range(passes):
        changed = []
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if a == 0 or a > 250:
                    continue
                sr = sg = sb = n = 0
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < w and 0 <= ny < h:
                            rr, gg, bb, aa = px[nx, ny]
                            if aa > 250:
                                sr += rr
                                sg += gg
                                sb += bb
                                n += 1
                if n:
                    changed.append((x, y, (sr // n, sg // n, sb // n, a)))
        for x, y, value in changed:
            px[x, y] = value
    return im


def trim(im, pad=1):
    bbox = im.split()[-1].getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    return im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))


def upscale(im, factor):
    out = im.resize((int(im.width * factor), int(im.height * factor)), Image.LANCZOS)
    return out.filter(ImageFilter.UnsharpMask(radius=2.0, percent=75, threshold=3))


def main():
    with open(os.path.join(HERE, 'art-manifest.json'), encoding='utf8') as fh:
        spec = json.load(fh)
    os.makedirs(OUT, exist_ok=True)

    report = {'backdrops': {}, 'figures': {}, 'props': {}, 'portraits': {}, 'layers': {}}
    total_yellow = 0
    total_bytes = 0

    for group, transparent in (
        ('backdrops', False),
        ('figures', True),
        ('props', True),
        # Portraits keep the board's cream ground on purpose: they are printed plates in
        # the dialogue box, not cut-outs, and keying a pale face off a pale background
        # eats the face.
        ('portraits', False),
        # Already delivered with an alpha channel: no keying, only trim and de-yellow.
        ('layers', 'alpha'),
    ):
        for key, (src, box, factor) in spec.get(group, {}).items():
            im = board(src).crop(tuple(box)) if transparent != 'alpha' else Image.open(
                os.path.join(BOARDS, SRC[src])
            ).convert('RGBA').crop(tuple(box))
            im = upscale(im, factor)
            if transparent is True:
                im = trim(defringe(cutout(im)))
            elif transparent == 'alpha':
                im = trim(im)
            if transparent:
                src2 = im.convert('RGBA')
                out = src2.convert('RGB').quantize(colors=200, method=Image.FASTOCTREE).convert('RGBA')
                out.putalpha(src2.split()[-1])
            else:
                out = im.convert('RGB').quantize(colors=160, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG)
                out = out.convert('RGB')

            # De-yellow LAST, after quantisation: an octree palette averages colours and
            # can invent a hue that was not in the de-yellowed image. Then measure the
            # FILE, not an intermediate — a zero that the saved bytes do not honour is
            # worse than no check at all.
            out, moved = deyellow(out)
            path = os.path.join(OUT, f'{key}.png')
            out.save(path, optimize=True)
            left = count_yellow(Image.open(path))
            total_yellow += left
            size = os.path.getsize(path)
            total_bytes += size
            report[group][key] = {
                'w': out.width, 'h': out.height, 'bytes': size,
                'source': src, 'box': box, 'deyellowed': moved, 'yellowLeft': left,
            }
            print(f'{key:16s} {out.width:4d}x{out.height:<4d} {size/1024:7.1f}KB  de-yellowed {moved:6d}  left {left}')

    with open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf8') as fh:
        json.dump(report, fh, ensure_ascii=False, indent=1)

    print(f'\n{total_bytes/1024/1024:.2f} MB total · yellow pixels remaining: {total_yellow}')
    if total_yellow:
        print('FAIL — rule 8')
        sys.exit(1)


if __name__ == '__main__':
    main()
