import * as THREE from 'three'

/**
 * לעמוד בתוך התמונה — הפנורמות שמאור שלח ב-7.9.2026, כמו שהן.
 *
 * הן לא רקעים רחבים. הכביש בתחתיתן מתעקל, וזאת החתימה של **הטלה גלילית**: הצלם הסתובב
 * סביב עצמו, וקו ישר של מדרכה נמתח סביבו לקשת. תמונה כזאת היא לא ציור שמסתכלים עליו — היא
 * חלל שעומדים במרכזו. וזה בדיוק מה שהתבקש: לא "רקע יפה", אלא להסתובב בצומת ולראות מה יש
 * מסביב.
 *
 * הגיאומטריה, ובלי אף פיקסל מומצא:
 *
 * • **הגליל.** בהטלה גלילית `x` הוא זווית האופק באופן ליניארי, ו-`y` הוא הגובה על הגליל
 *   באופן ליניארי (`h = R·tan ε`, ו-`tan ε` הוא בדיוק מה שהפיקסל מודד). לכן גליל רגיל עם
 *   מיפוי UV רגיל הוא ההצגה **המדויקת** של התמונה, לא קירוב שלה. אין כאן עיוות שצריך לתקן.
 *
 * • **הרצפה.** כל פיקסל מתחת לקו האופק הוא נקודה על הכביש במרחק `r = eye / tan|ε|` ובזווית
 *   `θ`. אפשר להפוך את זה: לכל נקודה על מישור הרצפה בעולם, לחשב לאיזה פיקסל בפנורמה היא
 *   שייכת. זה מה שה-shader עושה — הוא לא מצייר רצפה, הוא **קורא** את הרצפה שכבר צולמה.
 *   התוצאה: המרצפות זורמות נכון מתחת לרגליים כשהולכים, כי הן במקום האמיתי שלהן בעולם.
 *
 * • **איפה הם נפגשים.** הקצה התחתון של הפנורמה הוא הקרן אל הכביש במרחק
 *   `r₀ = eye·aspect / (hFov·(1−horizon))` — בערך שישה מטרים. מעבר לזה הגליל; מתחתיו
 *   הדיסקה. הם נפגשים בדיוק, כי שניהם נגזרים מאותה קרן.
 *
 * מה שאין: המטרים האחרונים מתחת לרגליים. הצלם עמד שם, אז הפנורמה לא צילמה אותם, ולכן
 * הרצועה התחתונה נמשכת פנימה (`clamp`) — אותה החלטה בדיוק שכבר התקבלה ב-
 * `finish-backdrops.py` לכל רקע אחר במשחק. ומה שעוד אין: אנשים ועמודים שעומדים על הכביש
 * נמרחים לתוך הרצפה מתחת לנקודת המגע שלהם, כי לתמונה שטוחה אין דרך לדעת שהם עומדים. הפתרון
 * לזה הוא לחתוך אותם ולהחזיר כדמויות, וזה שלב 4 בתדריך, לא כאן.
 */

export type PanoSpec = {
  /** מפתח התמונה תחת `/life/art` */
  key: string
  /** רוחב חלקי גובה של קובץ התמונה */
  aspect: number
  /** קו האופק כשבר מהגובה, מלמעלה — נמדד על התמונה */
  horizon: number
  /**
   * שדה הראייה האופקי, במעלות. נגזר משתי נקודות המגוז של שני הרחובות הניצבים בצומת:
   * המרחק ביניהן על התמונה הוא בדיוק 90°.
   */
  hFovDeg: number
  /** גובה העין מעל הכביש, במטרים */
  eye: number
  /**
   * צבע הכביש ממש מתחת לרגליים, כשלושה בייטים — **החציון הנמדד** של הרצועה התחתונה בתמונה
   * עצמה (`ingest-panoramas-2026-09-07b.py` מדפיס אותו וכותב אותו למניפסט), לא בחירת צבע
   * שלי. מה שמעבר לקצה התמונה נמסך אליו, ולכן המטר האחרון הוא משטח ולא פסים.
   */
  nearRgb: [number, number, number]
  /**
   * רדיוס הגליל במטרים. הוא לא משנה את התמונה כשעומדים במרכז — רק את קצב הפרלקסה כשזזים.
   * שלושים מטר זה בערך המרחק לחזית שממול ברחוב תל־אביבי, ולכן הבתים זזים נכון והים כמעט לא.
   */
  radius: number
}

