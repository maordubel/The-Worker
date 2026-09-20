#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const RED = '#d71920', WHITE = '#f7f5ef', BLUE = '#173f8a', GREY = '#4f4b48', INK = '#171717'
function write(rel, content) { const p = path.join(ROOT, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content) }
function svg(inner, viewBox = '0 0 1000 1200') { return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img">${inner}</svg>\n` }

const shape = `<path d="M286 80 Q352 34 421 48 Q500 70 579 48 Q648 34 714 80 L900 190 820 390 736 350 710 1050 Q500 1100 290 1050 L264 350 180 390 100 190 Z" fill="${RED}" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>`
const cloth = `<path d="M286 80 Q352 34 421 48 Q500 70 579 48 Q648 34 714 80 L900 190 820 390 736 350 710 1050 Q500 1100 290 1050 L264 350 180 390 100 190 Z" fill="none" stroke="${WHITE}" stroke-opacity=".12" stroke-width="3"/>`

const stripes85 = `<g fill="none" stroke="${WHITE}" stroke-width="19"><path d="M260 103 L108 195"/><path d="M282 127 L126 218"/><path d="M304 151 L145 241"/><path d="M740 103 L892 195"/><path d="M718 127 L874 218"/><path d="M696 151 L855 241"/></g>`
const collar85 = `<path d="M402 61 Q500 112 598 61 Q584 165 500 175 Q416 165 402 61 Z" fill="${WHITE}"/><path d="M430 75 Q500 112 570 75 Q558 133 500 142 Q442 133 430 75 Z" fill="${RED}"/>`
const cuffs85 = `<path d="M103 184 L183 380 264 350 244 293 159 322 82 205 Z" fill="${WHITE}"/><path d="M897 184 L817 380 736 350 756 293 841 322 918 205 Z" fill="${WHITE}"/>`
const adidas85 = `<g transform="translate(330 222)" fill="${WHITE}"><path d="M0 50 L34 0 L58 18 L26 66 Z"/><path d="M44 62 L78 12 L102 30 L70 78 Z"/><path d="M88 74 L122 24 L146 42 L114 90 Z"/></g>`
const crest85 = `<g transform="translate(610 210)"><circle r="72" fill="none" stroke="${WHITE}" stroke-width="15"/><path d="M-48 -8 H12 M-6 -52 V50 M-6 -30 L-40 24 M-6 -30 L36 12" fill="none" stroke="${WHITE}" stroke-width="13" stroke-linecap="round"/><text x="0" y="96" text-anchor="middle" fill="${WHITE}" font-family="Arial" font-size="42" font-weight="800">הפועל</text><text x="0" y="140" text-anchor="middle" fill="${WHITE}" font-family="Arial" font-size="56" font-weight="900">אתא</text></g>`
const visa85 = `<g transform="translate(230 430)"><rect width="540" height="330" rx="5" fill="${WHITE}" stroke="${WHITE}" stroke-width="8"/><rect width="540" height="75" fill="${BLUE}"/><rect y="250" width="540" height="80" fill="${GREY}"/><text x="270" y="232" text-anchor="middle" fill="${BLUE}" font-family="Arial Black,Arial" font-size="178" font-style="italic" font-weight="900">VISA</text></g>`
write('public/kits/assembly/1985-86/home-master.svg', svg(`${shape}${stripes85}${cuffs85}${collar85}${adidas85}${crest85}${visa85}${cloth}`))
write('public/kits/assembly/1985-86/parts-sheet.svg', svg(`${stripes85}${cuffs85}${collar85}${adidas85}${crest85}${visa85}`, '0 0 1000 1000'))
for (const [name, part] of Object.entries({ collar: collar85, 'maker-adidas': adidas85, 'crest-hapoel': crest85, 'sponsor-visa': visa85, 'shoulder-stripes': stripes85, cuffs: cuffs85 })) write(`public/kits/assembly/1985-86/parts/${name}.svg`, svg(part))

const panels09 = `<path d="M230 300 Q280 360 300 515 L278 760 Q245 650 245 420 Z" fill="${WHITE}"/><path d="M770 300 Q720 360 700 515 L722 760 Q755 650 755 420 Z" fill="${WHITE}"/>`
const sleeves09 = `<path d="M98 190 L182 380 264 350 250 292 175 318 115 174 Z" fill="${WHITE}"/><path d="M902 190 L818 380 736 350 750 292 825 318 885 174 Z" fill="${WHITE}"/>`
const collar09 = `<path d="M405 58 Q500 108 595 58 L570 145 500 184 430 145 Z" fill="${WHITE}"/><path d="M430 72 Q500 107 570 72 L550 125 500 151 450 125 Z" fill="${RED}"/>`
const umbro09 = `<g transform="translate(295 230)" fill="none" stroke="${WHITE}" stroke-width="14"><path d="M0 0 L55 -28 110 0 55 28 Z"/><path d="M24 0 L55 -15 86 0 55 15 Z"/></g>`
const crest09 = `<g transform="translate(655 230)"><circle r="76" fill="${RED}" stroke="${WHITE}" stroke-width="13"/><circle r="60" fill="none" stroke="${WHITE}" stroke-width="3"/><path d="M-35 0 H10 M-3 -42 V36 M-3 -22 L-29 20 M-3 -22 L31 9" fill="none" stroke="${WHITE}" stroke-width="9" stroke-linecap="round"/><text y="56" text-anchor="middle" fill="${WHITE}" font-family="Arial" font-size="20" font-weight="700">הפועל תל־אביב</text><text y="82" text-anchor="middle" fill="${WHITE}" font-family="Arial" font-size="18">1923</text><text x="-28" y="-95" fill="${WHITE}" font-size="45">★</text><text x="18" y="-95" fill="${WHITE}" font-size="45">★</text></g>`
const badge09 = `<g transform="translate(300 128)"><path d="M0 0 Q60 -28 120 0 L105 105 Q60 135 15 105 Z" fill="${WHITE}" stroke="#b8b3a8" stroke-width="7"/><text x="60" y="45" text-anchor="middle" fill="${INK}" font-family="Arial" font-size="28" font-weight="900">זוכה</text><text x="60" y="76" text-anchor="middle" fill="${INK}" font-family="Arial" font-size="28" font-weight="900">בגביע</text></g>`
const subaru09 = `<g transform="translate(250 420)"><ellipse cx="250" cy="80" rx="150" ry="68" fill="${BLUE}" stroke="${WHITE}" stroke-width="8"/><g fill="${WHITE}"><path d="M170 80 l28 -12 12 -28 12 28 28 12-28 12-12 28-12-28z"/><circle cx="260" cy="60" r="12"/><circle cx="300" cy="96" r="10"/><circle cx="332" cy="67" r="9"/></g><text x="250" y="220" text-anchor="middle" fill="${WHITE}" font-family="Arial" font-size="92" font-weight="700" letter-spacing="5">SUBARU</text></g>`
const full09 = `${shape}${panels09}${sleeves09}${collar09}${badge09}${umbro09}${crest09}${subaru09}<path d="M300 700 Q500 760 700 700" fill="none" stroke="${INK}" stroke-opacity=".22" stroke-width="8"/>${cloth}`
write('public/kits/assembly/2009-10/home-master-a.svg', svg(full09))
write('public/kits/assembly/2009-10/home-master-b.svg', svg(`${shape}${panels09}${sleeves09}${collar09}${badge09}${umbro09}${crest09}${subaru09}<path d="M305 720 Q500 790 695 720" fill="none" stroke="${INK}" stroke-opacity=".2" stroke-width="7"/>${cloth}`))
write('public/kits/assembly/2009-10/parts-sheet.svg', svg(`${panels09}${sleeves09}${collar09}${badge09}${umbro09}${crest09}${subaru09}`, '0 0 1000 1000'))
for (const [name, part] of Object.entries({ collar: collar09, 'maker-umbro': umbro09, 'crest-hapoel': crest09, badge: badge09, 'sponsor-subaru': subaru09, 'side-panels': panels09, sleeves: sleeves09 })) write(`public/kits/assembly/2009-10/parts/${name}.svg`, svg(part))

const designsPath = path.join(ROOT, 'content/manual/kit-designs.json')
const designs = JSON.parse(fs.readFileSync(designsPath, 'utf8'))
const rows = designs.records ?? []
function upsert(record) { const i = rows.findIndex((r) => r.seasonLabel === record.seasonLabel && r.variant === record.variant); if (i >= 0) rows[i] = { ...rows[i], ...record }; else rows.push(record) }
upsert({ seasonLabel:'1985/86', variant:'home', makerHe:'adidas', sponsorHe:'VISA', base:'red', pattern:'solid', patternInk:'red', sleeves:'plain', sleeveInk:'red', collar:'polo', collarInk:'cream', shorts:'red', socks:'red', noteHe:'אדום ארוך שרוול, שלושת פסי adidas לבנים, צווארון לבן רחב, סמל הפועל/אתא ובלוק VISA גדול.', sport:'football', confidence:3, sourceTitle:'צילום חולצת 1985/86 שסיפק מאור הראל, 20.9.2026', sourceUrl:null })
upsert({ seasonLabel:'2009/10', variant:'home', makerHe:'umbro', sponsorHe:'SUBARU', base:'red', pattern:'solid', patternInk:'red', sleeves:'cuff', sleeveInk:'cream', collar:'v-neck', collarInk:'cream', shorts:'red', socks:'red', noteHe:'חולצת הדאבל: Umbro אדומה, צווארון ופאנלים לבנים, שני כוכבים וספונסר SUBARU.', sport:'football', confidence:3, sourceTitle:'שתי תמונות חולצת 2009/10 שסיפק מאור הראל, 20.9.2026', sourceUrl:null })
designs.records = rows.sort((a,b) => a.seasonLabel.localeCompare(b.seasonLabel) || a.variant.localeCompare(b.variant))
fs.writeFileSync(designsPath, JSON.stringify(designs, null, 2) + '\n')

const assembly = { note:'Masters and reusable shirt parts for Gate 4/5 assembly.', seasons:[
  { seasonLabel:'1985/86', variant:'home', master:'/kits/assembly/1985-86/home-master.svg', sheet:'/kits/assembly/1985-86/parts-sheet.svg', parts:{ collar:'/kits/assembly/1985-86/parts/collar.svg', maker:'/kits/assembly/1985-86/parts/maker-adidas.svg', crest:'/kits/assembly/1985-86/parts/crest-hapoel.svg', sponsor:'/kits/assembly/1985-86/parts/sponsor-visa.svg', shoulderStripes:'/kits/assembly/1985-86/parts/shoulder-stripes.svg', cuffs:'/kits/assembly/1985-86/parts/cuffs.svg' } },
  { seasonLabel:'2009/10', variant:'home', master:'/kits/assembly/2009-10/home-master-a.svg', alternateMaster:'/kits/assembly/2009-10/home-master-b.svg', sheet:'/kits/assembly/2009-10/parts-sheet.svg', parts:{ collar:'/kits/assembly/2009-10/parts/collar.svg', maker:'/kits/assembly/2009-10/parts/maker-umbro.svg', crest:'/kits/assembly/2009-10/parts/crest-hapoel.svg', badge:'/kits/assembly/2009-10/parts/badge.svg', sponsor:'/kits/assembly/2009-10/parts/sponsor-subaru.svg', sidePanels:'/kits/assembly/2009-10/parts/side-panels.svg', sleeves:'/kits/assembly/2009-10/parts/sleeves.svg' } }
] }
write('content/manual/kit-assembly.json', JSON.stringify(assembly, null, 2) + '\n')
write('lib/kit/assembly.ts', `import assemblyFile from '@/content/manual/kit-assembly.json'\nexport type KitAssemblySeason = { seasonLabel:string; variant:'home'|'away'|'third'; master:string; alternateMaster?:string; sheet:string; parts:Record<string,string> }\nconst seasons = assemblyFile.seasons as KitAssemblySeason[]\nexport function kitAssemblySeasons(){ return seasons }\nexport function kitAssemblyForSeason(seasonLabel:string){ return seasons.find((row)=>row.seasonLabel===seasonLabel) ?? null }\n`)

const provenancePath = path.join(ROOT, 'content/manual/asset-provenance.json')
const provenance = JSON.parse(fs.readFileSync(provenancePath, 'utf8'))
provenance.records = (provenance.records ?? []).filter((r) => r.key !== 'kit-assembly-maor-2026-09-20')
provenance.records.push({ key:'kit-assembly-maor-2026-09-20', kind:'generated', origin:'original-artwork', folder:'public/kits', match:['assembly/1985-86/home-master.svg','assembly/1985-86/parts-sheet.svg','assembly/1985-86/parts/*','assembly/2009-10/home-master-a.svg','assembly/2009-10/home-master-b.svg','assembly/2009-10/parts-sheet.svg','assembly/2009-10/parts/*'], sourceUrl:null, sourceTitle:'מסירת חולצות מאור הראל, 20.9.2026 — 1985/86 ו-2009/10', treatment:['crop','trim-alpha'], confidence:2, noteHe:'שתי עונות ששוחזרו מתוך התמונות שמאור סיפק: master מלא לרויאל ראמבל וחלקים נפרדים לשימוש עתידי בהרכבת חולצות בשערים 4–5.' })
fs.writeFileSync(provenancePath, JSON.stringify(provenance, null, 1) + '\n')
