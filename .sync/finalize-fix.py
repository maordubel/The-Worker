from pathlib import Path

p=Path('scripts/players/build-master.ts')
s=p.read_text()
# strict-safe regexp capture indexing
s=s.replace("return{value:m[1],precision:'year',year:+m[1],raw}", "return{value:m[1]!,precision:'year',year:+m[1]!,raw}")
s=s.replace("return{value:`${m[2]}-${m[1].padStart(2,'0')}`,precision:'month',year:+m[2],month:+m[1],raw}", "return{value:`${m[2]!}-${m[1]!.padStart(2,'0')}`,precision:'month',year:+m[2]!,month:+m[1]!,raw}")
s=s.replace("return{value:`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`,precision:'day',year:+m[3],month:+m[2],day:+m[1],raw}", "return{value:`${m[3]!}-${m[2]!.padStart(2,'0')}-${m[1]!.padStart(2,'0')}`,precision:'day',year:+m[3]!,month:+m[2]!,day:+m[1]!,raw}")
s=s.replace("return{value:raw,precision:'day',year:+m[1],month:+m[2],day:+m[3],raw}", "return{value:raw,precision:'day',year:+m[1]!,month:+m[2]!,day:+m[3]!,raw}")
old="for(const r of rows(read('squads.json'))){const name=str(r,'personNameHe','personName');if(!name)continue;const p=ensure(name,'squads.json',r);const nat=str(r,'nationalityHe','nationality');if(nat)p.declaredNationality=[...new Set([...(p.declaredNationality??[]),nat])];const season=str(r,'seasonLabel','season');const number=num(r,'shirtNumber','number');p.currentSquad={active:true,season,number,captain:r.isCaptain===true,declaredNationality:nat?[nat]:undefined,source:source('squads.json',r)};if(number!==undefined&&!p.shirtNumbers.some(x=>x.number===number&&x.season===season))p.shirtNumbers.push({number,season,historical:false,source:source('squads.json',r)})}"
new="const squadRows=rows(read('squads.json'));const currentSeason=[...new Set(squadRows.map(r=>str(r,'seasonLabel','season')).filter((x):x is string=>Boolean(x)))].sort().at(-1);for(const r of squadRows){const name=str(r,'personNameHe','personName');if(!name)continue;const p=ensure(name,'squads.json',r);const season=str(r,'seasonLabel','season');if(season!==currentSeason)continue;const nat=str(r,'nationalityHe','nationality');if(nat)p.declaredNationality=[...new Set([...(p.declaredNationality??[]),nat])];const number=num(r,'shirtNumber','number');p.currentSquad={active:true,season,number,captain:r.isCaptain===true,declaredNationality:nat?[nat]:undefined,source:source('squads.json',r)};if(number!==undefined&&!p.shirtNumbers.some(x=>x.number===number&&x.season===season))p.shirtNumbers.push({number,season,historical:false,source:source('squads.json',r)})}"
if old not in s: raise SystemExit('squad block not found')
s=s.replace(old,new)
p.write_text(s)

t=Path('tests/player-master.test.ts');q=t.read_text();q=q.replace("const first=allPlayers()[0];expect(findPlayer(first.displayName)?.id).toBe(first.id)","const first=allPlayers()[0]!;expect(findPlayer(first.displayName)?.id).toBe(first.id)");t.write_text(q)
print('strict/current-squad fixes applied')
