# ART-REQUIRED — THE WORKER LIFE · ביקורת נכסים · 5.9.2026 (דלתא 21)

המסמך הקנוני של פערי הגרפיקה. כל נכס שהמשחק מציג סווג לאחת מארבע: **APPROVED** (נשאר כמו
שהוא), **ADJUST IN CODE** (הנכס טוב; הקוד מתקן מיקום/קנה מידה/חיתוך), **ART REQUIRED**
(חסר או stand-in — צריך ציור), **RETIRED** (הוסר מהמשחק). המפרטים המלאים לכל קובץ נשארו
ב־`GRAPHICS-REQUESTS.md`; כאן — מה המצב ומה חסר.

**כלל הבריף:** לא מטשטשים, לא חותכים ולא מגדילים כדי להסתיר נכס חלש. נכס חלש נרשם כאן.

## 1. סיכום

| סיווג | כמה | מה |
|---|---|---|
| APPROVED | 12 רקעים + **9 רקעים חדשים (5.9 ערב)** + **לוחית הכניסה** · 22 דמויות בוגרות (ספטמבר) · 6 סטים של פוגי (8, 12, 13–17, חייל, בחור) · 60 חפצים ומסמכים · 19 לוחיות פרק · `panoTerrace1986` · 71 קבצי סאונד | הבסיס שהמשחק רץ עליו |
| ADJUST IN CODE | 25 פורטרטי בלונים (נחתכו אוטומטית; רכים) · גיליון מלמד/פרדי ×2.4 · לוח התוצאה (מיקום המטרה) | עובד; משתפר עם הנכס האמיתי, בלי שינוי קוד |
| ART REQUIRED | 8 פנורמות · 6 (+6) טקסטורות מנהרה · 12 קלוז־אפים · 9 גיליונות בוגרים · 3 פוזות "בחור" · 5 חפצים · שלב א׳: 3 גילאים של הילד + 6 מבוגרים + `street--rain` + 5 חפצים · 17 פורטרטים 512 · 2 גיליונות מסודרים · key art אנכי מלא | הרשימה בסעיף 3 |
| RETIRED | `fanA–fanG` (פיקסל־ארט עם הילה) · `faceFan` · `pogi-side` / `pogi-walk` (מדף) | לא נטען, לא מצויר מחדש |

## 2. מה סווג APPROVED / ADJUST IN CODE (ולמה)

| נכס | סיווג | הערה |
|---|---|---|
| רקעים: `bedroom`, `home`, `kitchen`, `street`, `kiosk`, `pitch`, `route`, `bloomfield-*`, `ussishkin-*`, `classroom`, `schoolyard` | APPROVED | הציור ממלא את המסך לגובה (דלתא 20), פס כהה 6% |
| דמויות ספטמבר `adultA1–A7`, `adultB1–B6`, `young*` | APPROVED | מחליפות את האוהדים בכל חדר |
| פוגי: `pogi*` (8), `teen-*`, `soldier-*`, `young-*` | APPROVED | |
| פורטרטים `face*` (25) | ADJUST IN CODE | ראש 55px שהוגדל; הקוד מציג 320px על קרם. פורטרט 512 יחליף בלי שינוי קוד |
| **`busStation`, `ramatGan`, `hatikva`, `gate5`, `kioskNight`, `alley`, `cup83`, `armyRoom`, `lironCar`** (5.9 ערב) | APPROVED · **נכנסו** | `scripts/life/ingest-2026-09-05-art.py`. התחנה / רמת גן / התקווה / שער 5 — חדרים; הקיוסק בלילה — 1995 ו־1999; הסמטה — המגרש של שלב א׳; `cup83` — הפרולוג; `armyRoom` ו־`lironCar` — כרטיסי חיתוך ב־1996 (סירוב האוטובוס → הבסיס; "נוסע" → האוטו) עד שייבנו כחדרים |
| **`tunnelReveal`** — הילד בפי המנהרה (9:16) | APPROVED · **נכנס** | כרטיס הכניסה לבלומפילד (במקום `reveal`) והקלוז־אפ `cuPogiReveal` |
| מלמד / פרדי (`soft` במניפסט) | ADJUST IN CODE | הוגדלו ×2.4; גיליון 430px יחליף |
| לוח התוצאה `ScoreStrip` | ADJUST IN CODE · **בוצע** | המטרה שמתחת ללוח עברה לצד ימין — לא מכסה את הלב |
| סאונד: 63 סינתזה + **8 הקלטות אמיתיות** (5.9.2026) | APPROVED | `amb-park`, `park-wave`, `crowd-real-*` — פירוט ב־`content/audio/source/2026-09-05/NOTES.md` |

