"""
Process gate 11's black paste-up wall texture — the wall behind הקיר השחור (delta 87).

Source: `brand/source/art/gate11-wall-paste-up.png` (1254x1254), the owner's own copy of
`extras/gate11__wall-paste-up.png` from THE-WORKER-GATES-ART-2026-09 — generated 21.9.2026,
supplied by the owner (Maor). Output: `public/art/wall-paste-up.png`, 512x512, tileable,
palette PNG (rule 27 — lossless, so the yellow check is a proof over the palette rather
than a sample of the pixels).

Gate 11 carries no vermilion at all (rule 9/CLAUDE.md §11) — the source is monochrome
(near-black charcoal, dark greys, a little pale grey-cream) and this script never adds
colour, only rotates any yellow hue it finds (the same de-yellow pass every incoming
asset gets, rule 8) and quantises to a finite palette so `strict-yellow-offenders` is a
COUNT over the table, not a sample of the pixels.

The source is not a seamless tile as supplied (it scans this checklist against 0 yellow,
but its own left/right and top/bottom edges do not match). `make_tileable` cyclic-shifts
the image by half its size (`ImageChops.offset` — true wraparound, so nothing outside the
frame is invented) and feather-blends a band across the two seams that move lands on: the
CENTER of the result, not its edges. The edges of the output are then interior pixels of
the source, away from any cut, which is what makes them repeat.

Not yet folded into `scripts/brand/art.py`'s own JOBS list — this script is gate 11's own
(delta 87, cluster PLAY), kept separate so it does not touch a file outside that cluster's
own gates. A future delta can move the job into art.py's table once it is reviewed.

    python3 scripts/brand/gate11-wall.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from deyellow import hue_of, rotate  # noqa: E402

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "brand" / "source" / "art" / "gate11-wall-paste-up.png"
OUT = ROOT / "public" / "art" / "wall-paste-up.png"

# the wider de-yellow band (scripts/brand/deyellow.py), used while editing pixels
BAND = (33.0, 82.0)
SAT_FLOOR = 0.18
VAL_FLOOR = 0.16

TARGET = 512
FEATHER = 48
PALETTE_SIZE = 96


def make_tileable(image: Image.Image) -> Image.Image:
    w, h = image.size
    shifted = ImageChops.offset(image, w // 2, h // 2)

    band = shifted.crop((w // 2 - FEATHER, 0, w // 2 + FEATHER, h))
    mirror_band = (
        shifted.transpose(Image.FLIP_LEFT_RIGHT)
        .crop((w // 2 - FEATHER, 0, w // 2 + FEATHER, h))
        .transpose(Image.FLIP_LEFT_RIGHT)
    )
    shifted.paste(Image.blend(band, mirror_band, 0.5), (w // 2 - FEATHER, 0))

    band2 = shifted.crop((0, h // 2 - FEATHER, w, h // 2 + FEATHER))
    mirror_band2 = (
        shifted.transpose(Image.FLIP_TOP_BOTTOM)
        .crop((0, h // 2 - FEATHER, w, h // 2 + FEATHER))
        .transpose(Image.FLIP_TOP_BOTTOM)
    )
    shifted.paste(Image.blend(band2, mirror_band2, 0.5), (0, h // 2 - FEATHER))
    return shifted


def deyellow_pixels(image: Image.Image) -> tuple[Image.Image, int]:
    px = image.load()
    w, h = image.size
    moved = 0
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            hue, sat, val, delta = hue_of(r, g, b)
            if delta and sat >= SAT_FLOOR and val >= VAL_FLOOR and BAND[0] <= hue <= BAND[1]:
                px[x, y] = rotate(r, g, b)
                moved += 1
    return image, moved


def is_yellow_strict(r: int, g: int, b: int) -> bool:
    """lib/isYellow.ts, exactly: hue 38-70, sat>=0.35, val>=0.35 — the check screenshots use."""
    hue, sat, val, delta = hue_of(r, g, b)
    return bool(delta) and sat >= 0.35 and val >= 0.35 and 38.0 <= hue <= 70.0


def main() -> None:
    image = Image.open(SRC).convert("RGB")
    image = image.resize((TARGET, TARGET), Image.LANCZOS)
    image = make_tileable(image)
    image, moved_pre = deyellow_pixels(image)

    quantised = image.quantize(colors=PALETTE_SIZE, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG)
    palette = quantised.getpalette()[: PALETTE_SIZE * 3]
    moved_pal = 0
    for index in range(0, len(palette), 3):
        r, g, b = palette[index], palette[index + 1], palette[index + 2]
        hue, sat, val, delta = hue_of(r, g, b)
        if delta and sat >= SAT_FLOOR and val >= VAL_FLOOR and BAND[0] <= hue <= BAND[1]:
            palette[index], palette[index + 1], palette[index + 2] = rotate(r, g, b)
            moved_pal += 1
    quantised.putpalette(palette)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    quantised.save(OUT, optimize=True)

    written = Image.open(OUT)
    table = written.getpalette() or []
    offenders = sum(
        1
        for index in range(0, len(table), 3)
        if is_yellow_strict(table[index], table[index + 1], table[index + 2])
    )
    print(
        f"size={written.size} pre-quantise-rotated={moved_pre} palette-rotated={moved_pal} "
        f"palette-entries={len(table) // 3} strict-yellow-offenders={offenders}"
    )
    if offenders:
        raise SystemExit(f"FAIL: {offenders} yellow palette entries remain")


if __name__ == "__main__":
    main()
