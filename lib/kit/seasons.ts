import 'server-only'

import { archive } from '@/lib/game/archive'
import { kitAssemblySeasons } from './assembly'
import type { KitVariant } from './identity'
import { DEFAULT_SPEC, type CollarId, type KitColour, type KitSpec, type NamesetId, type PatternId, type SleeveId } from './spec'

export type SeasonKit = { seasonLabel:string; variant:KitVariant; noteHe:string; spec:KitSpec; sourceTitle:string; sourceUrl:string|null; confidence:number }

function crestForSeason(seasonLabel:string):string|null{
  const year=Number(seasonLabel.slice(0,4)); if(!Number.isFinite(year))return null
  const containing=archive.crests.filter((row)=>year>=row.fromYear&&(row.toYear===null||year<=row.toYear)).sort((a,b)=>b.fromYear-a.fromYear)
  const withImage=containing.find((row)=>row.imageKey!==null); if(withImage)return withImage.imageKey
  return archive.crests.filter((row)=>row.fromYear<=year&&row.imageKey!==null).sort((a,b)=>b.fromYear-a.fromYear)[0]?.imageKey??null
}
function archiveSeasonKits():SeasonKit[]{
  return archive.kitDesigns.filter((row)=>row.variant==='home'||row.variant==='away'||row.variant==='third').map((row)=>{
    const variant=row.variant as KitVariant
    return {seasonLabel:row.seasonLabel,variant,noteHe:row.noteHe,sourceTitle:row.sourceTitle,sourceUrl:row.sourceUrl,confidence:row.confidence,spec:{...DEFAULT_SPEC,seasonLabel:row.seasonLabel,variant,base:row.base as KitColour,pattern:row.pattern as PatternId,patternInk:row.patternInk as KitColour,sleeves:row.sleeves as SleeveId,sleeveInk:row.sleeveInk as KitColour,collar:row.collar as CollarId,collarInk:row.collarInk as KitColour,sponsorHe:row.sponsorHe,makerHe:row.makerHe,nameset:DEFAULT_SPEC.nameset as NamesetId,number:null,shorts:row.shorts as KitColour,socks:row.socks as KitColour,crestKey:crestForSeason(row.seasonLabel)}}
  })
}
function assemblySeasonKits():SeasonKit[]{return kitAssemblySeasons().map((row)=>({seasonLabel:row.seasonLabel,variant:row.variant,noteHe:row.noteHe,sourceTitle:row.sourceTitle,sourceUrl:row.sourceUrl,confidence:row.confidence,spec:{...DEFAULT_SPEC,...row.spec,seasonLabel:row.seasonLabel,variant:row.variant,crestKey:row.spec.crestKey??crestForSeason(row.seasonLabel),number:null}}))}
export function seasonKits():SeasonKit[]{const merged=new Map<string,SeasonKit>();for(const kit of archiveSeasonKits())merged.set(`${kit.seasonLabel}:${kit.variant}`,kit);for(const kit of assemblySeasonKits())merged.set(`${kit.seasonLabel}:${kit.variant}`,kit);return [...merged.values()]}
export function homeKits():SeasonKit[]{return seasonKits().filter((kit)=>kit.variant==='home').sort((a,b)=>b.seasonLabel.localeCompare(a.seasonLabel))}
export function kitForSeason(seasonLabel:string,variant:KitVariant='home'):SeasonKit|null{return seasonKits().find((kit)=>kit.seasonLabel===seasonLabel&&kit.variant===variant)??null}