export const PANOS: Record<string, PanoSpec> = {
  panoPromenade: { key: 'panoPromenade', aspect: 2560 / 1029, horizon: 0.72, hFovDeg: 132, eye: 1.7, radius: 30, nearRgb: [136, 104, 74] },
  panoTamar: { key: 'panoTamar', aspect: 2560 / 1029, horizon: 0.735, hFovDeg: 128, eye: 1.7, radius: 26, nearRgb: [89, 83, 77] },
  panoCinema: { key: 'panoCinema', aspect: 2560 / 1086, horizon: 0.735, hFovDeg: 130, eye: 1.7, radius: 28, nearRgb: [86, 84, 83] },
}

const ART = '/life/art'

/**
 * כמה רחוק מותר להתרחק מנקודת הצילום לפני שהמרחק עצמו נראה. הפנורמה מדויקת בנקודה אחת,
 * ושני מטר וחצי ממנה עדיין קוראים כהליכה; חמישה מטר כבר מושכים את הכיסאות של בית הקפה
 * לתוך המדרכה, כי לתמונה שטוחה אין דרך לדעת שהם עומדים עליה. זה הגבול של כיס אחד, וממנו
 * מתחיל שרשור הבלוקים.
 */
export const POCKET_METRES = 2.5

/** המרחק שבו הקצה התחתון של הפנורמה פוגש את הכביש — הגבול בין הדיסקה לגליל */
export function nearEdge(spec: PanoSpec): number {
  const hFov = (spec.hFovDeg * Math.PI) / 180
  return (spec.eye * spec.aspect) / (hFov * (1 - spec.horizon))
}

const GROUND_VERT = `
varying vec3 vWorld;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

/**
 * ההיפוך. לכל נקודה על הרצפה: הזווית סביב הצופה נותנת את `u`, והמרחק ממנו נותן את `v`.
 * `hFov` ו-`aspect` הם המספרים שמתרגמים מטרים לפיקסלים, ו-`horizon` הוא היכן האופס.
 */
const GROUND_FRAG = `
uniform sampler2D map;
uniform float hFov;      // רדיאנים
uniform float aspect;    // רוחב/גובה של התמונה
uniform float horizon;   // שבר מהגובה
uniform float eye;       // מטרים
uniform vec3 origin;     // מרכז הפנורמה בעולם
uniform vec3 nearColour; // צבע הכביש שמעבר לקצה התמונה
varying vec3 vWorld;

