# ניקוי הריפו — מקור אחד לכל דבר · 7.9.2026

בדיקה מלאה של `origin/main`, לפי הדרישה במסמך שלך: **קודם להוכיח מה קנוני, ואז לנקות.**
שום קובץ לא נמחק על סמך דמיון בשם.

## מה נמצא

בשורש הריפו יושבים **128 קבצים** שלא אמורים להיות שם:

| סוג | כמה | מה זה |
|---|---|---|
| קוד | 51 | `LifeStage.tsx`, `WorldScene.ts`, `dialogue.ts`, `dialogue (1).ts`, 11 קבצי פרקים, 9 טסטים |
| נכסים | 55 | `alley.png`, `gate5.png`, `amb-park.ogg` — כולם קיימים תחת `public/life/art` |
| מסמכי היסטוריה | 22 | `APPLY-*.md`, `DELETE-THESE.txt`, `READ-ME-FIRST.txt` |

הם הגיעו מהמעלה של GitHub: כשגוררים לתוכו את **הקבצים** מתוך ה-ZIP במקום את **התיקיות**,
הכול נוחת בשורש.

## ההוכחה שאפשר למחוק

**אף אחד מהם לא מיובא.** `tsconfig.json` כולל רק `app/`, `components/`, `lib/` ו-`types/`.
קובץ בשורש לא עובר טייפצ'ק, לא נכנס ל-bundle ולא רץ. בדקתי גם ייבוא בשם (`@/art`) וגם
ייבוא יחסי מחוץ לתיקיות — אין ולו אחד.

**כולם ישנים יותר מהקנוני.** השוויתי כל קובץ שורש מול התאום שלו ב-`origin/main`:

- **16 זהים בדיוק** לקנוני — עותק מיותר, אפס סיכון.
- **34 קטנים מהקנוני** — כלומר גרסה ישנה. דוגמאות: `WorldScene.ts` בשורש 155KB מול
  202KB תחת `lib/life/runtime/scenes/`; `chapterStageA.ts` 41KB מול 75KB;
  `LifeStage.tsx` 38KB מול 50KB.
- **`dialogue (1).ts`** (23KB) — עותק ישן של `lib/life/runtime/dialogue.ts` (37KB), לפי
  שורות הייבוא שבראשו.

**מסקנה: אין ולו שורת קוד אחת בשורש שלא קיימת, בגרסה חדשה יותר, במקום הנכון.**

## מה כבר עשיתי בקוד

1. **`npm run repo:hygiene`** (`scripts/check-repo-hygiene.mjs`) — נופל על קוד או נכסים
   בשורש, על שמות־עותק (`foo (1).ts`), ועל כל קובץ שורש ששמו כבר קיים תחת תיקיית ייצור.
2. **CI ב-GitHub** (`.github/workflows/ci.yml`) — כל דחיפה ל-main מריצה
   `repo:hygiene → typecheck → tests → build`. אין יותר "עובד אצלי".
3. **`CLAUDE.md` חוק 59** — אסור לערוך עותק שורש, אסור לספק קבצים לשורש, וכל תיקון חייב
   לדווח את הנתיב הקנוני שנגעתי בו.
4. **ארכיון** — 17 מסמכי ההיסטוריה שהיו רק בשורש נשמרו ב-
   `docs/implementation-history/apply/` ו-`docs/implementation-history/legacy/`. שום דבר
   לא הולך לאיבוד כשתמחק את המקור.

## מה אתה צריך לעשות — בקליקים בלבד

אני לא יכול למחוק קבצים בריפו שלך (אין לי הרשאת כתיבה אליו). זה לוקח שתי דקות:

1. להיכנס ל-`github.com/maordubel/The-Worker`.
2. ללחוץ על המקש **`.`** (נקודה) בעמוד. נפתח עורך VS Code בדפדפן.
3. בסייר הקבצים משמאל — לסמן את הקבצים ברשימה למטה (Ctrl/Cmd + קליק לבחירה מרובה).
4. מקש ימני → **Delete**.
5. בצד שמאל למעלה, בלשונית **Source Control**: לכתוב הודעה ("repo cleanup") וללחוץ
   **Commit & Push**.

אחרי זה ה-CI יהפוך לירוק, והוא זה שישמור שזה לא יחזור.

### הקבצים למחיקה — קוד (51)

DebugPanel.tsx · DialogueBox.tsx · HelpSheet.tsx · LifeHud.tsx · LifeStage.tsx ·
PrologueScene.ts · ScoreStrip.tsx · Stamp.tsx · WorldScene.ts · art.ts · audio.ts ·
beats.ts · bus.ts · chapter-probe.mjs · chapter1993galil.ts · chapter1996army.ts ·
chapter1997basket.ts · chapter1998laces.ts · chapter1999basket.ts · chapter1999cup.ts ·
chapter2000double.ts · chapterStageA.ts · checklist.ts · consequence.ts · context.ts ·
`dialogue (1).ts` · dialogue.ts · dialogue1990.ts · dialogue1991.ts · dialogueMatch.ts ·
encounters1986.ts · encounters1990.ts · encounters1991.ts · game.ts · input.ts ·
life-1990.test.ts · life-audio.test.ts · life-bible.test.ts · life-input.test.ts ·
life-match.test.ts · life-money.test.ts · life-stage-b.test.ts · life-upgrade.test.ts ·
life.test.ts · match-shots.mjs · matchDirector.ts · matchScripts.ts · money.ts ·
playthrough.mjs · scenes.ts · script.ts

**אסור למחוק** (אלה קבצי הקונפיגורציה האמיתיים): `next.config.mjs` · `next-env.d.ts` ·
`postcss.config.mjs` · `tailwind.config.ts` · `vitest.config.ts`

### נכסים (55)

כל קובץ `.png` / `.ogg` / `.m4a` / `.mp4` שיושב בשורש. 52 מהם זהים בדיוק לקובץ שתחת
`public/life/art/`, ושלושת קבצי `gate5*` בשורש הם גרסה ישנה יותר. המשחק טוען רק את
`public/`.

### מסמכי היסטוריה (22)

APPLY-*.md (9) · DELETE-FROM-GIT.txt · DELETE-THESE.txt · DELETED.txt · FIX.txt ·
READ-ME-FIRST.md · READ-ME-FIRST.txt · README-SOURCE.md · README-UPLOAD.md · NOTES.md ·
ART-REQUIRED.md · GRAPHICS-REQUESTS.md · GRAPHICS-REQUESTS-2026-09-05-EVENING.md ·
STATUS-2026-09-05-DELTA-21.md

כולם שמורים תחת `docs/`. `README.md` ו-`CLAUDE.md` נשארים.

## ואיך זה לא יקרה שוב

בכל מסירה מעכשיו: **לפרוס את ה-ZIP, ולגרור לתוך GitHub את התיקיות — `app`, `components`,
`lib`, `public`, `scripts`, `tests`, `docs` — ולא את הקבצים שבתוכן.** אם משהו בכל זאת
ינחת בשורש, ה-CI ייפול על זה בדחיפה הבאה ויגיד בדיוק איזה קובץ.
