import { at } from '../clock'
import type { LocationId } from '../types'
import type { MapDef } from './types'

/**
 * שמונה מקומות — the whole of Stage 1's world.
 *
 * Compact on purpose (brief §8): a hub you learn in ten minutes beats a city you never
 * see twice. Every one of these is the same `WorldScene` reading a different record, so
 * the cost of the ninth location is a data entry, and the cost of 1990 is a second layer
 * list against the same geometry.
 *
 * Two rules the geometry itself enforces:
 *  · **Bloomfield is a character, not a map** (brief §13). Its exterior is drawn wide
 *    with the lattice pylons breaking the skyline, the approach narrows into a tunnel,
 *    and the interior is four times the size of any room the child has been in. Scale is
 *    the whole point of the sequence, so the scale lives in the numbers here.
 *  · **The child is small.** Rooms are sized so a 34px figure reads as a child in them.
 *
 * ART-PLACEHOLDER: every `layers` entry is procedural paint (see `runtime/painter.ts`).
 * Final artwork replaces the ops; nothing about a solid, an exit or an NPC changes.
 */

export const KICKOFF = at(16, 0)
export const KOBI_LEAVES = at(15, 10)
export const FULL_TIME = at(17, 45)

const bedroom: MapDef = {
  id: 'bedroom',
  titleHe: 'החדר שלך',
  width: 340,
  height: 240,
  base: 'interior',
  zoom: 3,
  layers: [
    { k: 'fill', x: 0, y: 0, w: 340, h: 240, c: 'plasterShade' },
    { k: 'tiles', x: 14, y: 40, w: 312, h: 186, size: 26, c: 'floorWood' },
    { k: 'fill', x: 0, y: 0, w: 340, h: 42, c: 'plaster' },
    { k: 'speckle', x: 0, y: 0, w: 340, h: 42, c: 'plasterShade', n: 40 },
    // the window over the street — the first thing the game shows you is outside
    { k: 'fill', x: 132, y: 6, w: 78, h: 32, c: 'ink' },
    { k: 'fill', x: 135, y: 9, w: 72, h: 26, c: 'sky' },
    { k: 'fill', x: 135, y: 26, w: 72, h: 9, c: 'plasterShade' },
    { k: 'poster', x: 42, y: 8, w: 46, h: 30, c: 'red' },
    { k: 'poster', x: 240, y: 10, w: 40, h: 26, c: 'navy' },
    // bed
    { k: 'furniture', x: 26, y: 74, w: 74, h: 118, c: 'furniture', top: 'cloth' },
    { k: 'fill', x: 30, y: 78, w: 66, h: 44, c: 'sheet' },
    { k: 'fill', x: 30, y: 122, w: 66, h: 66, c: 'redDeep' },
    // desk and chair
    { k: 'furniture', x: 208, y: 62, w: 88, h: 40, c: 'furniture' },
    { k: 'fill', x: 226, y: 106, w: 30, h: 26, c: 'furnitureDark' },
    // the rug the whole childhood happens on
    { k: 'rug', x: 118, y: 118, w: 82, h: 62 },
  ],
  extra: [
    {
      // The red box. Empty at the start of a life; a memory physically appears in it.
      when: { flag: 'memory:first' },
      layers: [
        { k: 'fill', x: 250, y: 152, w: 44, h: 36, c: 'redDeep' },
        { k: 'fill', x: 250, y: 152, w: 44, h: 8, c: 'red' },
        { k: 'fill', x: 258, y: 140, w: 12, h: 16, c: 'paperCream' },
        { k: 'fill', x: 274, y: 143, w: 14, h: 12, c: 'sheet' },
      ],
    },
    {
      when: { notFlag: 'memory:first' },
      layers: [
        { k: 'fill', x: 250, y: 152, w: 44, h: 36, c: 'furnitureDark' },
        { k: 'fill', x: 250, y: 152, w: 44, h: 7, c: 'furniture' },
      ],
    },
  ],
  solids: [
    { x: 0, y: 0, w: 340, h: 42 },
    { x: 0, y: 0, w: 14, h: 240 },
    { x: 326, y: 0, w: 14, h: 240 },
    { x: 0, y: 226, w: 130, h: 14 },
    { x: 196, y: 226, w: 144, h: 14 },
    { x: 26, y: 74, w: 74, h: 118 },
    { x: 208, y: 62, w: 88, h: 40 },
    { x: 250, y: 152, w: 44, h: 36 },
  ],
  spawns: { start: { x: 168, y: 168 }, fromHome: { x: 163, y: 208 } },
  npcs: [],
  props: [
    { id: 'bed', x: 26, y: 74, w: 74, h: 118, act: 'bed' },
    { id: 'window', x: 132, y: 42, w: 78, h: 14, act: 'window' },
    { id: 'poster', x: 42, y: 38, w: 46, h: 12, act: 'poster' },
    { id: 'desk', x: 208, y: 102, w: 88, h: 14, act: 'desk' },
    { id: 'redbox', x: 250, y: 152, w: 44, h: 40, act: 'redbox' },
  ],
  exits: [{ id: 'door', x: 130, y: 224, w: 66, h: 16, to: 'home', spawn: 'fromBedroom' }],
}