void main() {
  vec3 d = vWorld - origin;
  float r = length(vec2(d.x, d.z));
  // הזווית סביב הצופה; קדימה הוא -z, כמו בכל שאר המשחק
  float theta = atan(d.x, -d.z);
  float u = 0.5 + theta / hFov;
  if (u < 0.0 || u > 1.0) discard;
  // py/h — ככל שהנקודה רחוקה יותר, כך היא קרובה יותר לקו האופק
  float py = horizon + (aspect / hFov) * (eye / max(r, 0.001));
  // המטרים האחרונים מתחת לרגליים לא צולמו — הצלם עמד עליהם. שתי דרכים נוסו: למרוח את
  // השורה התחתונה פנימה (פסים רדיאליים), ולקפל את הרצועה חזרה כלפי מעלה. הקיפול נכשל, ולא
  // בעדינות: הרצועה שמתחת לקו האופק בתמונה היא לא רצפה — יש בה חזיתות חנויות, סלי לחם
  // ואנשים — וקיפול שלה שם השתקפות הפוכה של המאפייה על הכביש. מה שנשאר, ומה שנכון: השורה
  // האחרונה נמסכת אל צבע הכביש עצמו, החציון של אותה רצועה. המטר האחרון הוא משטח, וזה מה
  // שהוא באמת.
  float fade = clamp((py - 1.0) / 0.22, 0.0, 1.0);
  float v = 1.0 - min(py, 0.998);
  vec3 c = texture2D(map, vec2(u, v)).rgb;
  // מעבר לקצה התמונה כל קרן שומרת על צבעה, וזה בדיוק מה שנראה כפסים רדיאליים. הפתרון
  // שנשאר אחרי שלושה שנפסלו: **הרצועה התחתונה בלבד מקופלת פנימה.** לא כל החלק שמתחת לקו
  // האופק — שם יש חזיתות חנויות ואנשים, וקיפול שלהם שם השתקפות של המאפייה על הכביש — אלא
  // שבעה אחוזים בלבד מתחתית התמונה, שהם רצפה ורק רצפה. המרצפות מתחת לרגליים הן מרצפות
  // אמיתיות מהצילום, בקנה מידה שמשתנה ברציפות; מה שאין זה הפרספקטיבה המדויקת שלהן, ואותה
  // ממילא אף אחד לא מודד בשני מטר.
  float band = 0.07;
  float k = mod((py - 1.0) / band, 2.0);
  float folded = 1.0 - (k > 1.0 ? 2.0 - k : k) * band;
  vec3 near = texture2D(map, vec2(u, 1.0 - folded)).rgb;
  // ומעט אל צבע הכביש עצמו, כדי שהקיפול לא ייצור טבעות בהירות־כהות חוזרות
  near = mix(near, nearColour, fade * 0.4);
  gl_FragColor = vec4(mix(c, near, fade), 1.0);
}
`

export type Pano = {
  group: THREE.Group
  /** גובה העין — המצלמה יושבת ב-y=0 של הקבוצה, הכביש ב-`-eye` */
  eye: number
  /** מרחק המפגש בין הדיסקה לגליל */
  nearEdge: number
  dispose: () => void
}

/**
 * בונה את החלל. המצלמה אמורה לשבת בנקודה `origin` שנמסרה — שם, ורק שם, התמונה נראית
 * בדיוק כפי שצולמה.
 */
export function buildPano(spec: PanoSpec, loader: THREE.TextureLoader, origin = new THREE.Vector3()): Pano {
  const group = new THREE.Group()
  const hFov = (spec.hFovDeg * Math.PI) / 180
  const map = loader.load(`${ART}/${spec.key}.png`)
  map.colorSpace = THREE.SRGBColorSpace
  map.minFilter = THREE.LinearMipmapLinearFilter
  map.magFilter = THREE.LinearFilter
  map.generateMipmaps = true
  map.anisotropy = 16

  // R בפיקסלים: הרוחב חלקי שדה הראייה. ממנו נגזר גובה הגליל בעולם.
  const pxPerRad = spec.aspect / hFov          // ביחידות של גובה התמונה
  const worldHeight = spec.radius / pxPerRad   // גובה הגליל כולו
  const centreY = worldHeight * (spec.horizon - 0.5)

  // `CylinderGeometry` מודד את הזווית מ-`+z`, כלומר מאחורי המצלמה; `π` מסובב אותו לקדימה.
  const shell = new THREE.CylinderGeometry(
    spec.radius, spec.radius, worldHeight, 160, 1, true, Math.PI - hFov / 2, hFov,
  )
  // הגליל נצפה מבפנים, ולכן `u` רץ מימין לשמאל. ההיפוך על הגיאומטריה ולא על הטקסטורה,
  // כי אותה טקסטורה משמשת גם את ה-shader של הרצפה — ושם `repeat`/`offset` לא חלים בכלל.
  const uv = shell.getAttribute('uv') as THREE.BufferAttribute
  for (let i = 0; i < uv.count; i += 1) uv.setX(i, 1 - uv.getX(i))
  uv.needsUpdate = true

  const wall = new THREE.Mesh(
    shell,
    new THREE.MeshBasicMaterial({ map, side: THREE.BackSide, toneMapped: false, depthWrite: true }),
  )
  wall.position.copy(origin).add(new THREE.Vector3(0, centreY, 0))
  group.add(wall)

  // הרצפה מקבלת עותק **בלי מיפמאפים**, וזה לא פרט טכני: במבט משופע ה-GPU רואה שהטקסטורה
  // נדחסת מאוד לאורך הקרן, בוחר את רמת המיפמאפ הקטנה ביותר — ממוצע כל הפנורמה — וצובע את
  // הכביש בחום־שחור אחיד עם פסים. זה בדיוק מה שנראה בצילום השני. הדיסקה מכסה רק שבעה מטר,
  // כלומר תמיד קרובה, ולכן אין לה שום צורך במיפמאפים מלכתחילה.
  const groundMap = loader.load(`${ART}/${spec.key}.png`)
  // `NoColorSpace`, ולא sRGB, וזה השורש של הכביש השחור בשלושת הצילומים הראשונים: כשטקסטורה
  // מסומנת sRGB היא נטענת לחומרה בפורמט SRGB8, והדגימה **מפענחת** אותה ל-linear. חומר רגיל
  // של three מקודד חזרה בסוף ה-shader; ShaderMaterial גולמי לא מקודד כלום, ולכן 86 יצא 24.
  // כאן הכל נשאר במרחב אחד — בייטים כמו בקובץ, נכתבים כמו שהם.
  groundMap.colorSpace = THREE.NoColorSpace
  groundMap.generateMipmaps = false
  groundMap.minFilter = THREE.LinearFilter
  groundMap.magFilter = THREE.LinearFilter

  const edge = nearEdge(spec)
  // הדיסקה נמתחת מעבר לקצה התמונה בכוונה. הקצה התחתון של הגליל והקצה של הדיסקה מתלכדים
  // בדיוק רק כשהמצלמה בנקודת האפס; ברגע שהיא זזה חצי מטר נפתח ביניהם קו. הטבעת הנוספת
  // עולה כלום, כי מעבר לקצה ההיטל מחזיר בדיוק את אותם פיקסלים שהגליל מראה שם ממילא —
  // אותה תמונה, רק מוטלת על הרצפה במקום על הקיר.
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(edge * 1.8, 160),
    new THREE.ShaderMaterial({
      uniforms: {
        map: { value: groundMap },
        hFov: { value: hFov },
        aspect: { value: spec.aspect },
        horizon: { value: spec.horizon },
        eye: { value: spec.eye },
        origin: { value: origin.clone() },
        // `Vector3` ולא `Color`, וזאת לא קפדנות: מאז r152 `THREE.Color` ממיר כל הקס
        // ל-linear ברגע הבנייה, ואילו `texture2D` ב-ShaderMaterial גולמי מחזיר sRGB כמו
        // שהוא — הפלט לא עובר המרה בכלל. לערבב את השניים פירושו כביש שחור, וזה בדיוק מה
        // שנראה בשני הצילומים הראשונים. שלושת המספרים כאן הם הבייטים של התמונה עצמה.
        nearColour: {
          value: new THREE.Vector3(
            spec.nearRgb[0] / 255,
            spec.nearRgb[1] / 255,
            spec.nearRgb[2] / 255,
          ),
        },
      },
      vertexShader: GROUND_VERT,
      fragmentShader: GROUND_FRAG,
    }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.copy(origin).add(new THREE.Vector3(0, -spec.eye, 0))
  group.add(ground)

  return {
    group,
    eye: spec.eye,
    nearEdge: edge,
    dispose() {
      wall.geometry.dispose()
      ;(wall.material as THREE.Material).dispose()
      ground.geometry.dispose()
      ;(ground.material as THREE.Material).dispose()
      map.dispose()
      groundMap.dispose()
    },
  }
}
