'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

import { ControlDeck } from '@/components/life/ControlDeck'
import { ACTOR_BACK, actorPose, loadActor } from '@/lib/life/city/actor'
import { CITY_COPY } from '@/lib/life/city/copy'
import { buildPano, PANOS, PLACE_ORDER, walkLimit } from '@/lib/life/city/pano'
import { buildStreet, STREETS } from '@/lib/life/city/street'
import { actorBillboard, buildSlab, SLABS } from '@/lib/life/city/slab'
import { LIFE_PALETTE } from '@/lib/life/runtime/palette'
import { disposeThree, mountThree, resizeThree, shadowDecal } from '@/lib/life/runtime/three3d'

export type Shot = {
  /** `street`/`gate7` → רב־מישור; `panoTamar` וכו' → פנורמה גלילית */
  place: string
  /** הזזה לרוחב במטרים — זה מה שמייצר את הפרלקסה */
  x: number
  /** קדימה/אחורה במטרים */
  z: number
  /** סיבוב ראש במעלות, ימינה חיובי */
  yaw: number
  /** הטיית ראש במעלות, למטה שלילי */
  pitch: number
  /** שדה הראייה האנכי של המצלמה */
  fov: number
  /** להעמיד את פוגי מול המצלמה */
  actor: boolean
  /** הג׳ויסטיק והכפתורים — כבוי בצילומים האוטומטיים */
  deck: boolean
  /** דריסת שדה הראייה של הפנורמה, לכיול בלבד; אפס = מה שרשום בלוח */
  hfov: number
  /** רחוב שלם במקום מקום אחד — שרשרת תחנות, הליכה בלי גבול */
  street: string
}

const RAD = Math.PI / 180
/** מטר וארבעים לשנייה — הליכה. B מכפיל. */
const WALK = 1.4
/** מעלות לשנייה בהטיית הג׳ויסטיק המלאה */
const TURN = 78

/**
 * העיר, ובתוכה מישהו שהולך.
 *
 * הפקד הוא **`ControlDeck` הקיים** ולא כפתור משלי, וזאת לא חסכנות: זה אותו ג׳ויסטיק ואותם
 * A/B שהמשחק כבר מלמד בכל מסך אחר, ועכשיו גם המגרש התלת־ממדי רץ עליו. שפת שליטה אחת לכל
 * המשחק. הכפתור שהיה כאן קודם דרש **החזקה**, ומאור הקיש עליו — שלוש מאות מילישניות הן
 * ארבעים סנטימטר, כלומר שום דבר שהעין רואה. ג׳ויסטיק לא סובל מזה.
 *
 *   מוט קדימה/אחורה — ללכת · מוט לצדדים — להסתובב · אצבע על התמונה — להביט · B — לרוץ
 */