const home: MapDef = {
  id: 'home',
  titleHe: 'הבית',
  width: 540,
  height: 330,
  base: 'interior',
  zoom: 2.6,
  layers: [
    { k: 'fill', x: 0, y: 0, w: 540, h: 330, c: 'plasterShade' },
    { k: 'tiles', x: 14, y: 44, w: 512, h: 272, size: 28, c: 'tile' },
    { k: 'fill', x: 0, y: 0, w: 540, h: 46, c: 'plaster' },
    { k: 'speckle', x: 0, y: 0, w: 540, h: 46, c: 'plasterShade', n: 60 },
    { k: 'poster', x: 60, y: 8, w: 44, h: 32, c: 'red' },
    { k: 'fill', x: 210, y: 8, w: 96, h: 32, c: 'ink' },
    { k: 'fill', x: 213, y: 11, w: 90, h: 26, c: 'sky' },
    // living room — sofa, low table, the radio the match comes out of
    { k: 'furniture', x: 40, y: 150, w: 120, h: 44, c: 'furniture', top: 'rug' },
    { k: 'furniture', x: 46, y: 214, w: 92, h: 30, c: 'furnitureDark' },
    { k: 'furniture', x: 180, y: 156, w: 46, h: 42, c: 'furniture', top: 'furnitureDark' },
    { k: 'fill', x: 186, y: 150, w: 34, h: 12, c: 'rail' },
    { k: 'rug', x: 34, y: 250, w: 150, h: 56 },
    // kitchen — counter, fridge, table, the crate of bottles by the door
    { k: 'furniture', x: 330, y: 60, w: 190, h: 40, c: 'furnitureDark', top: 'cloth' },
    { k: 'furniture', x: 470, y: 110, w: 52, h: 84, c: 'plasterCool', top: 'concrete' },
    { k: 'furniture', x: 350, y: 170, w: 96, h: 56, c: 'furniture', top: 'cloth' },
    { k: 'fill', x: 300, y: 258, w: 46, h: 34, c: 'furnitureDark' },
    { k: 'fill', x: 304, y: 250, w: 8, h: 12, c: 'shutter' },
    { k: 'fill', x: 318, y: 250, w: 8, h: 12, c: 'shutter' },
    { k: 'fill', x: 332, y: 250, w: 8, h: 12, c: 'shutter' },
  ],
  solids: [
    { x: 0, y: 0, w: 540, h: 46 },
    { x: 0, y: 0, w: 14, h: 330 },
    { x: 526, y: 0, w: 14, h: 330 },
    { x: 0, y: 316, w: 540, h: 14 },
    { x: 40, y: 150, w: 120, h: 44 },
    { x: 180, y: 156, w: 46, h: 42 },
    { x: 330, y: 46, w: 190, h: 54 },
    { x: 470, y: 110, w: 52, h: 84 },
    { x: 350, y: 170, w: 96, h: 56 },
  ],
  spawns: {
    fromBedroom: { x: 250, y: 70 },
    fromStreet: { x: 30, y: 250 },
  },
  npcs: [
    {
      id: 'kobi',
      figure: 'kobi',
      x: 120,
      y: 128,
      facing: 'down',
      nameHe: 'קובי',
      talk: 'kobi-morning',
      when: { beforeMinute: KOBI_LEAVES },
    },
    {
      id: 'rachel',
      figure: 'rachel',
      x: 400,
      y: 130,
      facing: 'down',
      nameHe: 'רחל',
      talk: 'rachel-kitchen',
      route: [
        { x: 400, y: 130, wait: 3200 },
        { x: 460, y: 140, wait: 2400 },
        { x: 356, y: 150, wait: 2800 },
      ],
    },
  ],
  props: [
    { id: 'radio', x: 180, y: 142, w: 46, h: 18, act: 'radio' },
    { id: 'crate', x: 300, y: 250, w: 46, h: 42, act: 'bottles' },
    { id: 'kitchen-table', x: 350, y: 226, w: 96, h: 14, act: 'kitchen-table' },
    { id: 'photo', x: 60, y: 40, w: 44, h: 12, act: 'family-photo' },
  ],
  exits: [
    { id: 'to-bedroom', x: 232, y: 46, w: 60, h: 14, to: 'bedroom', spawn: 'fromHome' },
    { id: 'to-street', x: 0, y: 236, w: 16, h: 66, to: 'street', spawn: 'fromHome' },
  ],
}