## 3. ART REQUIRED — לפי סדר עדיפות

1. **8 פנורמות 360°** (4096×2048) — כל רגע גוף־ראשון: `panoReveal`, `panoUssHall`, `panoUssDerby`, `panoKitchen90`, `panoBedroomMorning90`, `panoGate7`, `panoClassroom`, `panoRamatGan`. מפרט ב־GRAPHICS-REQUESTS §1.
2. ~~שלב ב׳ — 7 רקעים~~ **סופקו 5.9 ערב.** נשאר: `armyRoom` ו־`lironCar` כחדרים עם רצועת הליכה (היום — כרטיסי חיתוך).
3. **9 גיליונות בוגרים** (2048×1024, דמות 430px): `efi96`, `limor96`, `barry96`, `michel96`, `liron96`, `yaron96`, `dudu96`, `hermesh96`, `yosef2000`. §4.2.
4. **פוגי "בחור"** — `young-scarf`, `young-shout`, `young-hug`. §4.3.
5. **6 (+6 `-uss`) טקסטורות מנהרה** (1024×1024 tileable). §2.
6. **12 קלוז־אפים** (1080×1350): 8 של 1986–91 + `cuPogiPens`, `cuKobiChampions`, `cuAsafBanner`, `cuTransistorMan`. §3.
7. **שלב א׳ — הילד הקטן**: `pogi5-*` (כולל `pogi5-shoulders`), `pogi6-*`, `pogi7-*` + `pogi7-shirt-*`, `kobi83-*`, `rafi-*`, `ilan-*`, `liron-*`, `aliza-*`, `barry-*`; רקע `street--rain` (~~`cup83`, `alley`~~ סופקו); חפצים `propShirt85`, `propShirtHung`, `propRedCloth`, `propRadioOpen`, `paperWeekBefore`. §5.
8. **חפצים** (512×512): `propBanner5`, `propDarbuka`, `propPager`, `propTicket99`, `propTin`. §4.4.
9. **17 פורטרטים 512×512** לבלונים: 11 קבועים (`faceShachor`, `faceSoko`, `faceAsaf`, `faceUsher`, `faceLiron`, `faceMichel`, `faceLimor`, `faceBarry`, `faceYaron`, `faceMelamed`, `faceFreddy`) + 6 של 1986 (`faceOfir`, `faceAmit`, `faceEfi`, `faceKeren`, `faceKobi`, `faceRachel`). §6.
10. **גיליונות מסודרים** למלמד (עם דרבוקה, אף פעם לא גיטרה) ולפרדי; `titleWorker` ללא שוליים; key art אנכי 1080×1920. §6.

## 4. מה נוסף בדלתא 21 שלא צריך גרפיקה

- **לוח תוצאה ודקה** בכל משחק מבוים — קומפוננטה קיימת (`ScoreStrip`), מקבלת גם "–" כשהארכיון
  מחזיק עונה ולא תוצאה (לילות האולם 97/99).
- **רשימת צעדים** ב־"?" — טקסט ותיבות סימון, בטוקנים של המותג.
- **טוסטים עם כותרת** ("הכרת", "יזכור", "תוצאה", "קיבלת", "שילמת") — הקומפוננטה הקיימת.

## 5. סאונד — מה שהוקלט ומה שעדיין סינתזה

**אמיתי (5.9.2026):** פארק/רחוב (`amb-park` לולאה 37.5s + `park-wave`), קהל כדורגל בשש חתיכות
(`crowd-real-goal/murmur/build/miss/after/final`). המשחק מנגן אותם דרך מכונת המצבים
(`LOW_MURMUR → BUILDING_TENSION → CHANT → NEAR_MISS → GOAL_BURST → AFTERMATH → FINAL_WHISTLE`).

**עדיין סינתזה, ואפשר להחליף באותם שמות** (`.ogg`+`.m4a`, 22kHz מונו): `amb-hall` (אולם כדורסל),
`crowd-claps` (מחיאות בקצב — ה־CHANT בנוי עליהן), `darbuka-*`, `buzzer`, `amb-station`,
`amb-classroom`, `whistle-1/2/3`. הקלטה **בבעלותך** בלבד; לא שירים.
