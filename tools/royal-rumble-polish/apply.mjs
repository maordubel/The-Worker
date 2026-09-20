#!/usr/bin/env node
import fs from 'node:fs'

function read(file) { return fs.readFileSync(file, 'utf8') }
function write(file, text) { fs.writeFileSync(file, text) }
function replaceOnce(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`Missing anchor: ${label}`)
  return text.replace(from, to)
}

const RED = '#d71920'
const RED_DARK = '#8f0d12'
const RED_MID = '#bf141b'
const PAPER = '#f7f5ef'
const INK = '#171717'
const BLUE = '#173f8a'
const GREY = '#77716b'

const svg85 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1200" role="img" aria-label="Hapoel 1985/86 home shirt">
<defs>
  <linearGradient id="red85" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${RED_DARK}"/><stop offset=".16" stop-color="${RED_MID}"/><stop offset=".5" stop-color="${RED}"/><stop offset=".84" stop-color="${RED_MID}"/><stop offset="1" stop-color="${RED_DARK}"/></linearGradient>
  <linearGradient id="cream85" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fffdf8"/><stop offset="1" stop-color="#d9d4cb"/></linearGradient>
  <filter id="shadow85" x="-30%" y="-20%" width="160%" height="160%"><feGaussianBlur stdDeviation="20"/></filter>
  <clipPath id="clip85"><path d="M286 80 Q352 34 421 48 Q500 70 579 48 Q648 34 714 80 L900 190 820 390 736 350 710 1050 Q500 1100 290 1050 L264 350 180 390 100 190 Z"/></clipPath>
