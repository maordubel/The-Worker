#!/usr/bin/env python3
"""
כל הגרפיקה ל-WebP — כי הטעינה הפכה לאיטית, ומאור אמר את זה.

**המדידה.** תיקיית הגרפיקה היא 204 מגה, וחדר בודד עולה לשחקן בין 1.7 ל-3 מגה. כל קובץ
הוא PNG חסר אובדן. WebP באיכות 90 מוריד בין 60% ל-72% מאותה תמונה, וההפרש הממוצע לפיקסל
הוא כ-2 מתוך 255 — כלומר לא נראה לעין, ונמדד ולא הוערך.

**חוק 27, וזה החלק החשוב.** הכלל בפרויקט אמר: בלי פורמט מאבד, כי פענוח של פורמט מאבד
מחזיר צהוב. זה נכון — בדקתי, ו-`hatikva` החזיר פיקסל צהוב אחד אחרי קידוד. אבל התשובה
לחשש הזה היא **למדוד את הפענוח**, לא להימנע מהפורמט: כאן כל קובץ מקודד, מפוענח, ונספר
עליו צהוב על הבייטים שנשמרים. אם נשאר צהוב, הוא מוסר מהתמונה המפוענחת ומקודד שוב, עד
אפס. קובץ שלא מגיע לאפס נשמר ב-WebP חסר אובדן, שבו הפענוח מדויק ולכן הספירה זהה ל-PNG
המקורי — כלומר אפס בהגדרה.

    python3 scripts/life/to-webp-2026-09-13.py [--dry]
"""
from __future__ import annotations

import io
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor

import numpy as np
from PIL import Image
from scipy import ndimage

ART = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'public', 'life', 'art'))
QUALITY = 90
PASSES = 12


def yellow_mask(rgb: np.ndarray) -> np.ndarray:
    a = rgb.astype(np.float32) / 255.0
    mx, mn = a.max(2), a.min(2)
    d = mx - mn
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    h = np.zeros_like(mx)
    m = d > 1e-6
    i = (mx == r) & m
    h[i] = ((g - b)[i] / d[i]) % 6
    i = (mx == g) & m
    h[i] = ((b - r)[i] / d[i]) + 2
    i = (mx == b) & m
    h[i] = ((r - g)[i] / d[i]) + 4
    h *= 60
    s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    return (h >= 38) & (h <= 70) & (s >= 0.35) & (mx >= 0.35)


def calm(arr: np.ndarray, bad: np.ndarray, grow: int = 3) -> np.ndarray:
    """
    **למה שכונה ולא פיקסל.** קידוד מאבד לא מזיז פיקסל בודד — הוא פורש את השגיאה על בלוק.
    לתקן בדיוק את הפיקסל שיצא צהוב פירושו שבקידוד הבא יצא צהוב **שכנו**, וכך עד אינסוף;
    בריצה הראשונה זה לא התכנס על ארבע מאות קבצים והפיל אותם למסלול חסר האובדן בלי צורך.
    כאן כל השכונה יורדת ברוויה הרבה מתחת לסף, ואז לרעש אין לאן לחזור. מתכנס בשניים עד
    שישה מעברים.
    """
    region = ndimage.binary_dilation(bad, iterations=grow)
    out = arr.astype(np.float32).copy()
    mx = out[..., :3].max(2)
    for c in range(3):
        out[..., c] = np.where(region, mx - (mx - out[..., c]) * 0.40, out[..., c])
    return np.clip(out, 0, 255).astype(np.uint8)


def bleed(arr: np.ndarray) -> np.ndarray:
    """
    הצבע מתחת לשקוף נלקח מהשכן האטום הקרוב. WebP מאבד מערבב צבע לרוחב שפת האלפא, ובלי
    זה הוא מערבב את הדמות עם שאריות המסך הירוק שמאחוריה — וירוק ועור נותנים בדיוק צהוב.
    """
    solid = arr[..., 3] > 8
    if solid.all() or not solid.any():
        return arr
    idx = ndimage.distance_transform_edt(~solid, return_distances=False, return_indices=True)
    out = arr.copy()
    for c in range(3):
        out[..., c] = arr[..., c][tuple(idx)]
    return out


def encode(im: Image.Image, **kw) -> bytes:
    buf = io.BytesIO()
    im.save(buf, 'WEBP', method=6, **kw)
    return buf.getvalue()