const street: MapDef = {
  id: 'street',
  titleHe: 'הרחוב',
  width: 980,
  height: 470,
  base: 'sky',
  zoom: 2.1,
  layers: [
    { k: 'fill', x: 0, y: 0, w: 980, h: 470, c: 'dirt' },
    { k: 'fill', x: 0, y: 0, w: 980, h: 96, c: 'skyDeep' },
    // the block: four buildings, the home one first
    { k: 'building', x: -10, y: 20, w: 190, h: 150, floors: 3, bays: 3, balcony: true },
    { k: 'building', x: 190, y: 34, w: 160, h: 136, c: 'stone', floors: 3, bays: 3 },
    { k: 'building', x: 360, y: 16, w: 210, h: 154, floors: 3, bays: 4, balcony: true },
    { k: 'building', x: 590, y: 30, w: 180, h: 140, c: 'plasterCool', floors: 3, bays: 3 },
    { k: 'building', x: 790, y: 24, w: 200, h: 146, floors: 3, bays: 4, balcony: true },
    // pavement and road
    { k: 'fill', x: 0, y: 170, w: 980, h: 74, c: 'concrete' },
    { k: 'speckle', x: 0, y: 170, w: 980, h: 74, c: 'concreteDark', n: 110 },
    { k: 'road', x: 0, y: 300, w: 980, h: 96 },
    { k: 'fill', x: 0, y: 290, w: 980, h: 12, c: 'concreteDark' },
    { k: 'fill', x: 0, y: 394, w: 980, h: 12, c: 'concreteDark' },
    { k: 'fill', x: 0, y: 406, w: 980, h: 64, c: 'concrete' },
    // the wall every neighbourhood has, and what is written on it
    { k: 'wall', x: 210, y: 406, w: 320, h: 56 },
    { k: 'graffiti', x: 236, y: 414, w: 150, h: 34 },
    { k: 'graffiti', x: 410, y: 418, w: 96, h: 28, c: 'redDeep' },
    { k: 'wall', x: 640, y: 406, w: 260, h: 56, c: 'stone' },
    { k: 'poster', x: 662, y: 414, w: 40, h: 34, c: 'red' },
    { k: 'poster', x: 712, y: 416, w: 36, h: 30, c: 'navy' },
    // the kiosk, red-signed, the centre of the street
    { k: 'fill', x: 400, y: 178, w: 132, h: 74, c: 'furniture' },
    { k: 'fill', x: 400, y: 178, w: 132, h: 16, c: 'furnitureDark' },
    { k: 'sign', x: 404, y: 152, w: 124, h: 28, c: 'red', words: 2 },
    { k: 'fill', x: 416, y: 200, w: 100, h: 40, c: 'paperCream' },
    { k: 'fill', x: 420, y: 206, w: 20, h: 28, c: 'redDeep' },
    { k: 'fill', x: 444, y: 206, w: 20, h: 28, c: 'navy' },
    { k: 'fill', x: 468, y: 206, w: 20, h: 28, c: 'shutter' },
    { k: 'fill', x: 492, y: 206, w: 20, h: 28, c: 'rust' },
    // trees, parked cars, the alley mouth
    { k: 'tree', x: 128, y: 250, r: 22 },
    { k: 'tree', x: 606, y: 252, r: 20 },
    { k: 'tree', x: 900, y: 246, r: 24 },
    { k: 'car', x: 150, y: 254, w: 96, h: 40, c: 'carCream' },
    { k: 'car', x: 690, y: 250, w: 92, h: 40, c: 'carBlue' },
    { k: 'car', x: 830, y: 412, w: 96, h: 40, c: 'carGreen' },
    { k: 'fill', x: 770, y: 96, w: 26, h: 78, c: 'asphalt' },
  ],
  extra: [
    {
      // After Kobi leaves, the street fills up. The world tells you what is happening;
      // no quest marker does (brief §25).
      when: { afterMinute: KOBI_LEAVES },
      layers: [
        { k: 'crowd', x: 560, y: 268, w: 400, h: 22, n: 9 },
        { k: 'crowd', x: 620, y: 424, w: 340, h: 20, n: 6 },
      ],
    },
  ],
  solids: [
    { x: 0, y: 0, w: 980, h: 170 },
    { x: 400, y: 178, w: 132, h: 74 },
    { x: 210, y: 406, w: 320, h: 56 },
    { x: 640, y: 406, w: 260, h: 56 },
    { x: 150, y: 262, w: 96, h: 32 },
    { x: 690, y: 258, w: 92, h: 32 },
    { x: 830, y: 420, w: 96, h: 32 },
    { x: 0, y: 462, w: 980, h: 8 },
  ],
  spawns: {
    fromHome: { x: 92, y: 200 },
    fromKiosk: { x: 466, y: 262 },
    fromPitch: { x: 783, y: 182 },
    fromRoute: { x: 946, y: 270 },
  },
  npcs: [
    {
      id: 'ofir',
      figure: 'ofir',
      x: 300,
      y: 380,
      facing: 'down',
      nameHe: 'אופיר',
      talk: 'ofir-wall',
      route: [
        { x: 300, y: 380, wait: 5200 },
        { x: 372, y: 384, wait: 3400 },
        { x: 258, y: 372, wait: 4200 },
      ],
      when: { beforeMinute: KOBI_LEAVES },
    },
    {
      id: 'ofir-later',
      figure: 'ofir',
      x: 560,
      y: 276,
      facing: 'right',
      nameHe: 'אופיר',
      talk: 'ofir-matchday',
      when: { afterMinute: KOBI_LEAVES },
    },
    {
      id: 'neighbour',
      figure: 'fan',
      x: 200,
      y: 268,
      facing: 'down',
      nameHe: 'שכן',
      talk: 'neighbour',
      route: [
        { x: 200, y: 268, wait: 4000 },
        { x: 130, y: 274, wait: 3000 },
      ],
    },
  ],
  props: [
    { id: 'kiosk-front', x: 400, y: 252, w: 132, h: 16, act: 'kiosk-look' },
    { id: 'wall-writing', x: 236, y: 448, w: 150, h: 16, act: 'wall-writing' },
    { id: 'coin-spot', x: 606, y: 274, w: 26, h: 20, act: 'gutter-coin', when: { notFlag: 'found:coin' } },
    { id: 'alley', x: 770, y: 166, w: 26, h: 16, act: 'alley-look' },
  ],
  exits: [
    { id: 'home', x: 76, y: 168, w: 44, h: 14, to: 'home', spawn: 'fromStreet' },
    { id: 'kiosk', x: 440, y: 240, w: 52, h: 14, to: 'kiosk', spawn: 'fromStreet' },
    { id: 'pitch', x: 770, y: 156, w: 26, h: 20, to: 'pitch', spawn: 'fromStreet' },
    {
      id: 'route',
      x: 964,
      y: 250,
      w: 16,
      h: 120,
      to: 'route',
      spawn: 'fromStreet',
      manual: true,
    },
  ],
}