</defs>
<path d="M304 104 Q370 58 430 70 Q500 92 570 70 Q630 58 696 104 L885 210 807 404 735 374 710 1060 Q500 1110 290 1060 L265 374 193 404 115 210 Z" fill="#000" opacity=".24" filter="url(#shadow85)"/>
<path d="M286 80 Q352 34 421 48 Q500 70 579 48 Q648 34 714 80 L900 190 820 390 736 350 710 1050 Q500 1100 290 1050 L264 350 180 390 100 190 Z" fill="url(#red85)" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>
<g clip-path="url(#clip85)" opacity=".18" fill="none" stroke="#fff" stroke-width="5"><path d="M340 90 Q300 510 330 1010"/><path d="M660 90 Q700 510 670 1010"/><path d="M500 130 Q470 450 505 980"/><path d="M210 260 Q315 320 380 260"/><path d="M790 260 Q685 320 620 260"/></g>
<g fill="none" stroke="url(#cream85)" stroke-width="21" stroke-linecap="square"><path d="M260 103 L108 195"/><path d="M282 127 L126 218"/><path d="M304 151 L145 241"/><path d="M740 103 L892 195"/><path d="M718 127 L874 218"/><path d="M696 151 L855 241"/></g>
<path d="M103 184 L183 380 264 350 244 293 159 322 82 205 Z" fill="url(#cream85)" stroke="${INK}" stroke-opacity=".18" stroke-width="4"/><path d="M897 184 L817 380 736 350 756 293 841 322 918 205 Z" fill="url(#cream85)" stroke="${INK}" stroke-opacity=".18" stroke-width="4"/>
<path d="M402 61 Q500 112 598 61 Q584 165 500 175 Q416 165 402 61 Z" fill="url(#cream85)" stroke="${INK}" stroke-opacity=".22" stroke-width="4"/><path d="M430 75 Q500 112 570 75 Q558 133 500 142 Q442 133 430 75 Z" fill="${RED}"/>
<path d="M420 72 Q500 108 580 72" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="4"/>
<g transform="translate(330 220)" fill="${PAPER}"><path d="M0 50 L34 0 L58 18 L26 66 Z"/><path d="M44 62 L78 12 L102 30 L70 78 Z"/><path d="M88 74 L122 24 L146 42 L114 90 Z"/></g>
<g transform="translate(620 220)"><circle r="68" fill="${RED_DARK}" stroke="${PAPER}" stroke-width="13"/><circle r="53" fill="none" stroke="${PAPER}" stroke-opacity=".55" stroke-width="3"/><path d="M-42 -7 H10 M-5 -47 V43 M-5 -27 L-35 20 M-5 -27 L34 10" fill="none" stroke="${PAPER}" stroke-width="11" stroke-linecap="round"/><text x="0" y="92" text-anchor="middle" fill="${PAPER}" font-family="Arial" font-size="34" font-weight="800">הפועל</text><text x="0" y="132" text-anchor="middle" fill="${PAPER}" font-family="Arial" font-size="44" font-weight="900">אתא</text></g>
<g transform="translate(212 420)"><rect x="10" y="18" width="556" height="340" rx="8" fill="#000" opacity=".18"/><rect width="556" height="340" rx="7" fill="url(#cream85)" stroke="${INK}" stroke-opacity=".22" stroke-width="5"/><rect width="556" height="76" fill="${BLUE}"/><rect y="262" width="556" height="78" fill="${GREY}"/><text x="278" y="238" text-anchor="middle" fill="${BLUE}" font-family="Arial Black,Arial" font-size="182" font-style="italic" font-weight="900">VISA</text><path d="M45 242 H511" stroke="#fff" stroke-opacity=".55" stroke-width="3"/></g>
<g opacity=".22" fill="none" stroke="#fff" stroke-width="4"><path d="M330 820 Q500 870 670 820"/><path d="M315 900 Q500 950 685 900"/></g>
<g fill="none" stroke="${INK}" stroke-opacity=".28" stroke-width="3" stroke-dasharray="9 8"><path d="M271 360 Q500 410 729 360"/><path d="M292 1045 Q500 1085 708 1045"/></g>
<text x="500" y="108" text-anchor="middle" fill="${PAPER}" fill-opacity=".55" font-family="Arial" font-size="20" font-weight="700">85/86</text>
</svg>\n`

const svg09 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1200" role="img" aria-label="Hapoel 2009/10 home shirt">
<defs>
  <linearGradient id="red09" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${RED_DARK}"/><stop offset=".18" stop-color="${RED_MID}"/><stop offset=".5" stop-color="${RED}"/><stop offset=".82" stop-color="${RED_MID}"/><stop offset="1" stop-color="${RED_DARK}"/></linearGradient>
  <linearGradient id="white09" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fffefa"/><stop offset="1" stop-color="#d8d4cd"/></linearGradient>
  <filter id="shadow09" x="-30%" y="-20%" width="160%" height="160%"><feGaussianBlur stdDeviation="20"/></filter>
  <clipPath id="clip09"><path d="M286 80 Q352 34 421 48 Q500 70 579 48 Q648 34 714 80 L900 190 820 390 736 350 710 1050 Q500 1100 290 1050 L264 350 180 390 100 190 Z"/></clipPath>
</defs>
<path d="M304 104 Q370 58 430 70 Q500 92 570 70 Q630 58 696 104 L885 210 807 404 735 374 710 1060 Q500 1110 290 1060 L265 374 193 404 115 210 Z" fill="#000" opacity=".25" filter="url(#shadow09)"/>
<path d="M286 80 Q352 34 421 48 Q500 70 579 48 Q648 34 714 80 L900 190 820 390 736 350 710 1050 Q500 1100 290 1050 L264 350 180 390 100 190 Z" fill="url(#red09)" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>
<g clip-path="url(#clip09)" opacity=".17" fill="none" stroke="#fff" stroke-width="5"><path d="M340 90 Q300 500 330 1010"/><path d="M660 90 Q700 500 670 1010"/><path d="M500 140 Q462 520 510 1010"/></g>
<path d="M230 300 Q280 360 300 515 L278 760 Q245 650 245 420 Z" fill="url(#white09)"/><path d="M770 300 Q720 360 700 515 L722 760 Q755 650 755 420 Z" fill="url(#white09)"/>
<path d="M98 190 L182 380 264 350 250 292 175 318 115 174 Z" fill="url(#white09)" stroke="${INK}" stroke-opacity=".16" stroke-width="4"/><path d="M902 190 L818 380 736 350 750 292 825 318 885 174 Z" fill="url(#white09)" stroke="${INK}" stroke-opacity=".16" stroke-width="4"/>
<path d="M405 58 Q500 108 595 58 L570 145 500 184 430 145 Z" fill="url(#white09)" stroke="${INK}" stroke-opacity=".2" stroke-width="4"/><path d="M430 72 Q500 107 570 72 L550 125 500 151 450 125 Z" fill="${RED}"/>
<g transform="translate(305 145)"><path d="M0 0 Q56 -25 112 0 L98 98 Q56 126 14 98 Z" fill="${PAPER}" stroke="#b8b3a8" stroke-width="6"/><text x="56" y="38" text-anchor="middle" fill="${INK}" font-family="Arial" font-size="23" font-weight="900">זוכה</text><text x="56" y="67" text-anchor="middle" fill="${INK}" font-family="Arial" font-size="23" font-weight="900">בגביע</text></g>
<g transform="translate(292 255)" fill="none" stroke="${PAPER}" stroke-width="13"><path d="M0 0 L55 -28 110 0 55 28 Z"/><path d="M24 0 L55 -15 86 0 55 15 Z"/></g>
<g transform="translate(655 242)"><circle r="77" fill="${RED_DARK}" stroke="${PAPER}" stroke-width="13"/><circle r="60" fill="none" stroke="${PAPER}" stroke-opacity=".55" stroke-width="3"/><path d="M-35 0 H10 M-3 -42 V36 M-3 -22 L-29 20 M-3 -22 L31 9" fill="none" stroke="${PAPER}" stroke-width="9" stroke-linecap="round"/><text y="56" text-anchor="middle" fill="${PAPER}" font-family="Arial" font-size="20" font-weight="700">הפועל תל־אביב</text><text y="82" text-anchor="middle" fill="${PAPER}" font-family="Arial" font-size="17">1923</text><text x="-29" y="-96" fill="${PAPER}" font-size="42">★</text><text x="18" y="-96" fill="${PAPER}" font-size="42">★</text></g>
<g transform="translate(220 430)"><ellipse cx="280" cy="82" rx="158" ry="72" fill="${BLUE}" stroke="${PAPER}" stroke-width="8"/><g fill="${PAPER}"><path d="M188 82 l28 -12 12 -28 12 28 28 12-28 12-12 28-12-28z"/><circle cx="286" cy="61" r="12"/><circle cx="326" cy="98" r="10"/><circle cx="358" cy="68" r="9"/></g><text x="280" y="224" text-anchor="middle" fill="${PAPER}" font-family="Arial" font-size="91" font-weight="700" letter-spacing="4">SUBARU</text></g>
<path d="M295 716 Q500 770 705 716" fill="none" stroke="${INK}" stroke-opacity=".24" stroke-width="7"/>
<g fill="none" stroke="${INK}" stroke-opacity=".26" stroke-width="3" stroke-dasharray="9 8"><path d="M270 360 Q500 410 730 360"/><path d="M294 1045 Q500 1085 706 1045"/></g>
<g opacity=".22" fill="none" stroke="#fff" stroke-width="4"><path d="M325 815 Q500 858 675 815"/><path d="M315 905 Q500 948 685 905"/></g>
<text x="500" y="111" text-anchor="middle" fill="${PAPER}" fill-opacity=".5" font-family="Arial" font-size="20" font-weight="700">09/10</text>
</svg>\n`

