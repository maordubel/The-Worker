import assemblyFile from '@/content/manual/kit-assembly.json'
export type KitAssemblySeason = { seasonLabel:string; variant:'home'|'away'|'third'; master:string; alternateMaster?:string; sheet:string; parts:Record<string,string> }
const seasons = assemblyFile.seasons as unknown as KitAssemblySeason[]
export function kitAssemblySeasons(){ return seasons }
export function kitAssemblyForSeason(seasonLabel:string){ return seasons.find((row)=>row.seasonLabel===seasonLabel) ?? null }