const kiosk: MapDef = {
  id: 'kiosk',
  titleHe: 'הקיוסק',
  width: 340,
  height: 230,
  base: 'interior',
  zoom: 3,
  layers: [
    { k: 'fill', x: 0, y: 0, w: 340, h: 230, c: 'furnitureDark' },
    { k: 'tiles', x: 12, y: 96, w: 316, h: 122, size: 22, c: 'concrete' },
    { k: 'fill', x: 0, y: 0, w: 340, h: 98, c: 'furniture' },
    // the shelf wall: newspapers, sweets, cards, bottles
    { k: 'fill', x: 20, y: 14, w: 300, h: 22, c: 'furnitureDark' },
    { k: 'fill', x: 20, y: 44, w: 300, h: 22, c: 'furnitureDark' },
    { k: 'fill', x: 24, y: 16, w: 40, h: 18, c: 'paperCream' },
    { k: 'fill', x: 68, y: 16, w: 40, h: 18, c: 'paperCream' },
    { k: 'fill', x: 112, y: 16, w: 34, h: 18, c: 'redDeep' },
    { k: 'fill', x: 150, y: 16, w: 34, h: 18, c: 'navy' },
    { k: 'fill', x: 188, y: 16, w: 34, h: 18, c: 'shutter' },
    { k: 'fill', x: 226, y: 16, w: 34, h: 18, c: 'rust' },
    { k: 'fill', x: 264, y: 16, w: 50, h: 18, c: 'red' },
    { k: 'fill', x: 24, y: 46, w: 60, h: 18, c: 'plasterCool' },
    { k: 'fill', x: 90, y: 46, w: 60, h: 18, c: 'shutter' },
    { k: 'fill', x: 156, y: 46, w: 60, h: 18, c: 'redDeep' },
    { k: 'fill', x: 222, y: 46, w: 92, h: 18, c: 'cloth' },
    // counter
    { k: 'furniture', x: 30, y: 116, w: 280, h: 34, c: 'furniture', top: 'cloth' },
    { k: 'fill', x: 44, y: 106, w: 46, h: 12, c: 'paperCream' },
    { k: 'fill', x: 240, y: 104, w: 30, h: 14, c: 'red' },
  ],
  solids: [
    { x: 0, y: 0, w: 340, h: 100 },
    { x: 0, y: 0, w: 12, h: 230 },
    { x: 328, y: 0, w: 12, h: 230 },
    { x: 0, y: 216, w: 120, h: 14 },
    { x: 200, y: 216, w: 140, h: 14 },
    { x: 30, y: 116, w: 280, h: 34 },
  ],
  spawns: { fromStreet: { x: 168, y: 196 } },
  npcs: [
    {
      id: 'shopkeeper',
      figure: 'kiosk',
      x: 168,
      y: 104,
      facing: 'down',
      nameHe: 'בעל הקיוסק',
      talk: 'kiosk-man',
    },
  ],
  props: [{ id: 'counter', x: 30, y: 150, w: 280, h: 16, act: 'kiosk-counter' }],
  exits: [{ id: 'out', x: 120, y: 216, w: 80, h: 14, to: 'street', spawn: 'fromKiosk' }],
}