write('public/kits/assembly/1985-86/home-master.svg', svg85)
write('public/kits/assembly/2009-10/home-master-a.svg', svg09)
write('public/kits/assembly/2009-10/home-master-b.svg', svg09.replace('09/10</text>', '09/10 · B</text>'))

let run = read('app/royal-rumble/RoyalRumbleRun.tsx')
run = replaceOnce(run,
`  if (specialSeason) {
    return (
      <div className="relative">
        <img src={specialSeason.src} alt={t('kitSeason', { season: specialSeason.season })} className={className} />
        <p className="mt-1 text-center font-mono tabular-nums text-[7px] font-black tracking-[0.12em] text-concrete" dir="ltr">{specialSeason.season}</p>
      </div>
    )
  }
  const kit = kitForPlayer(player, kits)
  if (!kit) return <div className={className} />
  return (
    <div className="relative">
      <KitShirt
        spec={kit.spec}
        className={className}
        title={t('kitSeason', { season: kit.seasonLabel })}
      />
      <p className="mt-1 text-center font-mono tabular-nums text-[7px] font-black tracking-[0.12em] text-concrete" dir="ltr">
        {kit.seasonLabel}
      </p>
    </div>
  )`,
`  if (specialSeason) {
    return (
      <div className="relative flex items-center justify-center overflow-visible">
        <img
          src={specialSeason.src}
          alt={t('kitSeason', { season: specialSeason.season })}
          className={\`${'${className}'} scale-[1.08] object-contain drop-shadow-[0_9px_8px_rgba(0,0,0,0.28)]\`}
        />
        <span className="absolute bottom-0 end-0 border border-paper/20 bg-ink px-1.5 py-0.5 font-mono tabular-nums text-[6px] font-black tracking-[0.12em] text-paper" dir="ltr">
          {specialSeason.season}
        </span>
      </div>
    )
  }
  const kit = kitForPlayer(player, kits)
  if (!kit) return <div className={className} />
  return (
    <div className="relative flex items-center justify-center overflow-visible">
      <KitShirt
        spec={kit.spec}
        className={\`${'${className}'} scale-[1.04] drop-shadow-[0_7px_7px_rgba(0,0,0,0.2)]\`}
        title={t('kitSeason', { season: kit.seasonLabel })}
      />
      <span className="absolute bottom-0 end-0 border border-ink/15 bg-paper px-1.5 py-0.5 font-mono tabular-nums text-[6px] font-black tracking-[0.12em] text-ink" dir="ltr">
        {kit.seasonLabel}
      </span>
    </div>
  )`, 'shirt renderer')

