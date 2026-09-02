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