const pitch: MapDef = {
  id: 'pitch',
  titleHe: 'המגרש',
  width: 620,
  height: 380,
  base: 'sky',
  zoom: 2.3,
  layers: [
    { k: 'fill', x: 0, y: 0, w: 620, h: 380, c: 'dirt' },
    { k: 'fill', x: 0, y: 0, w: 620, h: 70, c: 'skyDeep' },
    { k: 'building', x: -20, y: 6, w: 200, h: 100, floors: 2, bays: 3 },
    { k: 'building', x: 420, y: 0, w: 220, h: 106, c: 'stone', floors: 2, bays: 4 },
    { k: 'wall', x: 180, y: 40, w: 240, h: 66 },
    { k: 'graffiti', x: 206, y: 52, w: 160, h: 40 },
    { k: 'speckle', x: 0, y: 110, w: 620, h: 260, c: 'dirtDark', n: 200 },
    { k: 'fill', x: 40, y: 130, w: 540, h: 3, c: 'concreteDark' },
    { k: 'fill', x: 40, y: 344, w: 540, h: 3, c: 'concreteDark' },
    // improvised goals: two stones and a jumper. That is what the goals were.
    { k: 'fill', x: 44, y: 190, w: 12, h: 14, c: 'stone' },
    { k: 'fill', x: 44, y: 274, w: 12, h: 14, c: 'stone' },
    { k: 'fill', x: 564, y: 190, w: 12, h: 14, c: 'stone' },
    { k: 'fill', x: 564, y: 274, w: 14, h: 14, c: 'redDeep' },
    { k: 'tree', x: 596, y: 150, r: 20 },
  ],
  solids: [
    { x: 0, y: 0, w: 620, h: 110 },
    { x: 0, y: 0, w: 10, h: 380 },
    { x: 610, y: 0, w: 10, h: 380 },
    { x: 0, y: 370, w: 620, h: 10 },
  ],
  spawns: { fromStreet: { x: 120, y: 150 } },
  npcs: [
    {
      id: 'efi',
      figure: 'kidRed',
      x: 300,
      y: 250,
      facing: 'down',
      nameHe: 'ילד מהשכונה',
      talk: 'pitch-kids',
      route: [
        { x: 300, y: 250, wait: 2600 },
        { x: 360, y: 210, wait: 2200 },
        { x: 264, y: 288, wait: 2400 },
      ],
    },
    { id: 'kid2', figure: 'kidGrey', x: 400, y: 300, facing: 'left', nameHe: 'ילד מהשכונה', talk: 'pitch-kids' },
    { id: 'kid3', figure: 'kidGrey', x: 216, y: 300, facing: 'right', nameHe: 'ילד מהשכונה', talk: 'pitch-kids' },
  ],
  props: [{ id: 'ball', x: 296, y: 320, w: 22, h: 22, act: 'pitch-ball' }],
  exits: [{ id: 'back', x: 100, y: 100, w: 44, h: 16, to: 'street', spawn: 'fromPitch' }],
}