const classReplacements = [
  ['className={`group relative min-h-tap overflow-hidden border-rule p-0 text-start transition duration-200 active:translate-y-1 sm:min-h-[330px] ${', 'className={`group relative min-h-[232px] overflow-hidden border-rule p-0 text-start transition duration-200 active:translate-y-1 sm:min-h-[300px] ${'],
  ['<div className={`absolute inset-x-0 top-0 h-2 ${selected ? \'bg-paper\' : \'bg-red\'}`} />', '<div className={`absolute inset-x-0 top-0 h-1.5 ${selected ? \'bg-paper\' : \'bg-red\'}`} />'],
  ['className="absolute -start-4 -top-5 font-display text-[112px] leading-none text-ink/5 sm:text-[150px]"', 'className="absolute -start-3 -top-4 font-display text-[82px] leading-none text-ink/5 sm:text-[132px]"'],
  ['className="relative flex min-h-[295px] flex-col p-3 sm:min-h-[330px] sm:p-4"', 'className="relative flex min-h-[232px] flex-col p-2.5 sm:min-h-[300px] sm:p-4"'],
  ['text-[9px] font-black tracking-[0.22em]', 'text-[7px] font-black tracking-[0.18em] sm:text-[9px]'],
  ['mt-1 font-mono tabular-nums text-[10px]', 'mt-0.5 font-mono tabular-nums text-[8px] sm:text-[10px]'],
  ['font-display text-[34px] leading-none sm:text-[42px]', 'font-display text-[29px] leading-none sm:text-[40px]'],
  ['<p className={`mt-1 font-body text-[8px] ${selected ? \'text-paper/55\' : \'text-concrete\'}`}>{t(\'priceEntry\')}</p>', '<p className={`mt-1 hidden font-body text-[8px] sm:block ${selected ? \'text-paper/55\' : \'text-concrete\'}`}>{t(\'priceEntry\')}</p>'],
  ['mx-auto mt-2 flex w-full justify-center border-y-hair py-2', 'mx-auto mt-1.5 flex w-full justify-center overflow-visible border-y-hair py-1.5'],
  ['className="h-[92px] w-[82px] sm:h-[118px] sm:w-[104px]"', 'className="h-[108px] w-[94px] sm:h-[132px] sm:w-[116px]"'],
  ['<div className="mt-auto pt-3">', '<div className="mt-auto pt-2">'],
  ['font-display text-[24px] leading-[0.92] sm:text-[31px]', 'font-display text-[21px] leading-[0.92] sm:text-[29px]'],
  ['<div className="mt-3 flex items-end justify-between gap-2">', '<div className="mt-2 flex items-end justify-between gap-2">'],
  ['<span className={`border-hair px-2 py-1 font-body text-[8px] font-black ${selected ? \'border-paper/35\' : \'border-ink/25\'}`}>', '<span className={`hidden border-hair px-2 py-1 font-body text-[8px] font-black sm:inline-block ${selected ? \'border-paper/35\' : \'border-ink/25\'}`}>'],
  ['<div className="mt-3"><PriceBars price={player.price} inverted={selected} /></div>', '<div className="mt-2"><PriceBars price={player.price} inverted={selected} /></div>'],
  ['className="relative overflow-hidden border-rule border-ink bg-ink p-3 text-paper sm:p-4"', 'className="relative overflow-hidden border-rule border-ink bg-ink p-2 text-paper sm:p-4"'],
  ['className="relative mb-3 flex items-end justify-between gap-3 ps-2"', 'className="relative mb-1.5 flex items-end justify-between gap-3 ps-2"'],
  ['<h3 className="font-display text-[24px] leading-none">{t(\'lineupWall\')}</h3>', '<h3 className="hidden font-display text-[24px] leading-none sm:block">{t(\'lineupWall\')}</h3>'],
  ['className={`min-h-tap min-w-0 border-hair p-1.5 text-center transition ${', 'className={`min-h-[44px] min-w-0 border-hair p-1 text-center transition ${'],
  ['className="mx-auto max-w-5xl pb-8 pt-1"', 'className="mx-auto max-w-5xl pb-3 pt-0"'],
  ['className="relative grid gap-5 px-4 py-5 sm:grid-cols-[1fr_auto] sm:px-6 sm:py-7"', 'className="relative grid grid-cols-[1fr_auto] items-end gap-3 px-3 py-3 sm:gap-5 sm:px-6 sm:py-6"'],
  ['<span className="font-mono tabular-nums text-[8px] font-black tracking-[0.18em] text-paper/35" dir="ltr">5V5 · HAPOEL ALL-TIME</span>', '<span className="hidden font-mono tabular-nums text-[8px] font-black tracking-[0.18em] text-paper/35 sm:inline" dir="ltr">5V5 · HAPOEL ALL-TIME</span>'],
  ['<h1 className="mt-3 font-display text-[54px] leading-[0.82] sm:text-[78px]">', '<h1 className="mt-2 font-display text-[40px] leading-[0.82] sm:mt-3 sm:text-[76px]">'],
  ['<div className="mt-3 h-2 w-24 bg-red" />', '<div className="mt-2 h-1.5 w-16 bg-red sm:mt-3 sm:h-2 sm:w-24" />'],
  ['<p className="mt-4 max-w-md font-body text-[11px] leading-relaxed text-paper/55 sm:text-[12px]">{t(\'heroBody\')}</p>', '<p className="mt-4 hidden max-w-md font-body text-[11px] leading-relaxed text-paper/55 sm:block sm:text-[12px]">{t(\'heroBody\')}</p>'],
  ['className="flex min-w-[180px] flex-col justify-end border-t-hair border-paper/15 pt-3 sm:border-s-hair sm:border-t-0 sm:ps-5 sm:pt-0"', 'className="flex min-w-[112px] flex-col justify-end border-s-hair border-paper/15 ps-3 sm:min-w-[180px] sm:ps-5"'],
  ['className="font-mono tabular-nums text-[8px] font-black tracking-[0.18em] text-paper/35" dir="ltr">MONEY LEFT', 'className="font-mono tabular-nums text-[7px] font-black tracking-[0.15em] text-paper/35 sm:text-[8px]" dir="ltr">MONEY LEFT'],
  ['className={`font-display text-[52px] leading-none ${remaining < 0 ? \'text-red\' : \'text-paper\'}`}', 'className={`font-display text-[36px] leading-none sm:text-[52px] ${remaining < 0 ? \'text-red\' : \'text-paper\'}`}'],
  ['<span className="mb-1 font-body text-[9px] text-paper/35">{t(\'budgetOf\', { budget: money(activeDraft.budget) })}</span>', '<span className="mb-1 hidden font-body text-[9px] text-paper/35 sm:inline">{t(\'budgetOf\', { budget: money(activeDraft.budget) })}</span>'],
  ['<div className="mt-3 h-2 bg-paper/10">', '<div className="mt-2 h-1.5 bg-paper/10 sm:mt-3 sm:h-2">'],
  ['<div className="mt-2 flex justify-between font-body text-[8px] text-paper/35">', '<div className="mt-1 flex justify-between font-body text-[7px] text-paper/35 sm:mt-2 sm:text-[8px]">'],
  ['<div className="mt-3"><LineupRail', '<div className="mt-2"><LineupRail'],
  ['<section className="mt-3 border-rule border-ink bg-paper p-3 sm:p-5">', '<section className="mt-2 border-rule border-ink bg-paper p-2 sm:p-4">'],
  ['<div className="mb-4 grid grid-cols-[auto_1fr_auto] items-end gap-3">', '<div className="mb-2 grid grid-cols-[auto_1fr_auto] items-end gap-2 sm:gap-3">'],
  ['className="font-display text-[54px] leading-none text-red sm:text-[68px]"', 'className="font-display text-[38px] leading-none text-red sm:text-[62px]"'],
  ['<h2 className="font-display text-[28px] leading-none sm:text-[36px]">{t(\'draftQuestion\')}</h2>', '<h2 className="font-display text-[23px] leading-none sm:text-[34px]">{t(\'draftQuestion\')}</h2>'],
  ['<div className="grid grid-cols-3 gap-2 sm:gap-3">', '<div className="grid grid-cols-3 gap-1.5 sm:gap-3">'],
  ['<p className="mt-3 text-center font-body text-[9px] text-concrete">{t(\'fadedNote\')}</p>', '<p className="mt-2 hidden text-center font-body text-[9px] text-concrete sm:block">{t(\'fadedNote\')}</p>'],
  ['{error && <p className="mt-3 border-rule', '{error && <p className="mt-2 border-rule'],
  ['className="group mt-3 grid min-h-tap w-full', 'className="group sticky bottom-2 z-40 mt-2 grid min-h-tap w-full'],
  ['<span className="font-display text-[27px] sm:text-[31px]">', '<span className="font-display text-[23px] sm:text-[31px]">'],
  ['<span className="font-display text-[42px] transition', '<span className="font-display text-[34px] transition sm:text-[42px]'],
  ['<div className="mt-3 grid gap-2 border-y-hair', '<div className="mt-3 hidden gap-2 border-y-hair'],
  ['<p className="mt-2 text-center font-body text-[8px] text-concrete">{t(\'kitNearest\')}</p>', '<p className="mt-2 hidden text-center font-body text-[8px] text-concrete sm:block">{t(\'kitNearest\')}</p>'],
]
for (const [from, to] of classReplacements) {
  if (run.includes(from)) run = run.replace(from, to)
}

