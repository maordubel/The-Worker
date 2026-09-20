import masterJson from '../../content/generated/player-master.json'
export type DatePrecision = 'day' | 'month' | 'year' | 'unknown'
export type PlayerMasterRecord = (typeof masterJson.players)[number]
export const playerMaster = masterJson
export function normalizePlayerName(value:string):string{return value.normalize('NFKD').replace(/[\u0591-\u05C7]/g,'').replace(/[׳״'"’`._(),\-]/g,' ').replace(/\s+/g,' ').trim().toLowerCase()}
export function allPlayers():readonly PlayerMasterRecord[]{return playerMaster.players}
export function playerCount():number{return playerMaster.counts.players}
export function findPlayer(name:string):PlayerMasterRecord|undefined{const q=normalizePlayerName(name);return playerMaster.players.find(p=>p.normalizedNames.includes(q))}
export function searchPlayers(query:string,limit=30):PlayerMasterRecord[]{const q=normalizePlayerName(query);if(!q)return playerMaster.players.slice(0,limit);return playerMaster.players.filter(p=>p.normalizedNames.some(n=>n.includes(q))||normalizePlayerName(p.displayName).includes(q)).slice(0,limit)}
export function playersByShirtNumber(number:number,season?:string):PlayerMasterRecord[]{return playerMaster.players.filter(p=>p.shirtNumbers.some(s=>s.number===number&&(!season||s.season===season)))}
export function currentSquad():PlayerMasterRecord[]{return playerMaster.players.filter(p=>p.currentSquad?.active)}