const route: MapDef = {
  id: 'route',
  titleHe: 'בדרך לבלומפילד',
  width: 1400,
  height: 340,
  base: 'sky',
  zoom: 2.1,
  layers: [
    { k: 'fill', x: 0, y: 0, w: 1400, h: 340, c: 'dirt' },
    { k: 'fill', x: 0, y: 0, w: 1400, h: 92, c: 'skyDeep' },
    { k: 'building', x: -20, y: 10, w: 200, h: 130, floors: 3, bays: 3 },
    { k: 'building', x: 190, y: 22, w: 180, h: 118, c: 'stone', floors: 3, bays: 3 },
    { k: 'building', x: 380, y: 6, w: 220, h: 134, floors: 3, bays: 4, balcony: true },
    { k: 'building', x: 610, y: 26, w: 170, h: 114, c: 'plasterCool', floors: 2, bays: 3 },
    { k: 'building', x: 790, y: 14, w: 210, h: 126, floors: 3, bays: 4 },
    { k: 'building', x: 1010, y: 28, w: 180, h: 112, c: 'stone', floors: 2, bays: 3 },
    // the ground shows itself long before you reach it
    { k: 'pylon', x: 1290, y: 140, h: 132 },
    { k: 'terrace', x: 1200, y: 60, w: 200, h: 80, rows: 5 },
    { k: 'fill', x: 0, y: 140, w: 1400, h: 60, c: 'concrete' },
    { k: 'road', x: 0, y: 200, w: 1400, h: 90 },
    { k: 'fill', x: 0, y: 288, w: 1400, h: 52, c: 'concrete' },
    { k: 'wall', x: 120, y: 292, w: 240, h: 44 },
    { k: 'graffiti', x: 146, y: 300, w: 130, h: 28 },
    { k: 'wall', x: 700, y: 292, w: 300, h: 44, c: 'stone' },
    { k: 'graffiti', x: 730, y: 300, w: 160, h: 28, c: 'redDeep' },
    { k: 'car', x: 240, y: 214, w: 96, h: 40, c: 'carCream' },
    { k: 'car', x: 640, y: 218, w: 92, h: 40, c: 'carRed' },
    { k: 'car', x: 1060, y: 212, w: 96, h: 40, c: 'carBlue' },
    // crowd density climbs east — the scene's whole job (brief §13)
    { k: 'crowd', x: 200, y: 160, w: 260, h: 26, n: 5 },
    { k: 'crowd', x: 500, y: 158, w: 300, h: 30, n: 11 },
    { k: 'crowd', x: 820, y: 156, w: 320, h: 32, n: 20 },
    { k: 'crowd', x: 1100, y: 152, w: 280, h: 38, n: 30 },
    { k: 'crowd', x: 900, y: 300, w: 420, h: 30, n: 18 },
  ],
  solids: [
    { x: 0, y: 0, w: 1400, h: 140 },
    { x: 0, y: 0, w: 8, h: 340 },
    { x: 0, y: 332, w: 1400, h: 8 },
    { x: 120, y: 292, w: 240, h: 44 },
    { x: 700, y: 292, w: 300, h: 44 },
    { x: 240, y: 226, w: 96, h: 30 },
    { x: 640, y: 230, w: 92, h: 30 },
    { x: 1060, y: 224, w: 96, h: 30 },
  ],
  spawns: { fromStreet: { x: 30, y: 176 }, fromGround: { x: 1340, y: 176 } },
  npcs: [
    { id: 'fan1', figure: 'fan', x: 420, y: 172, facing: 'right', nameHe: 'אוהד', talk: 'route-fan' },
    { id: 'fan2', figure: 'fanTall', x: 880, y: 176, facing: 'right', nameHe: 'אוהד ותיק', talk: 'route-veteran' },
  ],
  props: [{ id: 'banner', x: 730, y: 328, w: 160, h: 14, act: 'route-banner' }],
  exits: [
    { id: 'back', x: 0, y: 148, w: 12, h: 90, to: 'street', spawn: 'fromRoute' },
    { id: 'ground', x: 1388, y: 146, w: 12, h: 120, to: 'bloomfield-outside', spawn: 'fromRoute' },
  ],
}

