"""
Prepare Maor's artwork for the app — and prove the result carries no yellow.

Rule 8 is absolute and has no exemption for artwork. Getting there took four attempts,
and the three that failed are worth recording because each failed for a different reason
and all three looked like they had worked:

  1. **De-yellow, save JPEG.** The file scanned clean before saving and dirty after.
     JPEG's default 4:2:0 chroma subsampling averages colour over 2×2 blocks, and the
     average of two colours just outside the yellow band lands inside it.
  2. **De-yellow, save JPEG at 4:4:4.** Still dirty. With chroma at full resolution the
     remaining culprit is DCT ringing at hard edges, which invents colours that are in
     neither neighbour. A painting that scanned 0 came back at 25.
  3. **De-yellow the video frames, encode h.264.** Cleaned frames scanned 0; the encoded
     file carried 1,430. Marking the pixels showed a one-pixel horizontal seam where the
     pitch green meets the brown surround — 4:2:0 again, generated at DECODE time.
     Softening the source edge first did not help, because the chroma plane is half
     resolution no matter what the source looks like.

What works is removing the codec from the argument. A **palette PNG** is lossless and its
colour set is finite and explicit, so the check becomes a proof rather than a sample: if
no entry in the palette is yellow, no pixel in the file can be. Quantise first, rewrite
the palette, save.

This is the same class of bug as the badge coming back yellow after Next re-encoded it to
WebP — and the same shape of fix.

    python3 scripts/brand/art.py
"""
import os
from pathlib import Path

from PIL import Image

from deyellow import hue_of, rotate  # noqa: E402  (same directory)

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "brand" / "source" / "art"
OUT = ROOT / "public" / "art"

# wider than lib/isYellow.ts, because quantisation moves a colour a little
PALETTE_BAND = (33.0, 82.0)
PALETTE_SAT = 0.18
PALETTE_VAL = 0.16

JOBS = [
    # (source, output, max width, palette size, crop box or None)
    ("art-celebration.png", "celebration.png", 1200, 180, None),
    ("art-number7.png", "number-seven.png", 1000, 160, None),
    ("art-dribble.png", "dribble.png", 1000, 160, None),
    ("crest-worker-red.png", "crest-worker-figure.png", 600, 64, "trim"),
]


def trim_white(image: Image.Image) -> Image.Image:
    """
    Crop the uniform surround off a crest sheet, leaving a small even margin.

    Both near-white and near-black count as surround: the crest arrived as a video
    thumbnail, so it carries letterbox bars as well as a white field, and trimming only
    the white left the bars — and therefore the whole frame.
    """
    rgb = image.convert("RGB")
    pixels = rgb.load()
    width, height = rgb.size
    left, top, right, bottom = width, height, 0, 0
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[x, y]
            if r > 244 and g > 244 and b > 244:
                continue
            if r < 18 and g < 18 and b < 18:
                continue
            left, top = min(left, x), min(top, y)
            right, bottom = max(right, x), max(bottom, y)
    if right <= left or bottom <= top:
        return image
    pad = max(6, (right - left) // 40)
    return image.crop(
        (
            max(0, left - pad),
            max(0, top - pad),
            min(width, right + pad + 1),
            min(height, bottom + pad + 1),
        )
    )


def prepare(source: Path, target: Path, width: int, colours: int, crop: str | None) -> None:
    image = Image.open(source).convert("RGB")
    if crop == "trim":
        image = trim_white(image)
    if image.width > width:
        image = image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)

    quantised = image.quantize(
        colors=colours, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG
    )
    palette = quantised.getpalette()[: colours * 3]
    moved = 0
    for index in range(0, len(palette), 3):
        r, g, b = palette[index], palette[index + 1], palette[index + 2]
        hue, sat, val, delta = hue_of(r, g, b)
        if delta and sat >= PALETTE_SAT and val >= PALETTE_VAL:
            if PALETTE_BAND[0] <= hue <= PALETTE_BAND[1]:
                palette[index], palette[index + 1], palette[index + 2] = rotate(r, g, b)
                moved += 1
    quantised.putpalette(palette)
    target.parent.mkdir(parents=True, exist_ok=True)
    quantised.save(target, optimize=True)

    # the proof: read the palette back off the saved file
    written = Image.open(target)
    table = written.getpalette() or []
    offenders = 0
    for index in range(0, len(table), 3):
        r, g, b = table[index], table[index + 1], table[index + 2]
        hue, sat, val, delta = hue_of(r, g, b)
        if delta and sat >= 0.35 and val >= 0.35 and 38.0 <= hue <= 70.0:
            offenders += 1
    size = os.path.getsize(target) // 1024
    print(
        f"{target.name:28} {written.size[0]}×{written.size[1]}  {size:>4} KB  "
        f"palette moved {moved:>3}  yellow entries {offenders}"
    )
    if offenders:
        raise SystemExit(f"{target} still carries {offenders} yellow palette entries")


def main() -> int:
    for name, out, width, colours, crop in JOBS:
        source = SOURCE / name
        if not source.exists():
            print(f"skip {name} — not in brand/source/art")
            continue
        prepare(source, OUT / out, width, colours, crop)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