const shuffleStart = run.indexOf('      <section className="mt-3 grid border-rule border-ink bg-paper sm:grid-cols-[1fr_auto]">')
const draftStart = run.indexOf('      <section className="mt-2 border-rule border-ink bg-paper p-2 sm:p-4">')
if (shuffleStart < 0 || draftStart < 0 || draftStart <= shuffleStart) throw new Error('shuffle/draft anchors missing')
const compactShuffle = `      <section className="mt-2 flex min-h-tap items-center justify-between gap-2 border-rule border-ink bg-paper px-3 py-1.5">
        <div className="min-w-0">
          <p className="font-mono tabular-nums text-[7px] font-black tracking-[0.18em] text-red" dir="ltr">SHUFFLE ×1</p>
          <p className={\`truncate font-display text-[19px] leading-none ${'${shuffleNotice ? \'text-red\' : \'text-ink\'}'}\`}>
            {shuffleNotice ? t('shuffleFresh') : t('shuffleTitle')}
          </p>
        </div>
        <button
          type="button"
          disabled={shuffleUsed || busy}
          onClick={shuffleOnce}
          className="min-h-[40px] shrink-0 border-s-rule border-ink bg-ink px-3 font-display text-[18px] text-paper transition hover:bg-red disabled:cursor-not-allowed disabled:bg-concrete disabled:text-ink/60 sm:px-5 sm:text-[24px]"
        >
          {shuffleUsed ? t('shuffleUsed') : t('shuffleAction')}
        </button>
      </section>\n\n`
