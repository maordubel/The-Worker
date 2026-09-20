import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { createHash } from 'node:crypto'

type Row = Record<string, unknown>
type DatePrecision = 'day' | 'month' | 'year' | 'unknown'
type PreciseDate = { value: string; precision: DatePrecision; year?: number; month?: number; day?: number; raw?: string }
type SourceRef = { file: string; sourceTitle?: string; sourceUrl?: string | null }
type ShirtNumber = { number: number; season?: string; historical: boolean; source: SourceRef }
type Player = {
  id: string; displayName: string; aliases: string[]; normalizedNames: string[]
  positions?: string[]; years?: { from?: number; to?: number }
  birth?: { date?: PreciseDate; place?: string }
  declaredNationality?: string[]
  foreignSlotStatus: 'israeli' | 'foreign' | 'unknown'
  careerStats?: { appearances?: number; goals?: number; scope: string; source: SourceRef }
  archiveGoals?: { documentedGoals: number; complete: false; scope: string; source: SourceRef }
  shirtNumbers: ShirtNumber[]
  currentSquad?: { active: true; season?: string; number?: number; captain?: boolean; declaredNationality?: string[]; source: SourceRef }
  provenance: SourceRef[]
}
const ROOT='content/manual/'
const read=(file:string):any=>JSON.parse(readFileSync(ROOT+file,'utf8'))
const rows=(doc:any):Row[]=>Array.isArray(doc)?doc:(Array.isArray(doc?.records)?doc.records:Array.isArray(doc?.table)?doc.table:[])
export function normalizePlayerName(value:string):string{return value.normalize('NFKD').replace(/[\u0591-\u05C7]/g,'').replace(/[׳״'"’`._(),\-]/g,' ').replace(/\s+/g,' ').trim().toLowerCase()}
export function parsePreciseDate(value:unknown):PreciseDate|undefined{
 if(typeof value!=='string'||!value.trim())return undefined; const raw=value.trim(); let m:RegExpMatchArray|null
 if((m=raw.match(/^(\d{4})$/)))return{value:m[1]!,precision:'year',year:+m[1]!,raw}
 if((m=raw.match(/^(\d{1,2})[./](\d{4})$/)))return{value:`${m[2]!}-${m[1]!.padStart(2,'0')}`,precision:'month',year:+m[2]!,month:+m[1]!,raw}
 if((m=raw.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/)))return{value:`${m[3]!}-${m[2]!.padStart(2,'0')}-${m[1]!.padStart(2,'0')}`,precision:'day',year:+m[3]!,month:+m[2]!,day:+m[1]!,raw}
 if((m=raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)))return{value:raw,precision:'day',year:+m[1]!,month:+m[2]!,day:+m[3]!,raw}
 return{value:raw,precision:'unknown',raw}
}
const str=(r:Row,...keys:string[])=>{for(const k of keys){const v=r[k];if(typeof v==='string'&&v.trim())return v.trim()}return undefined}
const num=(r:Row,...keys:string[])=>{for(const k of keys){const v=r[k];if(typeof v==='number'&&Number.isFinite(v))return v;if(typeof v==='string'&&/^\d+$/.test(v))return +v}return undefined}
const source=(file:string,r?:Row):SourceRef=>({file,sourceTitle:r?str(r,'sourceTitle'):undefined,sourceUrl:r?str(r,'sourceUrl')??null:undefined})
const base=read('player-facts.json'); const map=new Map<string,Player>()
function ensure(name:string,file:string,row?:Row):Player{const key=normalizePlayerName(name);let p=map.get(key);if(!p){p={id:'player-'+createHash('sha1').update(key).digest('hex').slice(0,12),displayName:name,aliases:[],normalizedNames:[key],foreignSlotStatus:'unknown',shirtNumbers:[],provenance:[]};map.set(key,p)}const s=source(file,row);if(!p.provenance.some(x=>x.file===s.file))p.provenance.push(s);return p}
for(const r of rows(base)){const name=str(r,'personNameHe','personName');if(!name)continue;const p=ensure(name,'player-facts.json',r);const latin=str(r,'personNameLatin');if(latin&&!p.aliases.includes(latin)){p.aliases.push(latin);p.normalizedNames.push(normalizePlayerName(latin))}const origin=str(r,'origin');if(origin==='foreign'||origin==='israeli')p.foreignSlotStatus=origin;const pos=str(r,'position');if(pos)p.positions=[...new Set([...(p.positions??[]),pos])];p.years={from:num(r,'fromYear'),to:num(r,'toYear')}}
// Preserve the club's VikiHapoel foreign-slot classification as status, never as nationality.
for(const r of rows(read('player-facts-vikipoel.json'))){const name=str(r,'personNameHe');if(!name)continue;const p=ensure(name,'player-facts-vikipoel.json',r);const origin=str(r,'origin');if(origin==='foreign'||origin==='israeli')p.foreignSlotStatus=origin;const ps=Array.isArray(r.positions)?r.positions.filter(x=>typeof x==='string') as string[]:[];if(ps.length)p.positions=[...new Set([...(p.positions??[]),...ps])]}
// Enrich only from explicitly named fields. Birthplace never implies nationality.
for(const file of ['player-facts-wiki.json','player-facts-seasons.json']){for(const r of rows(read(file))){const name=str(r,'personNameHe','personName');if(!name)continue;const p=ensure(name,file,r);const date=parsePreciseDate(str(r,'birthDate','dateOfBirth','born'));const place=str(r,'birthPlace','birthplace','placeOfBirth');if(date||place)p.birth={...(p.birth??{}),...(date?{date}:{}),...(place?{place}: {})};const apps=num(r,'appearances','apps','matches');const goals=num(r,'careerGoals','goalsTotal','goals');if(apps!==undefined||goals!==undefined)p.careerStats={appearances:apps,goals,scope:'source-declared career/club stats; not match-scorer aggregation',source:source(file,r)}}}
for(const r of rows(read('shirt-numbers.json'))){const name=str(r,'personNameHe','personName');const n=num(r,'shirtNumber','number');if(!name||n===undefined)continue;const p=ensure(name,'shirt-numbers.json',r);const season=str(r,'seasonLabel','season');if(!p.shirtNumbers.some(x=>x.number===n&&x.season===season))p.shirtNumbers.push({number:n,season,historical:true,source:source('shirt-numbers.json',r)})}
const squadRows=rows(read('squads.json'));const currentSeason=[...new Set(squadRows.map(r=>str(r,'seasonLabel','season')).filter((x):x is string=>Boolean(x)))].sort().at(-1);for(const r of squadRows){const name=str(r,'personNameHe','personName');if(!name)continue;const p=ensure(name,'squads.json',r);const season=str(r,'seasonLabel','season');if(season!==currentSeason)continue;const nat=str(r,'nationalityHe','nationality');if(nat)p.declaredNationality=[...new Set([...(p.declaredNationality??[]),nat])];const number=num(r,'shirtNumber','number');p.currentSquad={active:true,season,number,captain:r.isCaptain===true,declaredNationality:nat?[nat]:undefined,source:source('squads.json',r)};if(number!==undefined&&!p.shirtNumbers.some(x=>x.number===number&&x.season===season))p.shirtNumbers.push({number,season,historical:false,source:source('squads.json',r)})}
// Match-scorer evidence is deliberately separate from career totals.
const scorerDoc=read('match-scorers.json'); const counts=new Map<string,number>();
function walk(v:any){if(Array.isArray(v)){for(const x of v)walk(x);return}if(!v||typeof v!=='object')return;const r=v as Row;const name=str(r,'personNameHe','scorerNameHe','scorerName','playerName');if(name){const key=normalizePlayerName(name);const amount=num(r,'goalCount','goals')??((r.minute!==undefined||r.matchId!==undefined)?1:0);if(amount>0)counts.set(key,(counts.get(key)??0)+amount)}for(const x of Object.values(v))if(x&&typeof x==='object')walk(x)}walk(scorerDoc)
for(const [key,count] of counts){const p=map.get(key);if(p)p.archiveGoals={documentedGoals:count,complete:false,scope:'documented match-scorer rows only; never a career total',source:source('match-scorers.json')}}
const players=[...map.values()].sort((a,b)=>a.displayName.localeCompare(b.displayName,'he'))
const out={schemaVersion:1,generatedAt:new Date().toISOString(),counts:{players:players.length,currentSquad:players.filter(p=>p.currentSquad).length,withCareerStats:players.filter(p=>p.careerStats).length,withArchiveGoals:players.filter(p=>p.archiveGoals).length,withShirtNumbers:players.filter(p=>p.shirtNumbers.length).length},players}
const outPath='content/generated/player-master.json';mkdirSync(dirname(outPath),{recursive:true});writeFileSync(outPath,JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out.counts))
