"""
כמה רחוק כל דבר — פרופיל העומק של פנורמה, נמדד מהתמונה עצמה.

  python3 scripts/life/depth-profile-2026-09-07.py            # מדידה + תמונות בקרה
  python3 scripts/life/depth-profile-2026-09-07.py --write    # וגם כתיבה למניפסט

**למה זה קיים.** גליל ברדיוס אחד הוא ההנחה שכל מה שרואים נמצא באותו מרחק. זה נכון בנקודת
הצילום ורק בה, ולכן אפשר היה לזוז ממנה שני מטר וחצי ולא יותר: מעבר לזה החזית הקרובה
והחזית הרחוקה זזות באותו קצב, והעין קוראת את זה מיד כ"התמונה מתקרבת" ולא כ"אני הולך".
מאור, 7.9.2026: *"הוא סתם עומד במקום בפועל, טווח תנועה מאוד קטן."*

**מה שנמדד.** בהטלה גלילית, השורה שבה בניין פוגש את הרצפה אומרת בדיוק כמה הוא רחוק:

    r(θ) = eye · (aspect / hFov) / (py_base(θ) − horizon)

כלומר כל מה שדרוש הוא **קו המגע** — היכן, בכל עמודה, נגמרת הרצפה ומתחיל דבר שעומד עליה.
זה לא ניחוש ולא הערכה: זה קריאה של גיאומטריה שכבר בתמונה.

**איך הקו נמצא.** תכנות דינמי על פני העמודות: מסלול רציף אחד, מלמעלה למטה מוגבל לאזור
שמתחת לאופק, שממקסם את עוצמת השפה האופקית ומשלם קנס על קפיצות. זה מוצא את הקו הארוך
והרציף שבו הרצפה נגמרת — בדיוק מה שאבן שפה, בסיס קיר או גדר הם. אחר כך יש **הכרעות ידניות**
לכל פנורמה, במעלות ובמטרים, למקומות שבהם המכונה טועה: פתח רחוב מתמשך, עמוד שמסתיר, עץ.
הן רשומות למטה ונקראות מהתמונה, לא מומצאות.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ART = os.path.join(HERE, '..', '..', 'public', 'life', 'art')
SHOTS = os.environ.get('DEPTH_SHOTS', '/tmp/depth')

# key → הגיאומטריה של הפנורמה, ואחריה ההכרעות הידניות
#   'open': טווחי אזימוט (מעלות, מהמרכז) שבהם אין קיר אלא רחוב שנמשך — הם מקבלים מרחק קבוע
#   'floor': מרחק מינימלי במטרים, כדי שרעש בקו המגע לא יצמיד קיר לפנים של המצלמה
JOBS = {
    'panoJaffa': dict(
        hfov=128, horizon=0.700, eye=1.7, floor=6.0,
        # השדרה נמשכת ישר קדימה עד מגדל השעון; שם אין קיר, יש מרחק
        open=[(-9, 9, 110.0)],
    ),
    'panoBloomFacade': dict(
        hfov=150, horizon=0.575, eye=1.7, floor=4.0,
        # הרחוב לשמאל נמשך; היציע עצמו מימין הוא קיר קרוב
        open=[(-75, -48, 60.0)],
    ),
    'panoBloomGate': dict(
        hfov=120, horizon=0.615, eye=1.7, floor=4.0,
        open=[(-60, -40, 45.0)],
    ),
    'panoUssOutside': dict(
        hfov=124, horizon=0.745, eye=1.7, floor=5.0,
        # שני הרחובות, שמאלה וימינה מהפינה
        open=[(-62, -40, 70.0), (40, 62, 70.0)],
    ),
    'panoTamar': dict(hfov=128, horizon=0.735, eye=1.7, floor=6.0, open=[]),
    'panoCinema': dict(hfov=130, horizon=0.735, eye=1.7, floor=6.0, open=[(30, 65, 80.0)]),
    'panoPromenade': dict(hfov=132, horizon=0.720, eye=1.7, floor=6.0, open=[(-66, -20, 90.0)]),
}

# כמה דגימות אזימוט הפרופיל נושא. 180 זה מעלה וחצי — מתחת לרזולוציה שהעין מבחינה בה
# כשקיר מתעקם, ומעל לרעש של קו המגע.
SAMPLES = 180


def contact_line(grey: np.ndarray, horizon: float, band: float = 0.02) -> np.ndarray:
    """קו המגע: מסלול רציף אחד לרוחב התמונה, שממקסם שפה אופקית מתחת לאופק."""
    h, w = grey.shape
    top = int(h * (horizon + band))
    rows = np.arange(top, h)
    strip = grey[top:h]
    # שפה אופקית: הפרש אנכי. קיר שפוגש רצפה הוא תמיד מעבר בהיר־כהה או כהה־בהיר חד.
    edge = np.abs(np.diff(strip, axis=0, prepend=strip[:1]))
    edge = edge / (edge.max() + 1e-6)
    n = edge.shape[0]
    # תכנות דינמי: לכל עמודה, הרווח הטוב ביותר עד אליה, עם קנס על קפיצה
    JUMP = 3          # כמה שורות מותר לזוז בין עמודות שכנות
    PENALTY = 0.02
    best = edge[:, 0].copy()
    back = np.zeros((n, w), dtype=np.int16)
    for x in range(1, w):
        shifted = np.full((2 * JUMP + 1, n), -1e9)
        for k in range(-JUMP, JUMP + 1):
            src = np.roll(best, k)
            if k > 0:
                src[:k] = -1e9
            elif k < 0:
                src[k:] = -1e9
            shifted[k + JUMP] = src - abs(k) * PENALTY
        pick = shifted.argmax(axis=0)
        back[:, x] = pick - JUMP
        best = shifted.max(axis=0) + edge[:, x]
    # מסלול אחורה מהעמודה האחרונה
    path = np.zeros(w, dtype=int)
    r = int(best.argmax())
    for x in range(w - 1, -1, -1):
        path[x] = r
        r = int(np.clip(r + back[r, x], 0, n - 1))
    return rows[path]


def profile(key: str, spec: dict) -> tuple[np.ndarray, np.ndarray, Image.Image]:
    im = Image.open(os.path.join(ART, f'{key}.png')).convert('RGB')
    w, h = im.size
    aspect = w / h
    hfov = np.deg2rad(spec['hfov'])
    grey = np.asarray(im.convert('L')).astype(np.float32)
    line = contact_line(grey, spec['horizon'])

    # מהשורה למרחק, לפי הגיאומטריה של ההטלה
    py = line / (h - 1)
    with np.errstate(divide='ignore'):
        r = spec['eye'] * (aspect / hfov) / np.maximum(py - spec['horizon'], 1e-4)

    # דגימה אחידה באזימוט, וחציון בכל דלי כדי שפיקסל בודד לא יזיז קיר
    theta = (np.arange(w) / (w - 1) - 0.5) * np.rad2deg(hfov)
    edges = np.linspace(theta[0], theta[-1], SAMPLES + 1)
    centres = (edges[:-1] + edges[1:]) / 2
    out = np.empty(SAMPLES)
    for i in range(SAMPLES):
        sel = (theta >= edges[i]) & (theta < edges[i + 1])
        out[i] = np.median(r[sel]) if sel.any() else np.nan
    out = np.where(np.isnan(out), np.nanmedian(out), out)

    # ההכרעות הידניות: רחוב שנמשך הוא לא קיר
    for lo, hi, metres in spec['open']:
        out[(centres >= lo) & (centres <= hi)] = metres
    out = np.maximum(out, spec['floor'])
    # החלקה קלה — קיר אמיתי לא משנה מרחק בין שתי מעלות שכנות
    pad = np.r_[out[:3][::-1], out, out[-3:][::-1]]
    out = np.convolve(pad, np.ones(5) / 5, mode='same')[3:-3]

    check = im.copy()
    draw = ImageDraw.Draw(check)
    draw.line([(x, int(line[x])) for x in range(0, w, 4)], fill=(255, 40, 40), width=5)
    return centres, out, check


def main() -> None:
    os.makedirs(SHOTS, exist_ok=True)
    manifest_path = os.path.join(ART, 'manifest.json')
    manifest = json.load(open(manifest_path, encoding='utf-8'))
    write = '--write' in sys.argv
    for key, spec in JOBS.items():
        if not os.path.exists(os.path.join(ART, f'{key}.png')):
            print(f'{key}: missing')
            continue
        centres, r, check = profile(key, spec)
        check.resize((900, int(900 * check.size[1] / check.size[0]))).save(os.path.join(SHOTS, f'{key}.png'))
        print(f'{key}: {r.min():.1f}–{r.max():.1f} m (median {np.median(r):.1f}), '
              f'walkable ≈ {r.min() * 0.55:.1f} m')
        if write:
            manifest['panoramas'].setdefault(key, {})['depth'] = {
                'fromDeg': round(float(centres[0]), 3),
                'toDeg': round(float(centres[-1]), 3),
                'metres': [round(float(v), 2) for v in r],
            }
    if write:
        json.dump(manifest, open(manifest_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print('manifest updated')


if __name__ == '__main__':
    main()
