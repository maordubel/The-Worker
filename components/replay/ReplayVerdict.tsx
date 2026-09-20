'use client'

import { useEffect, useMemo } from 'react'
import { Num } from '@/components/ui/Num'
import { ACTION_SHORT, ActionGlyph } from './ReplayBuilder'
import type { ReplayMetrics, TouchVerdict } from '@/lib/game/replay/judge'
import { activeReplayProgress } from '@/lib/game/replay/progress'
import { t, type MessageKey } from '@/lib/i18n'

const METRICS:Array<{key:keyof ReplayMetrics;label:MessageKey}>=[{key:'sequence',label:'goal.metric.sequence'},{key:'players',label:'goal.metric.players'},{key:'actions',label:'goal.metric.actions'},{key:'routes',label:'goal.metric.routes'},{key:'continuity',label:'goal.metric.continuity'}]
function mark(v:TouchVerdict):string{if(v.kind==='missing')return'✕';if(v.kind==='extra')return'+';return v.grade==='good'?'✓':v.grade==='near'?'≈':'✕'}

export function ReplayVerdict({metrics,touches,narrativeHe,sourceTitle}:{metrics:ReplayMetrics;touches:TouchVerdict[];narrativeHe:string;sourceTitle:string}){
 const store=useMemo(()=>activeReplayProgress(),[])
 useEffect(()=>{void store.record({goalKey:sourceTitle,score:metrics.overall,sequence:metrics.sequence??0,continuity:metrics.continuity})},[metrics.continuity,metrics.overall,metrics.sequence,sourceTitle,store])
 return <div data-goal="verdict" className="mt-2.5 border-rule border-ink bg-sheet p-3">
  <div className="flex items-baseline justify-between gap-2 border-b-hair border-ink/25 pb-2"><div><p className="font-body text-[10px] font-extrabold tracking-widest text-muted">{t('goal.overall')}</p><p className="mt-0.5 font-body text-[9.5px] leading-snug text-muted">העוגנים והמעטפות הם פרשנות של המקור — לא GPS מומצא.</p></div><p className="font-poster text-[38px] leading-none text-red"><Num>{`${metrics.overall}%`}</Num></p></div>
  <ul className="mt-2 grid grid-cols-5 gap-1">{METRICS.map(({key,label})=>{const value=metrics[key];return <li key={key} className="border-hair border-ink/30 px-1 py-1.5 text-center"><p className="font-poster text-[15px] leading-none text-ink">{value===null?t('goal.metric.none'):<Num>{`${value as number}%`}</Num>}</p><p className="mt-0.5 font-body text-[8.5px] leading-none text-muted">{t(label)}</p></li>})}</ul>
  <ol className="mt-2.5 border-t-hair border-ink/25">{touches.map((v,index)=><li key={index} className="flex items-baseline gap-2 border-b-hair border-ink/25 py-1.5"><span className={`w-4 shrink-0 font-poster text-[16px] leading-none ${v.kind==='matched'&&v.grade==='good'?'text-red':v.kind==='missing'?'text-muted':'text-sign'}`}>{mark(v)}</span><span className="min-w-0 flex-1">{v.kind==='extra'?<span className="font-body text-[12px] font-extrabold leading-snug text-ink">{t('goal.verdict.extra')} — <bdi>{v.userActorHe}</bdi></span>:<><span className="flex items-center gap-1.5 font-body text-[12px] font-extrabold leading-snug text-ink">{v.truthAction&&<span className="shrink-0"><ActionGlyph action={v.truthAction}/></span>}<bdi>{v.truthActorHe}</bdi><span className="font-body text-[10.5px] font-normal text-muted">{v.truthAction?t(ACTION_SHORT[v.truthAction]):''}</span></span>{v.kind==='missing'?<span className="block font-body text-[10.5px] leading-snug text-muted">{t('goal.verdict.missing')}</span>:<span className="block font-body text-[10.5px] leading-snug text-muted">{t('goal.verdict.player')} {v.playerRight?'✓':'✕'} · {t('goal.verdict.action')} {v.actionRight?'✓':'✕'} · {t('goal.verdict.origin')} <Num>{Math.round(v.originScore)}</Num> · {t('goal.verdict.target')} <Num>{Math.round(v.targetScore)}</Num>{v.routeScore!==null&&<> · {t('goal.verdict.route')} <Num>{Math.round(v.routeScore)}</Num></>}</span>}{v.positionHe&&<span className="block font-mono text-[10px] leading-snug text-muted"><bdi>{t('goal.sourceWords')} {v.positionHe} — {v.noteHe}</bdi></span>}</>}</span>{v.kind==='matched'&&<span className="shrink-0 font-poster text-[14px] leading-none text-muted"><Num>{`${Math.round(v.score)}%`}</Num></span>}</li>)}</ol>
  <p className="mt-2 font-body text-step--1 leading-relaxed text-ink">{narrativeHe}</p><p className="mt-1.5 font-body text-[10.5px] leading-snug text-muted">{t('goal.envelopeNote')}</p><p className="mt-1 font-mono text-[10.5px] tabular-nums text-muted"><bdi>{sourceTitle}</bdi></p>
 </div>
}
