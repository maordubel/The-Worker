import type { KitPlacement } from './assembly'

export type KitBodyTemplateId =
  | 'retro-70s-boxy'
  | 'retro-80s-long'
  | 'retro-90s-boxy'
  | 'early-2000s-athletic'
  | '2010s-fitted'
  | 'modern-athletic'

export type KitBodyTemplate = {
  id: KitBodyTemplateId
  labelHe: string
  yearFrom: number
  yearTo: number
  viewBox: string
  bodyPath: string
  leftSleevePath: string
  rightSleevePath: string
  leftSleeveSeam: string
  rightSleeveSeam: string
  hemPath: string
  cuffLeftPath: string
  cuffRightPath: string
  neck: { cx: number; cy: number; width: number; depth: number }
  anchors: Record<'maker' | 'crest' | 'sponsor', KitPlacement>
  /** where a raglan/yoke construction meets the body */
  shoulderPanelLeft: string
  shoulderPanelRight: string
}

/**
 * Canonical garment anatomy. These are NOT season designs: they are sewing silhouettes.
 * Historical surface details (pattern, colours, marks) are layered on top by KitEngine.
 * Keeping anatomy separate is the key to avoiding one generic T-shirt for 50 years.
 */
export const BODY_TEMPLATES: Record<KitBodyTemplateId, KitBodyTemplate> = {
  'retro-70s-boxy': {
    id: 'retro-70s-boxy', labelHe: 'גזרת שנות ה־70', yearFrom: 1949, yearTo: 1982,
    viewBox: '0 0 360 420',
    bodyPath: 'M118 62C135 55 151 52 166 51C171 69 189 77 180 77C171 77 189 69 194 51C209 52 225 55 242 62L252 122C248 178 247 280 252 374C221 388 139 388 108 374C113 280 112 178 108 122Z',
    leftSleevePath: 'M118 62C92 68 66 84 48 106L18 178C31 190 48 198 67 202L97 136L108 122Z',
    rightSleevePath: 'M242 62C268 68 294 84 312 106L342 178C329 190 312 198 293 202L263 136L252 122Z',
    leftSleeveSeam: 'M118 62C112 80 109 100 108 122', rightSleeveSeam: 'M242 62C248 80 251 100 252 122',
    hemPath: 'M108 364C139 376 221 376 252 364',
    cuffLeftPath: 'M22 169C35 182 50 188 70 192', cuffRightPath: 'M338 169C325 182 310 188 290 192',
    neck: { cx: 180, cy: 58, width: 66, depth: 25 },
    anchors: { maker: { x: 31, y: 21, w: 11, h: 9 }, crest: { x: 58, y: 20, w: 14, h: 16 }, sponsor: { x: 26, y: 45, w: 48, h: 15 } },
    shoulderPanelLeft: 'M118 62C105 69 97 83 92 103L108 122C111 95 114 76 118 62Z',
    shoulderPanelRight: 'M242 62C255 69 263 83 268 103L252 122C249 95 246 76 242 62Z',
  },
  'retro-80s-long': {
    id: 'retro-80s-long', labelHe: 'גזרת אמצע שנות ה־80', yearFrom: 1983, yearTo: 1989,
    viewBox: '0 0 360 420',
    bodyPath: 'M116 58C132 53 149 50 165 49C170 68 190 78 180 78C170 78 190 68 195 49C211 50 228 53 244 58L254 128C250 190 249 289 254 380C218 393 142 393 106 380C111 289 110 190 106 128Z',
    leftSleevePath: 'M116 58C93 62 69 75 52 94L18 160L24 314C39 321 53 321 68 316L80 196L102 139L106 128Z',
    rightSleevePath: 'M244 58C267 62 291 75 308 94L342 160L336 314C321 321 307 321 292 316L280 196L258 139L254 128Z',
    leftSleeveSeam: 'M116 58C110 78 107 101 106 128', rightSleeveSeam: 'M244 58C250 78 253 101 254 128',
    hemPath: 'M106 369C142 382 218 382 254 369',
    cuffLeftPath: 'M23 300C38 306 53 307 69 302', cuffRightPath: 'M337 300C322 306 307 307 291 302',
    neck: { cx: 180, cy: 56, width: 72, depth: 30 },
    anchors: { maker: { x: 30, y: 22, w: 11, h: 9 }, crest: { x: 58, y: 20, w: 15, h: 17 }, sponsor: { x: 22, y: 42, w: 56, h: 25 } },
    shoulderPanelLeft: 'M116 58C98 65 86 82 79 108L106 128C108 98 112 76 116 58Z',
    shoulderPanelRight: 'M244 58C262 65 274 82 281 108L254 128C252 98 248 76 244 58Z',
  },
  'retro-90s-boxy': {
    id: 'retro-90s-boxy', labelHe: 'גזרת שנות ה־90', yearFrom: 1990, yearTo: 1999,
    viewBox: '0 0 360 420',
    bodyPath: 'M111 60C129 54 149 51 165 50C171 68 190 77 180 77C170 77 189 68 195 50C211 51 231 54 249 60L260 124C257 181 257 286 262 377C224 392 136 392 98 377C103 286 103 181 100 124Z',
    leftSleevePath: 'M115 60C84 66 58 82 39 104L10 168C25 182 43 190 64 194L96 130L100 124Z',
    rightSleevePath: 'M249 60C276 66 302 82 321 104L350 168C335 182 317 190 296 194L264 130L260 124Z',
    leftSleeveSeam: 'M111 60C105 78 101 99 100 124', rightSleeveSeam: 'M249 60C255 78 259 99 260 124',
    hemPath: 'M99 365C136 379 224 379 261 365',
    cuffLeftPath: 'M14 159C29 173 46 181 67 185', cuffRightPath: 'M346 159C331 173 314 181 293 185',
    neck: { cx: 180, cy: 58, width: 72, depth: 27 },
    anchors: { maker: { x: 29, y: 21, w: 13, h: 10 }, crest: { x: 58, y: 20, w: 15, h: 17 }, sponsor: { x: 27, y: 43, w: 46, h: 18 } },
    shoulderPanelLeft: 'M111 60C96 66 84 82 78 106L100 124C102 96 106 75 111 60Z',
    shoulderPanelRight: 'M249 60C264 66 276 82 282 106L260 124C258 96 254 75 249 60Z',
  },
  'early-2000s-athletic': {
    id: 'early-2000s-athletic', labelHe: 'גזרת תחילת שנות ה־2000', yearFrom: 2000, yearTo: 2007,
    viewBox: '0 0 360 420',
    bodyPath: 'M116 58C133 52 150 50 166 49C172 68 189 76 180 76C171 76 188 68 194 49C210 50 227 52 244 58L254 118C247 182 244 285 249 376C218 390 142 390 111 376C116 285 113 182 106 118Z',
    leftSleevePath: 'M116 58C92 64 70 79 54 99L27 153C39 164 54 171 72 174L102 124L106 118Z',
    rightSleevePath: 'M244 58C268 64 290 79 306 99L333 153C321 164 306 171 288 174L258 124L254 118Z',
    leftSleeveSeam: 'M116 58C111 75 108 95 106 118', rightSleeveSeam: 'M244 58C249 75 252 95 254 118',
    hemPath: 'M111 365C142 378 218 378 249 365',
    cuffLeftPath: 'M31 145C43 156 57 162 74 165', cuffRightPath: 'M329 145C317 156 303 162 286 165',
    neck: { cx: 180, cy: 56, width: 68, depth: 26 },
    anchors: { maker: { x: 30, y: 22, w: 12, h: 9 }, crest: { x: 59, y: 20, w: 15, h: 17 }, sponsor: { x: 27, y: 44, w: 46, h: 17 } },
    shoulderPanelLeft: 'M116 58C101 64 89 78 82 99L106 118C108 92 112 73 116 58Z',
    shoulderPanelRight: 'M244 58C259 64 271 78 278 99L254 118C252 92 248 73 244 58Z',
  },
  '2010s-fitted': {
    id: '2010s-fitted', labelHe: 'גזרה צמודה 2008–2016', yearFrom: 2008, yearTo: 2016,
    viewBox: '0 0 360 420',
    bodyPath: 'M120 56C135 51 151 49 166 48C172 66 188 74 180 74C172 74 188 66 194 48C209 49 225 51 240 56L250 112C241 180 237 281 242 374C213 387 147 387 118 374C123 281 119 180 110 112Z',
    leftSleevePath: 'M120 56C97 61 76 75 61 94L38 145C49 155 62 161 77 164L106 117L110 112Z',
    rightSleevePath: 'M240 56C263 61 284 75 299 94L322 145C311 155 298 161 283 164L254 117L250 112Z',
    leftSleeveSeam: 'M120 56C115 72 112 91 110 112', rightSleeveSeam: 'M240 56C245 72 248 91 250 112',
    hemPath: 'M118 364C147 376 213 376 242 364',
    cuffLeftPath: 'M42 137C53 147 66 153 80 155', cuffRightPath: 'M318 137C307 147 294 153 280 155',
    neck: { cx: 180, cy: 55, width: 64, depth: 24 },
    anchors: { maker: { x: 28.5, y: 22, w: 14, h: 10 }, crest: { x: 59, y: 20, w: 15, h: 17 }, sponsor: { x: 27, y: 44, w: 46, h: 18 } },
    shoulderPanelLeft: 'M120 56C104 62 92 76 85 97L110 112C112 89 116 70 120 56Z',
    shoulderPanelRight: 'M240 56C256 62 268 76 275 97L250 112C248 89 244 70 240 56Z',
  },
  'modern-athletic': {
    id: 'modern-athletic', labelHe: 'גזרה מודרנית', yearFrom: 2017, yearTo: 2100,
    viewBox: '0 0 360 420',
    bodyPath: 'M123 55C138 50 153 48 167 48C173 64 187 72 180 72C173 72 187 64 193 48C207 48 222 50 237 55L247 108C238 174 235 278 240 373C212 385 148 385 120 373C125 278 122 174 113 108Z',
    leftSleevePath: 'M123 55C101 60 81 73 67 91L45 137C55 146 67 152 81 155L109 113L113 108Z',
    rightSleevePath: 'M237 55C259 60 279 73 293 91L315 137C305 146 293 152 279 155L251 113L247 108Z',
    leftSleeveSeam: 'M123 55C118 70 115 88 113 108', rightSleeveSeam: 'M237 55C242 70 245 88 247 108',
    hemPath: 'M120 363C148 374 212 374 240 363',
    cuffLeftPath: 'M49 130C59 139 70 145 84 147', cuffRightPath: 'M311 130C301 139 290 145 276 147',
    neck: { cx: 180, cy: 54, width: 62, depth: 22 },
    anchors: { maker: { x: 30, y: 21, w: 12, h: 9 }, crest: { x: 59, y: 19, w: 15, h: 17 }, sponsor: { x: 29, y: 43, w: 42, h: 16 } },
    shoulderPanelLeft: 'M123 55C108 60 96 73 89 92L113 108C115 86 119 68 123 55Z',
    shoulderPanelRight: 'M237 55C252 60 264 73 271 92L247 108C245 86 241 68 237 55Z',
  },
}

const SEASON_TEMPLATE_OVERRIDES: Record<string, KitBodyTemplateId> = {
  '1985/86': 'retro-80s-long',
  '2009/10': '2010s-fitted',
}

export function bodyTemplateForSeason(seasonLabel: string): KitBodyTemplate {
  const override = SEASON_TEMPLATE_OVERRIDES[seasonLabel]
  if (override) return BODY_TEMPLATES[override]
  const year = Number(seasonLabel.slice(0, 4))
  if (!Number.isFinite(year)) return BODY_TEMPLATES['modern-athletic']
  return Object.values(BODY_TEMPLATES).find((row) => year >= row.yearFrom && year <= row.yearTo) ?? BODY_TEMPLATES['modern-athletic']
}
