import type PhaserNS from 'phaser'

/**
 * הזום — one rule for every scene, and it is "never show the edge of the world".
 *
 * The first version scaled the zoom off the viewport width and clipped or overshot
 * depending on the room: on a portrait phone the bedroom was drawn in the top third of
 * the glass with the camera's background colour under it, and on a wide screen the
 * window at the top of that same room was somewhere the camera could not reach. Both are
 * the same mistake — treating zoom as a style rather than as a constraint.
 *
 * So the zoom FILLS: whichever axis needs more magnification wins, the map always covers
 * the canvas, and the camera scrolls on the other axis. A phone in portrait sees a tall
 * slice of the street and a laptop sees a wide one, and neither ever sees past the edge.
 *
 * `floor` keeps a large map from becoming a diorama on a big screen — a child 34 pixels
 * tall has to stay legible — and the hard cap stops a small room magnifying into
 * abstraction on a very tall viewport.
 */
export function fillZoom(
  camera: PhaserNS.Cameras.Scene2D.Camera,
  width: number,
  height: number,
  floor: number,
): number {
  const viewWidth = camera.width || 800
  const viewHeight = camera.height || 600
  const fill = Math.max(viewWidth / width, viewHeight / height)
  const zoom = Math.min(Math.max(fill, floor), 7)
  return Number(zoom.toFixed(3))
}


/**
 * מסגרת — how much of the painting the glass shows.
 *
 * Filling the canvas edge to edge is right for a wide street and wrong for a nearly
 * square room on a phone held upright: covering a 4:3 painting with a 9:19 viewport
 * throws away three quarters of the width and leaves the player looking through a letter
 * slot. So the camera is allowed to fall short of covering — down to 70% of it — and the
 * space it cannot fill becomes a dark frame rather than a crop.
 *
 * That is not a compromise, it is how painted adventures have always been shown: the
 * picture is the composition, and the composition survives being framed.
 */
export function frameZoom(
  scene: PhaserNS.Scene,
  width: number,
  height: number,
  cover = 0.72,
): { zoom: number; viewWidth: number; viewHeight: number } {
  const viewWidth = scene.scale.gameSize.width || scene.cameras.main.width || 800
  const viewHeight = scene.scale.gameSize.height || scene.cameras.main.height || 600
  const fill = Math.max(viewWidth / width, viewHeight / height)
  const contain = Math.min(viewWidth / width, viewHeight / height)
  const zoom = Number(Math.min(Math.max(contain, fill * cover), 7).toFixed(3))
  return { zoom, viewWidth, viewHeight }
}

/**
 * Frame the painting and hand back the strip it actually occupies.
 *
 * On a phone held upright, a room painted across the frame cannot both fill the glass and
 * keep its composition — so it keeps its composition and the camera's viewport shrinks to
 * exactly the picture. What is left over is not a bug in the layout, it is where the
 * dialogue box and the thumb pad live, which is how a painted adventure has always been
 * laid out on a tall screen.
 */
export function frameCamera(
  scene: PhaserNS.Scene,
  camera: PhaserNS.Cameras.Scene2D.Camera,
  width: number,
  height: number,
  cover = 0.72,
): number {
  const { zoom, viewWidth, viewHeight } = frameZoom(scene, width, height, cover)
  const pictureHeight = Math.min(viewHeight, Math.ceil(height * zoom))
  camera.setViewport(0, 0, viewWidth, pictureHeight)
  camera.setZoom(zoom)
  return zoom
}
