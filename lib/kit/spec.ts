import type { KitVariant } from './identity'

export type KitColour = 'red' | 'cream' | 'ink' | 'paper' | 'navy' | 'deep' | 'concrete'
export const COLOUR_VAR: Record<KitColour, string> = {
  red: 'rgb(var(--red))', cream: 'rgb(var(--sheet))', ink: 'rgb(var(--ink))', paper: 'rgb(var(--paper))',
  navy: 'rgb(var(--sign))', deep: '#B81C14', concrete: 'rgb(var(--concrete))',
}
export const COLOUR_NAME: Record<KitColour, string> = {
  red: 'אדום', cream: 'שמנת', ink: 'שחור', paper: 'לבן', navy: 'נייבי', deep: 'אדום כהה', concrete: 'אפור בטון',
}
export type PatternId = 'solid'|'stripe-wide'|'pinstripe'|'hoop-tonal'|'jacquard'|'chevron'|'grid-tonal'|'sash'|'yoke-v'|'gradient'|'side-panel'|'halves'|'chest-band'|'quarters'|'diagonal'|'twin-stripe'|'shoulder-panel'
export const PATTERNS:{id:PatternId;he:string;latin:string}[]=[
{id:'solid',he:'חלק',latin:'SOLID'},{id:'stripe-wide',he:'פסים רחבים',latin:'STRIPE-WIDE'},{id:'pinstripe',he:'פסי שיער',latin:'PINSTRIPE'},{id:'hoop-tonal',he:'חישוקים',latin:'HOOP-TONAL'},{id:'jacquard',he:'מעוינים',latin:'JACQUARD'},{id:'chevron',he:'זיגזג',latin:'CHEVRON'},{id:'grid-tonal',he:'רשת טונלית',latin:'GRID-TONAL'},{id:'sash',he:'סאש',latin:'SASH'},{id:'yoke-v',he:'וי כתפיים',latin:'YOKE-V'},{id:'gradient',he:'מעבר',latin:'GRADIENT'},{id:'side-panel',he:'פאנלים צדדיים',latin:'SIDE-PANEL'},{id:'halves',he:'חצאים',latin:'HALVES'},{id:'chest-band',he:'פס חזה',latin:'CHEST-BAND'},{id:'quarters',he:'רבעים',latin:'QUARTERS'},{id:'diagonal',he:'אלכסונים דקים',latin:'DIAGONAL'},{id:'twin-stripe',he:'שני פסים',latin:'TWIN-STRIPE'},{id:'shoulder-panel',he:'כתפיים',latin:'SHOULDER-PANEL'}]
export type CollarId='crew'|'ringer'|'v-neck'|'polo'|'laced'
export const COLLARS:{id:CollarId;he:string}[]=[{id:'crew',he:'עגול'},{id:'ringer',he:'רינגר'},{id:'v-neck',he:'וי'},{id:'polo',he:'פולו'},{id:'laced',he:'שרוכים'}]
export type SleeveId='plain'|'raglan'|'cuff'|'shoulder-stripe'|'arc'
export const SLEEVES:{id:SleeveId;he:string}[]=[{id:'plain',he:'אחיד'},{id:'raglan',he:'רגלן ניגודי'},{id:'cuff',he:'חפת'},{id:'shoulder-stripe',he:'פסי כתף'},{id:'arc',he:'קשת'}]
export type NamesetId='block-solid'|'block-hollow'|'condensed'
export const NAMESETS:{id:NamesetId;he:string}[]=[{id:'block-solid',he:'מלא'},{id:'block-hollow',he:'חלול'},{id:'condensed',he:'קונדנסד'}]
export type KitSpec={seasonLabel:string;variant:KitVariant;base:KitColour;pattern:PatternId;patternInk:KitColour;sleeves:SleeveId;sleeveInk:KitColour;collar:CollarId;collarInk:KitColour;sponsorHe:string|null;makerHe:string|null;nameset:NamesetId;number:number|null;shorts:KitColour;socks:KitColour;crestKey:string|null}
export const DEFAULT_SPEC:KitSpec={seasonLabel:'1978/79',variant:'home',base:'red',pattern:'solid',patternInk:'cream',sleeves:'raglan',sleeveInk:'cream',collar:'crew',collarInk:'cream',sponsorHe:'אתא',makerHe:null,nameset:'block-solid',number:10,shorts:'cream',socks:'red',crestKey:'worker-hapoel'}
export const LAYERS=[{key:'base',he:'גוף'},{key:'pattern',he:'גזרה'},{key:'sleeves',he:'שרוולים'},{key:'collar',he:'צווארון'},{key:'crest',he:'סמל'},{key:'maker',he:'יצרן'},{key:'sponsor',he:'ספונסר'},{key:'nameset',he:'ערכת מספרים'}] as const
export type LayerKey=(typeof LAYERS)[number]['key']
export function compareSpecs(a:KitSpec,b:KitSpec):Record<LayerKey,boolean>{return{base:a.base===b.base,pattern:a.pattern===b.pattern&&a.patternInk===b.patternInk,sleeves:a.sleeves===b.sleeves&&a.sleeveInk===b.sleeveInk,collar:a.collar===b.collar&&a.collarInk===b.collarInk,crest:a.crestKey===b.crestKey,maker:a.makerHe===b.makerHe,sponsor:a.sponsorHe===b.sponsorHe,nameset:a.nameset===b.nameset}}