run = run.slice(0, shuffleStart) + compactShuffle + run.slice(draftStart)

run = run.replace('className="relative mx-auto max-w-5xl overflow-hidden border-rule border-ink bg-ink px-3 py-6 text-paper sm:px-6 sm:py-10"', 'className="relative mx-auto max-w-5xl overflow-hidden border-rule border-ink bg-ink px-3 py-4 text-paper sm:px-6 sm:py-8"')
run = run.replace('text-[48px] leading-[0.85] sm:text-[70px]', 'text-[38px] leading-[0.85] sm:text-[66px]')
run = run.replace('className="mx-auto mt-4 max-w-lg font-body text-[11px] text-paper/50"', 'className="mx-auto mt-4 hidden max-w-lg font-body text-[11px] text-paper/50 sm:block"')
run = run.replace('className="relative mt-7 grid grid-cols-5 gap-1 sm:mt-10 sm:gap-2"', 'className="relative mt-4 grid grid-cols-5 gap-1 sm:mt-8 sm:gap-2"')
run = run.replaceAll('min-h-[210px]', 'min-h-[176px]')
run = run.replaceAll('sm:min-h-[300px]', 'sm:min-h-[280px]')
run = run.replace('className="h-[86px] w-[76px] sm:h-[120px] sm:w-[106px]"', 'className="h-[96px] w-[84px] sm:h-[126px] sm:w-[112px]"')
run = run.replace('className="relative mt-6 text-center"', 'className="relative mt-4 text-center sm:mt-6"')
run = run.replace('className="mx-auto max-w-5xl pb-8 pt-2"', 'className="mx-auto max-w-5xl pb-3 pt-1"')
run = run.replace('px-4 py-7 text-center', 'px-4 py-5 text-center')
run = run.replace('sm:px-8 sm:py-10', 'sm:px-8 sm:py-8')
write('app/royal-rumble/RoyalRumbleRun.tsx', run)

