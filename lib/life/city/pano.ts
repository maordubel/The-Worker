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
  /** שם המקום, כמו שאומרים אותו — זה מה שמופיע בבורר המקומות */
  nameHe: string
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
   * עצמה. משמש כרשת ביטחון בלבד, למקרה שאין מרצף.
   */
  nearRgb: [number, number, number]
  /**
   * המרצף המיושר — אותה רצפה, מסובבת למבט מלמעלה על ידי
   * `scripts/life/rectify-ground-2026-09-07.py`, ובקנה מידה של מטרים. הוא זה שמכסה את
   * המרחק הקצר, שבו הקרן משיקה לרצפה וההיטל מהפנורמה מותח חמישה פיקסלים על עשרה מטר.
   */
  tile?: { key: string; wide: number; deep: number }
  /**
   * רדיוס הגליל במטרים. הוא לא משנה את התמונה כשעומדים במרכז — רק את קצב הפרלקסה כשזזים.
   * שלושים מטר זה בערך המרחק לחזית שממול ברחוב תל־אביבי, ולכן הבתים זזים נכון והים כמעט לא.
   */
  radius: number
}

/**
 * הסדר הוא הסדר שהבורר מציג, והוא לא אלפביתי: הוא הדרך. שדרות ירושלים, החזית של בלומפילד,
 * מתחת ליציע — ואז המקומות האחרים בעיר.
 */
export const PLACE_ORDER = [
  'panoJaffa',
  'panoBloomFacade',
  'panoBloomGate',
  'panoUssOutside',
  'panoTamar',
  'panoCinema',
  'panoPromenade',
] as const

export const PANOS: Record<string, PanoSpec> = {
  panoPromenade: {
    nameHe: 'הטיילת, הבניין העגול מול הים',
    key: 'panoPromenade', aspect: 2560 / 1029, horizon: 0.72, hFovDeg: 132, eye: 1.7,
    radius: 30, nearRgb: [136, 104, 74], tile: { key: 'panoPromenade--tile', wide: 4.1, deep: 3.0 },
  },
  panoTamar: {
    nameHe: 'פינת קפה תמר',
    key: 'panoTamar', aspect: 2560 / 1029, horizon: 0.735, hFovDeg: 128, eye: 1.7,
    radius: 26, nearRgb: [89, 83, 77], tile: { key: 'panoTamar--tile', wide: 3.96, deep: 1.95 },
  },
  panoCinema: {
    nameHe: 'קולנוע אלנבי, הצומת',
    key: 'panoCinema', aspect: 2560 / 1086, horizon: 0.735, hFovDeg: 130, eye: 1.7,
    radius: 28, nearRgb: [86, 84, 83], tile: { key: 'panoCinema--tile', wide: 5.61, deep: 3.8 },
  },
  // בלומפילד מבחוץ — שתי התחנות של הדרך פנימה. החזית היא רחוב, המרחב מתחת ליציע הוא
  // חלל מקורה ורחב מאוד (מאה וחמישים מעלות), ולכן גם קו האופק בו נמוך: רואים הרבה רצפה.
  panoBloomFacade: {
    nameHe: 'בלומפילד, החזית',
    key: 'panoBloomFacade', aspect: 2560 / 1086, horizon: 0.575, hFovDeg: 150, eye: 1.7,
    radius: 16, nearRgb: [170, 142, 116], tile: { key: 'panoBloomFacade--tile', wide: 1.91, deep: 3.0 },
  },
  panoBloomGate: {
    nameHe: 'בלומפילד, מתחת ליציע',
    key: 'panoBloomGate', aspect: 2560 / 1086, horizon: 0.615, hFovDeg: 120, eye: 1.7,
    radius: 22, nearRgb: [188, 165, 143], tile: { key: 'panoBloomGate--tile', wide: 2.44, deep: 3.2 },
  },
  // אוסישקין מבחוץ — הפינה עם הגג הירוק. שני רחובות ניצבים נפגשים כאן, ונקודות המגוז
  // שלהם על התמונה נותנות את שדה הראייה: המרחק ביניהן הוא בדיוק תשעים מעלות.
  panoUssOutside: {
    nameHe: 'אוסישקין מבחוץ',
    key: 'panoUssOutside', aspect: 2560 / 1029, horizon: 0.745, hFovDeg: 124, eye: 1.7,
    radius: 24, nearRgb: [79, 67, 60], tile: { key: 'panoUssOutside--tile', wide: 3.98, deep: 3.0 },
  },
  // שדרות ירושלים ביפו — הדרך אל בלומפילד. הרחבה ביותר מבין הארבע, ולכן גם הרדיוס גדול
  // יותר: השדרה רחבה, החזיתות רחוקות, והמגדל בקצה כמעט לא זז כשהולכים.
  panoJaffa: {
    nameHe: 'שדרות ירושלים, יפו',
    key: 'panoJaffa', aspect: 2560 / 1034, horizon: 0.70, hFovDeg: 128, eye: 1.7,
    radius: 32, nearRgb: [165, 137, 108], tile: { key: 'panoJaffa--tile', wide: 3.0, deep: 4.0 },
  },
}

