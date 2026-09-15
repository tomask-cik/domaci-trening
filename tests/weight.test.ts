import { describe, expect, it } from 'vitest'
import { currentWeightKg, movingAverage, phaseBoundaries, phaseFor, trendSeries, weeklyRate, weightPoints } from '../src/domain/weight'

const pts = (start: string, kgs: number[]) =>
  kgs.map((kg, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return { date: d.toISOString().slice(0, 10), weightKg: kg }
  })

describe('movingAverage', () => {
  it('vráti null pri menej než 3 bodoch', () => {
    expect(movingAverage(pts('2026-09-07', [105, 104.8]), '2026-09-08')).toBeNull()
  })
  it('počíta priemer 7 dní vrátane dňa', () => {
    const p = pts('2026-09-07', [105, 104, 106, 105, 104, 105, 106, 200])
    // okno 2026-09-07..2026-09-13 = prvých 7 hodnôt
    expect(movingAverage(p, '2026-09-13')).toBe(105)
  })
  it('ignoruje body mimo okna', () => {
    const p = pts('2026-09-01', [120, 120, 120, 105, 105, 105, 105, 105, 105, 105])
    expect(movingAverage(p, '2026-09-10')).toBe(105)
  })
  it('zaokrúhľuje na 1 desatinné miesto', () => {
    expect(movingAverage(pts('2026-09-07', [105, 104.3, 104.1]), '2026-09-09')).toBe(104.5)
  })
})

describe('trendSeries', () => {
  it('vracia body zoradené s priemerom', () => {
    const s = trendSeries(pts('2026-09-07', [105, 104, 103, 102]).reverse())
    expect(s.map((x) => x.kg)).toEqual([105, 104, 103, 102])
    expect(s[0]?.avg).toBeNull()
    expect(s[3]?.avg).toBe(103.5)
  })
})

describe('weeklyRate', () => {
  it('rozdiel priemerov dvoch týždňov', () => {
    const prev = pts('2026-08-31', [105, 105, 105, 105, 105, 105, 105])
    const cur = pts('2026-09-07', [104.5, 104.5, 104.5, 104.5, 104.5, 104.5, 104.5])
    const r = weeklyRate([...prev, ...cur], '2026-09-07')
    expect(r.avgPrev).toBe(105)
    expect(r.avgThis).toBe(104.5)
    expect(r.rateKgPerWeek).toBe(-0.5)
  })
  it('null, keď chýba predchádzajúci týždeň', () => {
    const cur = pts('2026-09-07', [104, 104, 104])
    expect(weeklyRate(cur, '2026-09-07').rateKgPerWeek).toBeNull()
  })
})

describe('phaseFor', () => {
  it('105→85: hranice 97 a 90', () => {
    expect(phaseBoundaries(105, 85)).toEqual([97, 90])
    expect(phaseFor(105, 105, 85)).toBe(1)
    expect(phaseFor(97.1, 105, 85)).toBe(1)
    expect(phaseFor(97, 105, 85)).toBe(2)
    expect(phaseFor(90.1, 105, 85)).toBe(2)
    expect(phaseFor(90, 105, 85)).toBe(3)
    expect(phaseFor(85, 105, 85)).toBe(3)
  })
  it('bez cieľa chudnutia je fáza 3', () => {
    expect(phaseFor(80, 80, 85)).toBe(3)
  })
})

describe('currentWeightKg', () => {
  const day = (date: string, weightKg?: number) => (weightKg === undefined ? { date } : { date, weightKg })
  it('7-dňový priemer, keď má aspoň 3 body', () => {
    const days = [day('2026-09-10', 105), day('2026-09-11', 104.6), day('2026-09-12', 104.9), day('2026-09-13')]
    expect(currentWeightKg(days, '2026-09-13', 120)).toBe(104.8)
  })
  it('inak posledné váženie, bez ohľadu na poradie v poli', () => {
    expect(currentWeightKg([day('2026-09-12', 103), day('2026-09-10', 105)], '2026-09-13', 120)).toBe(103)
  })
  it('bez vážení štartovacia hmotnosť', () => {
    expect(currentWeightKg([day('2026-09-12')], '2026-09-13', 120)).toBe(120)
  })
  it('weightPoints vyberie len dni s hmotnosťou', () => {
    expect(weightPoints([day('2026-09-12'), day('2026-09-13', 100)])).toEqual([{ date: '2026-09-13', weightKg: 100 }])
  })
})
