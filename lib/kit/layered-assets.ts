export type LayeredKitStep = 'body' | 'construction' | 'crest' | 'maker' | 'sponsor'

export type LayerAsset = {
  id: string
  labelHe: string
  src?: string
  previewSrc?: string
  placement?: { x: number; y: number; w: number; h: number }
  filter?: string
}

export const V13_2009_10 = {
  seasonLabel: '2009/10',
  variant: 'home' as const,
  baseSrc: '/kits/knowledge-v13/base-red-realistic.png',
  revealSrc: '/kits/knowledge-v13/reveal-real-2009-10.png',
  badgeSrc: '/kits/knowledge-v13/badge-cup-clean.png',
  badgePlacement: { x: 25.5, y: 18.5, w: 12.7, h: 11.8 },
  steps: {
    body: [
      { id: 'solid', labelHe: 'חלק' },
      { id: 'vertical-stripes', labelHe: 'פסים', src: '/kits/knowledge-v13/pattern-vertical-stripes.png' },
      { id: 'tonal-hoops', labelHe: 'חישוקים', src: '/kits/knowledge-v13/pattern-tonal-hoops.png' },
    ],
    construction: [
      { id: 'side-panel', labelHe: 'פאנלים לבנים', src: '/kits/knowledge-v13/construction-2009-10.png' },
      { id: 'plain-crew', labelHe: 'עגול נקי', src: '/kits/knowledge-v13/construction-plain-crew.png' },
      { id: 'v-neck', labelHe: 'וי לבן', src: '/kits/knowledge-v13/construction-vneck-white.png' },
    ],
    crest: [
      { id: 'circle-current', labelHe: 'עגול · כוכבים', src: '/kits/knowledge-v13/crest-circle-1923.png', placement: { x: 57.1, y: 21.4, w: 15.5, h: 15.2 } },
      { id: 'circle-1927', labelHe: 'עגול · 1927', src: '/kits/knowledge-v13/crest-circle-1927.svg', placement: { x: 57.1, y: 21.4, w: 15.5, h: 15.2 } },
      { id: 'keter', labelHe: 'תקופת כתר', src: '/kits/knowledge-v13/crest-keter.svg', placement: { x: 57.1, y: 21.4, w: 15.5, h: 15.2 } },
    ],
    maker: [
      { id: 'umbro', labelHe: 'Umbro', src: '/kits/knowledge-v13/maker-umbro.svg', previewSrc: '/kits/knowledge-v13/maker-umbro.png', placement: { x: 29.0, y: 25.0, w: 11.8, h: 7.0 } },
      { id: 'puma', labelHe: 'Puma', src: '/kits/knowledge-v13/maker-puma.png', placement: { x: 29.0, y: 25.0, w: 11.8, h: 7.0 }, filter: 'brightness(0) invert(1)' },
      { id: 'macron', labelHe: 'Macron', src: '/kits/knowledge-v13/maker-macron.png', placement: { x: 29.0, y: 25.0, w: 13.5, h: 6.5 }, filter: 'brightness(0) invert(1)' },
    ],
    sponsor: [
      { id: 'subaru', labelHe: 'SUBARU', src: '/kits/knowledge-v13/sponsor-subaru.svg', previewSrc: '/kits/knowledge-v13/sponsor-subaru.png', placement: { x: 28.4, y: 34.3, w: 43.5, h: 18.0 } },
      { id: 'fujitsu', labelHe: 'FUJITSU', src: '/kits/knowledge-v13/sponsor-fujitsu.png', placement: { x: 29.0, y: 37.0, w: 42.0, h: 14.0 } },
      { id: 'arkia', labelHe: 'ארקיע', src: '/kits/knowledge-v13/sponsor-arkia.png', placement: { x: 29.0, y: 36.0, w: 42.0, h: 15.0 } },
    ],
  },
  truth: { body: 'solid', construction: 'side-panel', crest: 'circle-current', maker: 'umbro', sponsor: 'subaru' },
} as const
