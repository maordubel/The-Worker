# תיקון הבילד — הרץ פקודה אחת

הבילד ב-Vercel נופל על `app/kits/build/KitChallengeBoard.tsx`. הקובץ הזה הוחלף
ב-`KitRun.tsx` בדלתא קודמת, אבל הוא עדיין ב-git אצלך — ולכן `next build` מקמפל אותו
ונופל על `submitKit` שכבר לא קיים. אצלי הכל ירוק כי אצלי הוא נמחק.

## מה לעשות

פרוס את הזיפ הזה על שורש הריפו והרץ:

```bash
bash scripts/cleanup-retired.sh
git commit -am "remove retired files"
git push
```

זהו. הסקריפט אידמפוטנטי — אפשר להריץ אותו אחרי כל דלתא, וגם פעמיים ברצף.

## מה זה מוחק

| קובץ | הוחלף ב־ |
|---|---|
| `app/kits/build/KitChallengeBoard.tsx` | `app/kits/build/KitRun.tsx` |
| `app/trivia/TriviaRound.tsx` | `app/trivia/TriviaRun.tsx` |
| `app/trivia/summary/` (כל התיקייה) | הריצה נגמרת במקום |
| `components/press/StoryCard.tsx` | `lib/share/story.ts` |
| `app/derby/BlackFile.tsx` · `actions.ts` | `app/derby/file/` |
| `app/icon.svg` | `public/brand/logo-192.png` |

## ולמה זה לא יקרה שוב

`tests/guards.test.ts` קורא את רשימת הקבצים מתוך הסקריפט **ונכשל אם אחד מהם עדיין
בעץ**. כלומר `npm run test` נופל אצלך במחשב לפני שהוא נופל ב-Vercel, וההודעה אומרת בדיוק
איזו פקודה להריץ. שתי הרשימות הן אותה רשימה, אז שורה שנוספת לסקריפט נאכפת אוטומטית.

229 טסטים עוברים אצלי אחרי התיקון.
