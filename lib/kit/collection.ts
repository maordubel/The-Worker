'use client'

const KEY = 'worker.kits.v1'

export type BuiltKit = {
  seasonLabel: string
  variant: 'home' | 'away' | 'third'
  firstBuiltOn: string
  lastBuiltOn: string
  bestParts: number
  /** Actual Gate 4 category count (V2 has seven); bestParts stays 0–5 for the legacy collection card. */
  bestCategories: number
  bestScore: number
  fewestHints: number
  times: number
}
export type Collection = Record<string, BuiltKit>
export function kitKey(seasonLabel:string,variant:string):string{return `${seasonLabel}|${variant}`}
export interface CollectionStore{readonly remote:boolean;read():Promise<Collection>;record(entry:{seasonLabel:string;variant:BuiltKit['variant'];parts:number;score?:number;hintsUsed?:number}):Promise<void>;clear():Promise<void>}
export class LocalCollectionStore implements CollectionStore{
 readonly remote=false
 async read():Promise<Collection>{try{const raw=window.localStorage.getItem(KEY);if(!raw)return{};const parsed:unknown=JSON.parse(raw);if(typeof parsed!=='object'||parsed===null)return{};const out:Collection={};for(const [key,value] of Object.entries(parsed as Record<string,unknown>)){const row=value as Partial<BuiltKit>;if(typeof row?.seasonLabel!=='string')continue;const first=row.firstBuiltOn??'';out[key]={seasonLabel:row.seasonLabel,variant:(row.variant??'home') as BuiltKit['variant'],firstBuiltOn:first,lastBuiltOn:row.lastBuiltOn??first,bestParts:typeof row.bestParts==='number'?row.bestParts:0,bestCategories:typeof row.bestCategories==='number'?row.bestCategories:(typeof row.bestParts==='number'?row.bestParts:0),bestScore:typeof row.bestScore==='number'?row.bestScore:0,fewestHints:typeof row.fewestHints==='number'?row.fewestHints:99,times:typeof row.times==='number'?row.times:1}}return out}catch{return{}}}
 async record(entry:{seasonLabel:string;variant:BuiltKit['variant'];parts:number;score?:number;hintsUsed?:number}):Promise<void>{try{const current=await this.read();const key=kitKey(entry.seasonLabel,entry.variant);const existing=current[key];const today=new Date().toISOString().slice(0,10);const score=entry.score??0;const categories=entry.parts;const legacyParts=categories>=7?5:Math.min(4,categories);const hints=entry.hintsUsed??99;const next:BuiltKit=existing?{...existing,lastBuiltOn:today,bestParts:Math.max(existing.bestParts,legacyParts),bestCategories:Math.max(existing.bestCategories,categories),bestScore:Math.max(existing.bestScore,score),fewestHints:Math.min(existing.fewestHints,hints),times:existing.times+1}:{seasonLabel:entry.seasonLabel,variant:entry.variant,firstBuiltOn:today,lastBuiltOn:today,bestParts:legacyParts,bestCategories:categories,bestScore:score,fewestHints:hints,times:1};window.localStorage.setItem(KEY,JSON.stringify({...current,[key]:next}))}catch{}}
 async clear():Promise<void>{try{window.localStorage.removeItem(KEY)}catch{}}
}
export function activeCollection():CollectionStore{return new LocalCollectionStore()}