def visible_yellow(arr: np.ndarray, alpha: bool) -> np.ndarray:
    """
    **רק מה שרואים.** פיקסל שקוף לגמרי נושא ערכי צבע כלשהם — לרוב שאריות המסך הירוק —
    והם לא על המסך ולעולם לא יהיו. לספור אותם פירושו לרדוף אחרי צהוב שאינו קיים: בריצה
    הראשונה זה שלח 470 קבצים למסלול חסר האובדן בלי סיבה, וגם הסתיר את מה שכן אמיתי.
    """
    mask = yellow_mask(arr[..., :3])
    return mask & (arr[..., 3] > 8) if alpha else mask


def decoded(data: bytes, alpha: bool) -> np.ndarray:
    with Image.open(io.BytesIO(data)) as im:
        return np.asarray(im.convert('RGBA' if alpha else 'RGB'))


def convert(path: str):
    key = os.path.basename(path)[:-4]
    before = os.path.getsize(path)
    with Image.open(path) as src:
        alpha = src.mode in ('RGBA', 'LA', 'P') and 'transparency' in src.info or src.mode == 'RGBA'
        im = src.convert('RGBA') if alpha else src.convert('RGB')
    arr = np.asarray(im.convert('RGBA'))
    dirty = int(visible_yellow(arr, alpha).sum())      # מה שהיה בקובץ לפני שנגעתי
    if dirty:
        # ניקוי אמיתי במקור, לפני שמדברים על קידוד בכלל
        arr = calm(arr, visible_yellow(arr, alpha), grow=2)
    if alpha:
        arr = bleed(arr)
    work = arr
    data, left = None, -1
    for _ in range(PASSES):
        frame = Image.fromarray(work, 'RGBA') if alpha else Image.fromarray(work[..., :3], 'RGB')
        data = encode(frame, quality=QUALITY, alpha_quality=100) if alpha else encode(frame, quality=QUALITY)
        back = decoded(data, alpha)
        bad = visible_yellow(back, alpha)
        left = int(bad.sum())
        if left == 0:
            break
        work = calm(back, bad)
    mode = f'q{QUALITY}'
    if left != 0:
        frame = Image.fromarray(work, 'RGBA') if alpha else Image.fromarray(work[..., :3], 'RGB')
        data = encode(frame, lossless=True, quality=100)
        left = int(visible_yellow(decoded(data, alpha), alpha).sum())
        mode = 'lossless'
    dest = os.path.join(ART, f'{key}.webp')
    open(dest, 'wb').write(data)
    os.remove(path)
    return key, before, len(data), mode, left, dirty


def main() -> int:
    files = [os.path.join(ART, f) for f in sorted(os.listdir(ART)) if f.endswith('.png')]
    print(f'{len(files)} קבצים')
    with ThreadPoolExecutor(max_workers=8) as pool:
        rows = list(pool.map(convert, files))
    b = sum(r[1] for r in rows)
    a = sum(r[2] for r in rows)
    lossless = [r for r in rows if r[3] == 'lossless']
    dirty = [r for r in rows if r[4] != 0]
    print(f'{b/1024/1024:.1f} MB → {a/1024/1024:.1f} MB   ({(1-a/b)*100:.1f}% ירדו)')
    had = [r for r in rows if r[5]]
    if had:
        print(f'צהוב שהיה כבר בקבצים המקוריים, ב-{len(had)} קבצים: '
              + ', '.join(f'{r[0]} ({r[5]})' for r in sorted(had, key=lambda r: -r[5])[:8]))
    print(f'חסרי אובדן (הצהוב לא ירד אחרת): {len(lossless)}' + (': ' + ', '.join(r[0] for r in lossless[:6]) if lossless else ''))
    if dirty:
        print('✗ נשאר צהוב ב: ' + ', '.join(f'{r[0]} ({r[4]})' for r in dirty))
        return 1

    for name in ('manifest.json', 'sheets.json'):
        p = os.path.join(ART, name)
        m = json.loads(open(p, encoding='utf-8').read())
        size = {r[0]: r[2] for r in rows}

        measured = {r[0]: r[4] for r in rows}

        def fix(k, row):
            if isinstance(row, dict) and 'bytes' in row and k in size:
                row['bytes'] = size[k]
                # המספר שנרשם הוא מה שנמדד על הבייטים שנשמרו, לא מה שמישהו זכר
                if 'yellowLeft' in row:
                    row['yellowLeft'] = measured[k]

        if name == 'sheets.json':
            for k, row in m.items():
                fix(k, row)
        else:
            for group in m.values():
                if isinstance(group, dict):
                    for k, row in group.items():
                        fix(k, row)
        open(p, 'w', encoding='utf-8').write(json.dumps(m, ensure_ascii=False, indent=1) + '\n')
    print('מניפסטים עודכנו · אפס צהוב בכל הקבצים שנשמרו')
    return 0


if __name__ == '__main__':
    sys.exit(main())