let slot = read('app/royal-rumble/RoyalRumbleSlotReveal.tsx')
slot = slot.replace('const lockAt = 7 + index * 3', 'const lockAt = 5 + index * 2')
slot = slot.replace('}, 1120)', '}, 820)')
slot = slot.replace('min-h-[250px]', 'min-h-[232px]').replace('sm:min-h-[330px]', 'sm:min-h-[300px]')
slot = slot.replace('className="mt-5 h-[78px]', 'className="mt-3 h-[64px]')
slot = slot.replace('text-[24px] leading-[0.9] sm:text-[31px]', 'text-[21px] leading-[0.9] sm:text-[30px]')
slot = slot.replace('className="mt-4 font-body text-[9px]', 'className="mt-2 font-body text-[8px] sm:text-[9px]')
write('app/royal-rumble/RoyalRumbleSlotReveal.tsx', slot)

let mode = read('app/royal-rumble/RoyalRumbleMode.tsx')
mode = mode.replace('mx-auto mb-3 grid max-w-5xl', 'mx-auto mb-2 grid max-w-5xl')
mode = mode.replaceAll('min-h-tap border-e-hair border-ink px-3 text-start transition', 'min-h-[44px] border-e-hair border-ink px-3 py-1 text-start transition')
mode = mode.replace('min-h-tap px-3 text-start transition', 'min-h-[44px] px-3 py-1 text-start transition')
mode = mode.replaceAll('font-display text-[23px]', 'font-display text-[18px] sm:text-[23px]')
write('app/royal-rumble/RoyalRumbleMode.tsx', mode)