const outside: MapDef = {
  id: 'bloomfield-outside',
  titleHe: 'בלומפילד — מבחוץ',
  width: 1160,
  height: 470,
  base: 'sky',
  zoom: 1.9,
  layers: [
    { k: 'fill', x: 0, y: 0, w: 1160, h: 470, c: 'concrete' },
    { k: 'fill', x: 0, y: 0, w: 1160, h: 240, c: 'skyDeep' },
    // The ground itself: a long concrete bowl with the red band across it, and the
    // lattice towers that are the thing you see from the neighbourhood.
    { k: 'terrace', x: 40, y: 40, w: 1080, h: 150, rows: 7 },
    { k: 'fill', x: 40, y: 118, w: 1080, h: 30, c: 'red' },
    { k: 'fill', x: 60, y: 124, w: 200, h: 18, c: 'sheet', a: 0.9 },
    { k: 'fill', x: 300, y: 124, w: 150, h: 18, c: 'sheet', a: 0.9 },
    { k: 'fill', x: 700, y: 124, w: 240, h: 18, c: 'sheet', a: 0.9 },
    { k: 'pylon', x: 140, y: 190, h: 150 },
    { k: 'pylon', x: 1020, y: 190, h: 150 },
    { k: 'fill', x: 40, y: 190, w: 1080, h: 34, c: 'concreteDark' },
    { k: 'speckle', x: 0, y: 224, w: 1160, h: 246, c: 'concreteDark', n: 220 },
    // the fence and the gates
    { k: 'fence', x: 40, y: 236, w: 300, h: 44 },
    { k: 'fill', x: 340, y: 228, w: 90, h: 52, c: 'rail' },
    { k: 'fill', x: 352, y: 240, w: 66, h: 40, c: 'ink' },
    { k: 'sign', x: 344, y: 206, w: 82, h: 22, c: 'red', words: 2 },
    { k: 'fence', x: 430, y: 236, w: 250, h: 44 },
    { k: 'fill', x: 680, y: 228, w: 90, h: 52, c: 'rail' },
    { k: 'fill', x: 692, y: 240, w: 66, h: 40, c: 'ink' },
    { k: 'sign', x: 684, y: 206, w: 82, h: 22, c: 'red', words: 2 },
    { k: 'fence', x: 770, y: 236, w: 350, h: 44 },
    // the ticket hut
    { k: 'furniture', x: 860, y: 300, w: 110, h: 60, c: 'plaster', top: 'roof' },
    { k: 'fill', x: 880, y: 322, w: 70, h: 26, c: 'ink' },
    { k: 'sign', x: 866, y: 286, w: 98, h: 18, c: 'navy', words: 2 },
    // the forecourt fills up
    { k: 'crowd', x: 60, y: 320, w: 700, h: 110, n: 34 },
    { k: 'crowd', x: 240, y: 400, w: 620, h: 60, n: 18 },
    { k: 'car', x: 1000, y: 380, w: 96, h: 40, c: 'carGreen' },
    { k: 'car', x: 1050, y: 300, w: 92, h: 40, c: 'carCream' },
  ],
  solids: [
    { x: 0, y: 0, w: 1160, h: 280 },
    { x: 0, y: 0, w: 8, h: 470 },
    { x: 1152, y: 0, w: 8, h: 470 },
    { x: 0, y: 462, w: 1160, h: 8 },
    { x: 860, y: 300, w: 110, h: 60 },
    { x: 1000, y: 392, w: 96, h: 30 },
    { x: 1050, y: 312, w: 92, h: 30 },
  ],
  spawns: { fromRoute: { x: 60, y: 340 }, fromTunnel: { x: 700, y: 300 } },
  npcs: [
    {
      id: 'steward',
      figure: 'fanTall',
      x: 700,
      y: 296,
      facing: 'down',
      nameHe: 'סדרן',
      talk: 'steward',
    },
    {
      id: 'ticket',
      figure: 'kiosk',
      x: 916,
      y: 366,
      facing: 'down',
      nameHe: 'הקופאי',
      talk: 'ticket-window',
    },
    {
      id: 'ofir-ground',
      figure: 'ofir',
      x: 420,
      y: 330,
      facing: 'down',
      nameHe: 'אופיר',
      talk: 'ofir-ground',
      when: { bond: { who: 'ofir', min: 40 } },
    },
    {
      id: 'veteran',
      figure: 'fan',
      x: 240,
      y: 300,
      facing: 'down',
      nameHe: 'אוהד ותיק',
      talk: 'gate-veteran',
    },
  ],
  props: [
    { id: 'gate7', x: 340, y: 280, w: 90, h: 16, act: 'gate-seven' },
    { id: 'wall-fence', x: 770, y: 280, w: 350, h: 14, act: 'fence-look' },
  ],
  exits: [
    { id: 'back', x: 0, y: 300, w: 12, h: 120, to: 'route', spawn: 'fromGround' },
    {
      id: 'in',
      x: 680,
      y: 276,
      w: 90,
      h: 16,
      to: 'bloomfield-tunnel',
      spawn: 'start',
      when: { flag: 'entry:granted' },
      manual: true,
    },
  ],
}

