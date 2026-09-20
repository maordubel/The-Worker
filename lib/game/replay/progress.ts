'use client'

const KEY='worker.replayProgress.v1'
export type ReplayProgress={bestScore:number;bestSequence:number;bestContinuity:number;replays:number;completed:boolean;updatedOn:string}
export type ReplayProgressMap=Record<string,ReplayProgress>
export interface ReplayProgressStore{readonly remote:boolean;read():Promise<ReplayProgressMap>;record(entry:{goalKey:string;score:number;sequence:number;continuity:number}):Promise<void>}
export class LocalReplayProgressStore implements ReplayProgressStore{
 readonly remote=false
 async read():Promise<ReplayProgressMap>{try{const raw=window.localStorage.getItem(KEY);if(!raw)return{};const parsed:unknown=JSON.parse(raw);return typeof parsed==='object'&&parsed!==null?parsed as ReplayProgressMap:{}}catch{return{}}}
 async record(entry:{goalKey:string;score:number;sequence:number;continuity:number}):Promise<void>{try{const rows=await this.read();const old=rows[entry.goalKey];rows[entry.goalKey]={bestScore:Math.max(old?.bestScore??0,entry.score),bestSequence:Math.max(old?.bestSequence??0,entry.sequence),bestContinuity:Math.max(old?.bestContinuity??0,entry.continuity),replays:(old?.replays??0)+1,completed:true,updatedOn:new Date().toISOString()};window.localStorage.setItem(KEY,JSON.stringify(rows))}catch{}}
}
export function activeReplayProgress():ReplayProgressStore{return new LocalReplayProgressStore()}