let challenge = read('app/royal-rumble/RoyalRumbleChallenge.tsx')
challenge = challenge.replace('mx-auto mt-3 max-w-5xl', 'mx-auto mt-2 max-w-5xl')
challenge = challenge.replace('relative grid gap-3 p-3 ps-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-4 sm:ps-6', 'relative grid grid-cols-[1fr_auto] items-center gap-2 p-2 ps-4 sm:gap-3 sm:p-4 sm:ps-6')
challenge = challenge.replace('mt-1 font-display text-[24px] leading-none sm:text-[29px]', 'mt-1 font-display text-[19px] leading-none sm:text-[29px]')
challenge = challenge.replace('mt-1 max-w-2xl font-body text-[9px] leading-relaxed text-concrete sm:text-[10px]', 'mt-1 hidden max-w-2xl font-body text-[9px] leading-relaxed text-concrete sm:block sm:text-[10px]')
challenge = challenge.replace('group flex min-h-tap min-w-[190px] items-center', 'group flex min-h-[44px] min-w-0 items-center')
challenge = challenge.replace('className="block font-mono tabular-nums text-[7px]', 'className="hidden font-mono tabular-nums text-[7px] sm:block')
challenge = challenge.replace('className="font-display text-[20px]"', 'className="font-display text-[17px] sm:text-[20px]"')
challenge = challenge.replace('className="font-display text-[30px]', 'className="font-display text-[26px]')
write('app/royal-rumble/RoyalRumbleChallenge.tsx', challenge)

let live = read('app/royal-rumble/RoyalRumbleLiveRun.tsx')
live = live.replace('className="h-[106px] w-[96px]" />\n        <p className="mt-1 text-center font-mono tabular-nums tabular-nums text-[7px] font-black tracking-[0.12em] text-concrete" dir="ltr">{specialSeason.season}</p>', 'className="h-[116px] w-[102px] scale-[1.07] object-contain drop-shadow-[0_9px_8px_rgba(0,0,0,0.28)]" />\n        <span className="absolute bottom-0 end-0 bg-ink px-1.5 py-0.5 font-mono tabular-nums text-[6px] font-black tracking-[0.12em] text-paper" dir="ltr">{specialSeason.season}</span>')
live = live.replace('className="relative">\n        <img', 'className="relative flex items-center justify-center overflow-visible">\n        <img')
live = live.replace('return kit ? <KitShirt spec={kit.spec} className="h-[106px] w-[96px]"', 'return kit ? <KitShirt spec={kit.spec} className="h-[116px] w-[102px] scale-[1.04] drop-shadow-[0_7px_7px_rgba(0,0,0,0.2)]"')
write('app/royal-rumble/RoyalRumbleLiveRun.tsx', live)

console.log('Royal Rumble polish applied')
