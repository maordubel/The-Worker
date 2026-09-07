'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

import { actorBillboard, buildSlab, SLABS } from '@/lib/life/city/slab'
import { buildPano, PANOS, POCKET_METRES } from '@/lib/life/city/pano'
import { t } from '@/lib/i18n'
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
  /** אצבע על המסך מסובבת את הראש, וכפתור אחד הולך קדימה */
  touch: boolean
}

const RAD = Math.PI / 180

/**
 * מסך ההוכחה של שלב 1. הוא קיים כדי שאפשר יהיה **להסתכל**, ועם `touch=1` גם לזוז — כי
 * "לטייל בתל אביב" זה לא משהו שתמונה סטטית יכולה להראות.
 *
 *   /city?place=panoTamar
 *
 * כשהמצלמה בנקודת האפס התמונה חייבת להיראות בדיוק כמו הקובץ שנשלח. כל סטייה שם היא באג
 * בגיאומטריה, לא טעם.
 */
export function Proof({ shot }: { shot: Shot }) {
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const box = boxRef.current
    if (!box) return
    const three = mountThree(box, shot.fov)
    three.scene.background = new THREE.Color(LIFE_PALETTE.night)
    const loader = new THREE.TextureLoader()

    let dispose = () => {}
    let eye = 1.7

    const panoSpec = PANOS[shot.place]
    if (panoSpec) {
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

    // המצב שהאצבע משנה. הגבול הוא הכיס — מעבר לו התמונה מתחילה לספר שהיא תמונה.
    const view = { x: shot.x, z: shot.z, yaw: shot.yaw, pitch: shot.pitch, walking: 0 }
    const limit = panoSpec ? POCKET_METRES : 2.2

    let pugi: THREE.Sprite | null = null
    let shadow: THREE.Mesh | null = null
    if (shot.actor) {
      // `pogi-back` ולא `kid-back`: הדמויות של המשחק מצולמות. מאור, 7.9.2026: *"תשתמש
      // בהכל ריאלי. לא רוצה לראות דמויות מצוירות."*
      pugi = actorBillboard(loader.load('/life/art/pogi-back.png'), 1.68)
      three.scene.add(pugi)
      // הצל הוא מה שמדביק אותו לכביש. בלעדיו הוא תמונה שהודבקה על רקע, וזה נראה בדיוק ככה.
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

      if (view.walking !== 0) {
        const step = view.walking * 1.35 * dt
        view.x += Math.sin(view.yaw * RAD) * step
        view.z -= Math.cos(view.yaw * RAD) * step
        const away = Math.hypot(view.x, view.z)
        if (away > limit) {
          view.x = (view.x / away) * limit
          view.z = (view.z / away) * limit
        }
      }

      three.camera.position.set(view.x, shot.actor ? 0.22 : 0, view.z + (shot.actor ? 0.5 : 0))
      three.camera.rotation.set(view.pitch * RAD, -view.yaw * RAD, 0, 'YXZ')
      if (pugi && shadow) {
        // פוגי הולך עם המצלמה ולא עומד במקום — זה מה שהופך הזזה קדימה ל"הלכתי".
        // כיוון המבט של מצלמת three הוא `(sin yaw, 0, −cos yaw)`. הסימן של `x` היה הפוך,
        // ולכן בסיבוב ימינה פוגי יצא מהפריים במקום להישאר לפנים.
        const ahead = new THREE.Vector3(Math.sin(view.yaw * RAD) * 3.5, 0, Math.cos(view.yaw * RAD) * -3.5)
        pugi.position.set(view.x + ahead.x + 0.28, -eye + 0.84, view.z + ahead.z)
        shadow.position.set(pugi.position.x, -eye + 0.006, pugi.position.z + 0.02)
      }
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
      // 0.16° לפיקסל: סיבוב מלא של הראש הוא בערך רוחב מסך, וזה הקצב שהיד קוראת כטבעי
      view.yaw = Math.max(-70, Math.min(70, view.yaw + (e.clientX - finger.x) * 0.16))
      view.pitch = Math.max(-22, Math.min(22, view.pitch - (e.clientY - finger.y) * 0.1))
      finger = { id: e.pointerId, x: e.clientX, y: e.clientY }
    }
    const up = () => {
      finger = null
    }
    if (shot.touch) {
      box.addEventListener('pointerdown', down)
      box.addEventListener('pointermove', move)
      box.addEventListener('pointerup', up)
      box.addEventListener('pointercancel', up)
    }
    ;(box as unknown as { walk?: (n: number) => void }).walk = (n: number) => {
      view.walking = n
    }

    const onResize = () => resizeThree(three, box)
    window.addEventListener('resize', onResize)
    return () => {
      window.clearTimeout(ready)
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      box.removeEventListener('pointerdown', down)
      box.removeEventListener('pointermove', move)
      box.removeEventListener('pointerup', up)
      box.removeEventListener('pointercancel', up)
      dispose()
      disposeThree(three, box)
    }
  }, [shot])

  const walk = (n: number) => () => {
    ;(boxRef.current as unknown as { walk?: (v: number) => void } | null)?.walk?.(n)
  }

  return (
    <main className="fixed inset-0 z-[80] bg-ink">
      <div ref={boxRef} className="absolute inset-0 touch-none" />
      {shot.touch && (
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
          <p className="max-w-[8rem] text-[11px] leading-tight text-cream/70">
            {t('city.hint')}
          </p>
          <button
            type="button"
            aria-label={t('city.walk')}
            className="min-h-tap min-w-tap border border-cream/40 bg-ink/70 px-6 py-3 text-cream"
            onPointerDown={walk(1)}
            onPointerUp={walk(0)}
            onPointerLeave={walk(0)}
            onPointerCancel={walk(0)}
          >
            ↑
          </button>
        </div>
      )}
    </main>
  )
}
