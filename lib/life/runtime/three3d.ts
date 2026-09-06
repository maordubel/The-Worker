import * as THREE from 'three'

import { LIFE_PALETTE } from './palette'

/**
 * שלד תלת-המימד — the one setup every 3D minigame shares.
 *
 * Maor asked for the penalty contest and the free-throw contest "בתלת מימד" (6.9.2026),
 * and the rest of this game is Phaser's flat perspective — real depth needed a real
 * camera. Both minigames mount one of these into a DOM box, build their own objects on
 * top of it, and drive it with a `requestAnimationFrame` loop of their own; this file is
 * only the part that would otherwise be written twice — the renderer, the resize, and the
 * teardown that stops a WebGL context from leaking every time a boy plays another round.
 */
export type Three3D = {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
}

export function mountThree(container: HTMLDivElement, fov = 52): Three3D {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(container.clientWidth || 1, container.clientHeight || 1)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.appendChild(renderer.domElement)
  renderer.domElement.style.display = 'block'

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(fov, (container.clientWidth || 1) / (container.clientHeight || 1), 0.1, 100)

  return { renderer, scene, camera }
}

export function resizeThree(three: Three3D, container: HTMLDivElement) {
  const w = container.clientWidth
  const h = container.clientHeight
  if (w === 0 || h === 0) return
  three.camera.aspect = w / h
  three.camera.updateProjectionMatrix()
  three.renderer.setSize(w, h)
}

export function disposeThree(three: Three3D, container: HTMLDivElement) {
  three.scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if ('geometry' in mesh && mesh.geometry) mesh.geometry.dispose()
    const material = (obj as THREE.Mesh).material
    if (Array.isArray(material)) material.forEach((m) => m.dispose())
    else if (material) (material as THREE.Material).dispose()
  })
  three.renderer.dispose()
  if (three.renderer.domElement.parentNode === container) container.removeChild(three.renderer.domElement)
}

/** a cheap flat "shadow" decal, the same trick every Phaser scene in this game uses */
export function shadowDecal(radius: number): THREE.Mesh {
  const geometry = new THREE.CircleGeometry(radius, 20)
  const material = new THREE.MeshBasicMaterial({ color: LIFE_PALETTE.night, transparent: true, opacity: 0.32, depthWrite: false })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = -Math.PI / 2
  return mesh
}

/**
 * כדור, בלי לבקש מאור תמונה — a small procedural texture so neither minigame needs an
 * image asset for the one prop that spends the whole minigame in the middle of the frame.
 */
export function ballTexture(kind: 'football' | 'basketball'): THREE.CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  if (kind === 'football') {
    ctx.fillStyle = '#f7f4ec'
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = '#161310'
    const pentagon = (cx: number, cy: number, r: number) => {
      ctx.beginPath()
      for (let i = 0; i < 5; i += 1) {
        const a = (Math.PI * 2 * i) / 5 - Math.PI / 2
        const x = cx + r * Math.cos(a)
        const y = cy + r * Math.sin(a)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fill()
    }
    pentagon(size * 0.5, size * 0.26, size * 0.15)
    pentagon(size * 0.18, size * 0.62, size * 0.14)
    pentagon(size * 0.82, size * 0.62, size * 0.14)
    pentagon(size * 0.5, size * 0.92, size * 0.12)
  } else {
    ctx.fillStyle = '#c9702e'
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = '#5c3115'
    ctx.lineWidth = size * 0.045
    ctx.beginPath()
    ctx.moveTo(0, size * 0.5)
    ctx.lineTo(size, size * 0.5)
    ctx.moveTo(size * 0.5, 0)
    ctx.lineTo(size * 0.5, size)
    ctx.arc(size * 0.5, size * 0.5, size * 0.4, 0, Math.PI * 2)
    ctx.stroke()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** the light rig every outdoor 3D scene here uses — cheap, and it is always daylight */
export function daylightRig(scene: THREE.Scene) {
  const hemi = new THREE.HemisphereLight(LIFE_PALETTE.sky, LIFE_PALETTE.dirtDark, 0.95)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight(LIFE_PALETTE.lamp, 1.05)
  sun.position.set(-4, 8, 4)
  scene.add(sun)
}