const ART = '/life/art'

/**
 * כמה רחוק מותר להתרחק מנקודת הצילום לפני שהמרחק עצמו נראה. הפנורמה מדויקת בנקודה אחת,
 * ושני מטר וחצי ממנה עדיין קוראים כהליכה; חמישה מטר כבר מושכים את הכיסאות של בית הקפה
 * לתוך המדרכה, כי לתמונה שטוחה אין דרך לדעת שהם עומדים עליה. זה הגבול של כיס אחד, וממנו
 * מתחיל שרשור הבלוקים.
 */
export const POCKET_METRES = 2.5

/**
 * כמה הדיסקה נמתחת מעבר לקצה התמונה. הקצה התחתון של הגליל והקצה של הדיסקה מתלכדים בדיוק
 * רק כשהמצלמה בנקודת האפס; ברגע שהיא זזה חצי מטר נפתח ביניהם קו. הטבעת הנוספת עולה כלום,
 * כי מעבר לקצה ההיטל מחזיר בדיוק את אותם פיקסלים שהגליל מראה שם ממילא.
 */
export const DISC_FACTOR = 1.8

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
uniform sampler2D map;       // הפנורמה עצמה
uniform sampler2D tile;      // הרצפה המיושרת, מלמעלה, בקנה מידה של מטרים
uniform vec2 tileSize;       // כמה מטרים המרצף מכסה
uniform float hFov;          // רדיאנים
uniform float aspect;        // רוחב/גובה של התמונה
uniform float horizon;       // שבר מהגובה
uniform float eye;           // מטרים
uniform float edge;          // המרחק שבו הקצה התחתון של הפנורמה פוגש את הכביש
uniform float hasTile;       // 1 אם יש מרצף
uniform vec3 origin;         // מרכז הפנורמה בעולם
uniform vec3 nearColour;     // רשת ביטחון: צבע הכביש הנמדד
varying vec3 vWorld;

void main() {
  vec3 d = vWorld - origin;
  float r = length(vec2(d.x, d.z));
  float theta = atan(d.x, -d.z);
  float u = 0.5 + theta / hFov;
  float py = horizon + (aspect / hFov) * (eye / max(r, 0.001));

  // הרחוק: מה שהפנורמה באמת צילמה — סימני כביש, אבני שפה, כתמים. אין תחליף לזה.
  vec3 far = (u < 0.0 || u > 1.0) ? nearColour : texture2D(map, vec2(u, 1.0 - min(py, 0.998))).rgb;

  // הקרוב: המרצף המיושר, מרוצף במרחב העולם ולכן בפרספקטיבה נכונה בכל מרחק. זה מה שהחליף
  // שלושה ניסיונות שנכשלו — מריחת השורה האחרונה, קיפול הרצועה, וטשטוש לרוחב הזווית —
  // וכולם נכשלו מאותה סיבה: בזווית משיקה פשוט אין מספיק פיקסלים בתמונה.
  vec3 near = hasTile > 0.5 ? texture2D(tile, vWorld.xz / tileSize).rgb : nearColour;

  // המעבר מתחיל בדיוק במקום שבו ההיטל מפסיק להיות אמין — קצה התמונה — ונגמר חצי מטר אחריו
  float k = smoothstep(edge, edge * 1.45, r);
  gl_FragColor = vec4(mix(near, far, k), 1.0);
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
  const tileMap = spec.tile ? loader.load(`${ART}/${spec.tile.key}.png`) : null
  if (tileMap) {
    tileMap.colorSpace = THREE.NoColorSpace
    // מראה־ריצוף ולא ריצוף רגיל: קצוות המרצף לא תואמים זה לזה, והמראה מבטלת את התפר בלי
    // לדרוש מרצף שנתפר ידנית.
    tileMap.wrapS = tileMap.wrapT = THREE.MirroredRepeatWrapping
    tileMap.minFilter = THREE.LinearMipmapLinearFilter
    tileMap.magFilter = THREE.LinearFilter
    tileMap.generateMipmaps = true
    tileMap.anisotropy = 16
  }
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(edge * DISC_FACTOR, 160),
    new THREE.ShaderMaterial({
      uniforms: {
        map: { value: groundMap },
        tile: { value: tileMap ?? groundMap },
        tileSize: { value: new THREE.Vector2(spec.tile?.wide ?? 1, spec.tile?.deep ?? 1) },
        hasTile: { value: tileMap ? 1 : 0 },
        edge: { value: edge },
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
      tileMap?.dispose()
    },
  }
}