const tunnel: MapDef = {
  id: 'bloomfield-tunnel',
  titleHe: 'המנהרה',
  width: 620,
  height: 200,
  base: 'night',
  zoom: 3.2,
  layers: [
    { k: 'fill', x: 0, y: 0, w: 620, h: 200, c: 'ink' },
    { k: 'fill', x: 0, y: 40, w: 620, h: 120, c: 'concreteDark' },
    { k: 'speckle', x: 0, y: 40, w: 620, h: 120, c: 'asphalt', n: 160 },
    { k: 'fill', x: 0, y: 34, w: 620, h: 8, c: 'asphalt' },
    { k: 'fill', x: 0, y: 158, w: 620, h: 8, c: 'asphalt' },
    { k: 'shade', x: 0, y: 0, w: 620, h: 200, a: 0.5 },
    { k: 'glow', x: 130, y: 60, r: 30, a: 0.16 },
    { k: 'glow', x: 330, y: 60, r: 30, a: 0.16 },
    // the light at the end, getting bigger as you walk
    { k: 'fill', x: 566, y: 52, w: 54, h: 96, c: 'sky' },
    { k: 'glow', x: 596, y: 100, r: 90, c: 'lamp', a: 0.4 },
  ],
  solids: [
    { x: 0, y: 0, w: 620, h: 44 },
    { x: 0, y: 156, w: 620, h: 44 },
    { x: 0, y: 0, w: 8, h: 200 },
  ],
  spawns: { start: { x: 40, y: 100 } },
  npcs: [],
  props: [],
  exits: [
    { id: 'up', x: 600, y: 50, w: 20, h: 100, to: 'bloomfield-inside', spawn: 'start' },
    { id: 'back', x: 0, y: 50, w: 10, h: 100, to: 'bloomfield-outside', spawn: 'fromTunnel' },
  ],
}

const inside: MapDef = {
  id: 'bloomfield-inside',
  titleHe: 'בלומפילד',
  width: 1200,
  height: 640,
  base: 'sky',
  zoom: 1.7,
  layers: [
    { k: 'fill', x: 0, y: 0, w: 1200, h: 640, c: 'concrete' },
    { k: 'fill', x: 0, y: 0, w: 1200, h: 120, c: 'sky' },
    // the far side of the ground, full
    { k: 'terrace', x: 0, y: 40, w: 1200, h: 150, rows: 9, full: true },
    { k: 'fill', x: 0, y: 186, w: 1200, h: 14, c: 'red' },
    { k: 'fence', x: 0, y: 200, w: 1200, h: 26 },
    { k: 'pylon', x: 120, y: 40, h: 40 },
    { k: 'pylon', x: 1080, y: 40, h: 40 },
    // the pitch
    { k: 'pitch', x: 40, y: 236, w: 1120, h: 260 },
    { k: 'goal', x: 40, y: 330, w: 16, h: 76 },
    { k: 'goal', x: 1144, y: 330, w: 16, h: 76 },
    // the near terrace, which is where the child is standing
    { k: 'fence', x: 0, y: 500, w: 1200, h: 24 },
    { k: 'terrace', x: 0, y: 524, w: 1200, h: 116, rows: 5, full: false },
  ],
  extra: [
    {
      when: { notFlag: 'match:over' },
      layers: [
        { k: 'crowd', x: 20, y: 540, w: 1160, h: 84, n: 60 },
        { k: 'crowd', x: 200, y: 300, w: 800, h: 140, n: 12 },
      ],
    },
    {
      // The whistle goes and the pitch is not a pitch any more.
      when: { flag: 'match:over' },
      layers: [
        { k: 'crowd', x: 20, y: 540, w: 1160, h: 84, n: 40 },
        { k: 'crowd', x: 60, y: 250, w: 1080, h: 240, n: 110 },
      ],
    },
  ],
  solids: [
    { x: 0, y: 0, w: 1200, h: 524 },
    { x: 0, y: 0, w: 8, h: 640 },
    { x: 1192, y: 0, w: 8, h: 640 },
    { x: 0, y: 632, w: 1200, h: 8 },
  ],
  spawns: { start: { x: 60, y: 580 } },
  npcs: [
    {
      id: 'kobi-crowd',
      figure: 'kobi',
      x: 880,
      y: 566,
      facing: 'down',
      nameHe: 'קובי',
      talk: 'kobi-found',
      when: { flag: 'match:over' },
    },
    { id: 'terrace-fan-a', figure: 'fan', x: 300, y: 576, facing: 'up', nameHe: 'אוהד', talk: 'terrace-fan' },
    { id: 'terrace-fan-b', figure: 'fanTall', x: 620, y: 590, facing: 'up', nameHe: 'אוהד', talk: 'terrace-fan' },
  ],
  props: [{ id: 'rail', x: 0, y: 500, w: 1200, h: 22, act: 'terrace-rail' }],
  exits: [],
}

export const MAPS: Record<Exclude<LocationId, 'prologue-1972'>, MapDef> = {
  bedroom,
  home,
  street,
  kiosk,
  pitch,
  route,
  'bloomfield-outside': outside,
  'bloomfield-tunnel': tunnel,
  'bloomfield-inside': inside,
}

export function mapFor(id: LocationId): MapDef {
  return MAPS[id as Exclude<LocationId, 'prologue-1972'>] ?? bedroom
}