export function Proof({ shot }: { shot: Shot }) {
  const boxRef = useRef<HTMLDivElement>(null)
  // הפקדים כותבים לכאן, והלולאה קוראת. אין `setState` בלולאה — ששים פריימים בשנייה של
  // רינדור מחדש ב-React הם בדיוק איך שמשחק בטלפון מתחיל לגמגם.
  const input = useRef({ x: 0, y: 0, run: false })
  const [deck, setDeck] = useState({ top: 0, band: 0 })

  const onAxis = useCallback((x: number, y: number) => {
    input.current.x = x
    input.current.y = y
  }, [])
  const onCancel = useCallback((down: boolean) => {
    input.current.run = down
  }, [])
  const onAction = useCallback(() => {}, [])

  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const three = mountThree(box, shot.fov)
    three.scene.background = new THREE.Color(LIFE_PALETTE.night)
    const loader = new THREE.TextureLoader()

    let dispose = () => {}
    let eye = 1.7
    let walk: ReturnType<typeof buildStreet> | null = null

    const road = STREETS[shot.street]
    const listed = PANOS[shot.place]
    const panoSpec = listed && shot.hfov > 0 ? { ...listed, hFovDeg: shot.hfov } : listed
    if (road) {
      walk = buildStreet(road, loader)
      three.scene.add(walk.group)
      eye = walk.eye
      dispose = walk.dispose
    } else if (panoSpec) {
      const pano = buildPano(panoSpec, loader)
      three.scene.add(pano.group)
      eye = pano.eye
      dispose = pano.dispose
    } else {
      const slabSpec = SLABS[shot.place] ?? SLABS.street
      if (!slabSpec) return
      const slab = buildSlab(slabSpec, loader)
      three.scene.add(slab.group)
      eye = slab.eye
      dispose = slab.dispose
    }

    const view = { x: shot.x, z: shot.z, yaw: shot.yaw, pitch: shot.pitch, moved: 0, lateral: 0, moving: false }
    // ברחוב אין כיס: הגבול הוא אורך הרחוב, והתחנות מוסרות זו לזו לאורכו.
    const limit = walk ? Infinity : panoSpec ? walkLimit(panoSpec) : 2.2

    let pugi: THREE.Sprite | null = null
    let shadow: THREE.Mesh | null = null
    let frames: Record<string, THREE.Texture> = {}
    if (shot.actor) {
      // התצלומים, לא הילד המצויר. מאור, 7.9.2026: *"תשתמש בהכל ריאלי."*
      frames = loadActor(loader)
      pugi = actorBillboard(frames[ACTOR_BACK] as THREE.Texture, 1.68)
      three.scene.add(pugi)
      // הצל הוא מה שמדביק אותו לכביש. בלעדיו הוא תמונה שהודבקה על רקע.
      shadow = shadowDecal(0.34)
      shadow.scale.set(0.92, 0.44, 1)
      three.scene.add(shadow)
    }

    let raf = 0
    let last = performance.now()
    const frame = () => {
      const now = performance.now()
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      const stick = input.current
      view.yaw = Math.max(-70, Math.min(70, view.yaw + stick.x * TURN * dt))
      const speed = -stick.y * WALK * (stick.run ? 1.9 : 1)
      view.moving = Math.abs(speed) > 0.05
      if (view.moving) {
        const step = speed * dt
        view.x += Math.sin(view.yaw * RAD) * step
        view.z -= Math.cos(view.yaw * RAD) * step
        view.moved += Math.abs(step)
        if (walk) {
          view.z = Math.max(-walk.length, Math.min(0, view.z))
          view.x = Math.max(-4, Math.min(4, view.x))
        } else {
          const away = Math.hypot(view.x, view.z)
          if (away > limit) {
            view.x = (view.x / away) * limit
            view.z = (view.z / away) * limit
          }
        }
      }
      // כמה מהתנועה היא לרוחב הפריים: המוט לצדדים מסובב, ולכן זה בעצם קצב הסיבוב
      view.lateral = view.moving ? stick.x : 0

      walk?.update(-view.z)
      three.camera.position.set(view.x, shot.actor ? 0.22 : 0, view.z + (shot.actor ? 0.5 : 0))
      three.camera.rotation.set(view.pitch * RAD, -view.yaw * RAD, 0, 'YXZ')

      if (pugi && shadow) {
        const pose = actorPose(view.lateral, view.moved, view.moving)
        const map = frames[pose.key]
        const material = pugi.material as THREE.SpriteMaterial
        if (map && material.map !== map) {
          material.map = map
          material.needsUpdate = true
          const w = map.image?.width ?? 0
          const h = map.image?.height ?? 0
          if (w > 0 && h > 0) pugi.scale.set((1.68 * w) / h, 1.68, 1)
        }
        pugi.material.rotation = 0
        pugi.scale.x = Math.abs(pugi.scale.x) * (pose.flip ? -1 : 1)
        // כיוון המבט של three הוא `(sin yaw, 0, −cos yaw)` — פוגי תמיד שלושה מטר וחצי לפנים
        const ax = Math.sin(view.yaw * RAD) * 3.5
        const az = Math.cos(view.yaw * RAD) * -3.5
        pugi.position.set(view.x + ax + 0.28, -eye + 0.84 + pose.bob, view.z + az)
        shadow.position.set(pugi.position.x, -eye + 0.006, pugi.position.z + 0.02)
      }
      // כמה נהלך בפועל — הצילום האוטומטי קורא את זה, אחרת "לא זז" ו"זז קצת" נראים אותו דבר
      box.dataset.along = (-view.z).toFixed(2)
      three.renderer.render(three.scene, three.camera)
      raf = requestAnimationFrame(frame)
    }
    frame()

    // הדגל שהצילום האוטומטי מחכה לו — בלעדיו הוא מצלם מסך ריק וקורא לזה תוצאה
    const ready = window.setTimeout(() => box.setAttribute('data-ready', '1'), 1500)

    let finger: { id: number; x: number; y: number } | null = null
    const down = (e: PointerEvent) => {
      finger = { id: e.pointerId, x: e.clientX, y: e.clientY }
    }
    const move = (e: PointerEvent) => {
      if (!finger || finger.id !== e.pointerId) return
      view.yaw = Math.max(-70, Math.min(70, view.yaw + (e.clientX - finger.x) * 0.16))
      view.pitch = Math.max(-20, Math.min(20, view.pitch - (e.clientY - finger.y) * 0.1))
      finger = { id: e.pointerId, x: e.clientX, y: e.clientY }
    }
    const up = () => {
      finger = null
    }
    box.addEventListener('pointerdown', down)
    box.addEventListener('pointermove', move)
    box.addEventListener('pointerup', up)
    box.addEventListener('pointercancel', up)

    const onResize = () => {
      resizeThree(three, box)
      // הפס שנשאר לפקד. `ControlDeck` בונה את עצמו לפי הגובה הזה — עם אפס הוא מתקפל
      // לגרסה צפה וקטנה, ועם מאה שלושים הוא הארון עצמו, כמו בכל מסך אחר במשחק.
      const band = Math.round(Math.min(148, Math.max(112, window.innerHeight * 0.16)))
      setDeck({ top: window.innerHeight - band, band })
    }
    onResize()

    window.addEventListener('resize', onResize)
    return () => {
      window.clearTimeout(ready)
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      box.removeEventListener('pointerdown', down)
      box.removeEventListener('pointermove', move)
      box.removeEventListener('pointerup', up)
      box.removeEventListener('pointercancel', up)
      for (const map of Object.values(frames)) map.dispose()
      dispose()
      disposeThree(three, box)
    }
  }, [shot])

  return (
    <main className="fixed inset-0 z-[80] bg-ink">
      <div
        ref={boxRef}
        className="absolute inset-x-0 top-0 touch-none"
        style={{ bottom: shot.deck ? deck.band : 0 }}
      />
      {shot.deck && (
        // בורר המקומות. הוא לא HUD של המשחק — הוא קיים כדי שאפשר יהיה לעבור בין המקומות
        // בלי להקליד כתובת, וייעלם ברגע שהמקומות מחוברים זה לזה בדרך הליכה.
        <nav
          dir="rtl"
          className="absolute inset-x-0 top-0 z-40 flex gap-1 overflow-x-auto bg-gradient-to-b from-ink/80 to-transparent px-2 pb-6 pt-[max(8px,env(safe-area-inset-top))]"
        >
          {PLACE_ORDER.map((key) => (
            <a
              key={key}
              href={`/city?place=${key}`}
              className={`min-h-tap shrink-0 border-hair px-2.5 py-1.5 text-[12px] leading-none ${
                key === shot.place ? 'border-red bg-red text-sheet' : 'border-sheet/40 bg-ink/60 text-sheet/85'
              }`}
            >
              <bdi>{PANOS[key]?.nameHe}</bdi>
            </a>
          ))}
        </nav>
      )}
      {shot.deck && (
        // שורה אחת, בפינה, פעם אחת. הכפתור הקודם דרש החזקה ומאור הקיש עליו — שלוש מאות
        // מילישניות הן ארבעים סנטימטר, כלומר שום דבר שהעין רואה. עכשיו יש מוט, וכתוב מה הוא.
        <p
          dir="rtl"
          className="pointer-events-none absolute inset-x-0 z-40 px-3 text-center font-body text-[11px] leading-none text-sheet/70"
          style={{ bottom: deck.band + 10 }}
        >
          {CITY_COPY.hintHe}
        </p>
      )}
      {shot.deck && (
        <ControlDeck
          top={deck.top}
          height={deck.band}
          touch
          verb={null}
          label={null}
          onAxis={onAxis}
          onAction={onAction}
          onCancel={onCancel}
        />
      )}
    </main>
  )
}
