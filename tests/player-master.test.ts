import { describe, expect, it } from 'vitest'
import { allPlayers, findPlayer, playerCount, playersByShirtNumber } from '@/lib/archive/player-master'

describe('player master',()=>{
 it('has dynamic non-empty unique player ids',()=>{const rows=allPlayers();expect(playerCount()).toBe(rows.length);expect(rows.length).toBeGreaterThan(500);expect(new Set(rows.map(p=>p.id)).size).toBe(rows.length)})
 it('keeps foreign-slot status distinct from declared nationality',()=>{for(const p of allPlayers()){expect(['israeli','foreign','unknown']).toContain(p.foreignSlotStatus);if(p.currentSquad?.declaredNationality)expect(p.declaredNationality).toEqual(expect.arrayContaining(p.currentSquad.declaredNationality))}})
 it('preserves shirt-number season evidence',()=>{const rows=playersByShirtNumber(11);expect(rows.length).toBeGreaterThan(0);expect(rows.some(p=>p.shirtNumbers.some(s=>s.number===11&&Boolean(s.season)))).toBe(true)})
 it('does not present archive scorer evidence as career totals',()=>{for(const p of allPlayers().filter(p=>p.archiveGoals)){expect(p.archiveGoals?.complete).toBe(false);expect(p.archiveGoals?.scope).toMatch(/never a career total/)}})
 it('finds canonical names without punctuation sensitivity',()=>{const first=allPlayers()[0]!;expect(findPlayer(first.displayName)?.id).toBe(first.id)})
})
