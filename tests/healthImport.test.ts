import { describe, expect, it } from 'vitest'
import { describeImport, parseHealthParams } from '../src/domain/healthImport'

const TODAY = '2026-09-15'

describe('import z Apple Health', () => {
  it('prečíta kroky', () => {
    const r = parseHealthParams('?hk=steps&date=2026-09-14&steps=8432', TODAY)
    expect(r).toEqual({ kind: 'steps', date: '2026-09-14', steps: 8432 })
  })

  it('bez dátumu použije dnešok', () => {
    const r = parseHealthParams('?hk=steps&steps=100', TODAY)
    expect(r?.kind === 'steps' && r.date).toBe(TODAY)
  })

  it('prečíta aktivitu aj s tepom', () => {
    const r = parseHealthParams('?hk=activity&type=run&date=2026-09-15&meters=5120&seconds=1840&kcal=430&hr=148', TODAY)
    expect(r).toEqual({ kind: 'activity', type: 'run', date: TODAY, meters: 5120, seconds: 1840, kcal: 430, avgHr: 148 })
  })

  it('joga bez vzdialenosti je v poriadku', () => {
    const r = parseHealthParams('?hk=activity&type=yoga&seconds=2700', TODAY)
    expect(r?.kind === 'activity' && r.meters).toBe(0)
    expect(r?.kind === 'activity' && r.type).toBe('yoga')
  })

  it('neznámy typ spadne na "iné"', () => {
    const r = parseHealthParams('?hk=activity&type=parkour&seconds=600', TODAY)
    expect(r?.kind === 'activity' && r.type).toBe('other')
  })

  it('spáruje tréning z appky', () => {
    const r = parseHealthParams('?hk=workout&id=17&kcal=380&hr=132', TODAY)
    expect(r).toEqual({ kind: 'workout', workoutId: 17, kcal: 380, avgHr: 132 })
  })

  it('nezmyselný tep sa zahodí, zvyšok ostane', () => {
    const r = parseHealthParams('?hk=workout&id=17&kcal=380&hr=900', TODAY)
    expect(r?.kind === 'workout' && r.avgHr).toBeNull()
    expect(r?.kind === 'workout' && r.kcal).toBe(380)
  })

  it('odmietne chýbajúce a pokazené vstupy', () => {
    expect(parseHealthParams('', TODAY)).toBeNull()
    expect(parseHealthParams('?foo=bar', TODAY)).toBeNull()
    expect(parseHealthParams('?hk=steps&steps=-5', TODAY)).toBeNull()
    expect(parseHealthParams('?hk=steps&date=14.9.2026&steps=10', TODAY)).toBeNull()
    expect(parseHealthParams('?hk=activity&seconds=0', TODAY)).toBeNull()
    expect(parseHealthParams('?hk=workout&id=0', TODAY)).toBeNull()
    expect(parseHealthParams('?hk=nieco&steps=10', TODAY)).toBeNull()
  })

  it('popíše, čo sa naimportovalo', () => {
    const a = parseHealthParams('?hk=activity&type=run&meters=5000&seconds=1800&kcal=400', TODAY)
    expect(describeImport(a!)).toContain('Beh')
    expect(describeImport(a!)).toContain('5 km')
  })
})
