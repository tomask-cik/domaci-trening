import { describe, expect, it } from 'vitest'
import { computeWeeklyReview, pendingReviewWeeks } from '../src/domain/review'
import type { DayLog, Settings } from '../src/domain/types'

const settings: Settings = {
  id: 1, createdAt: '2026-09-07', sex: 'm', age: 35, heightCm: 180, startWeightKg: 105, targetWeightKg: 85, bodyFatPct: null,
  kettlebells: [12, 16, 24], hasBand: true, hasMat: true, daysPerWeek: 3, minutesPerSession: 45, stepsStart: 6000, stepsGoal: 9000,
  activityFactor: 1.4, calorieTarget: 2310, programStartDate: '2026-09-07', cycleStartDate: '2026-09-07', deloadEveryWeeks: 7,
  manualDeloadWeeks: [], breakReminders: true,
}

function days(from: string, kgs: (number | null)[], extra: Partial<DayLog> = {}): DayLog[] {
  return kgs.map((kg, i) => {
    const d = new Date(from)
    d.setDate(d.getDate() + i)
    const date = d.toISOString().slice(0, 10)
    return kg === null ? { date, ...extra } : { date, weightKg: kg, ...extra }
  })
}

describe('pendingReviewWeeks', () => {
  it('uzavreté týždne bez vyhodnotenia', () => {
    expect(pendingReviewWeeks(settings, [], '2026-09-21')).toEqual(['2026-09-07', '2026-09-14'])
    expect(pendingReviewWeeks(settings, [{ weekStart: '2026-09-07' } as never], '2026-09-21')).toEqual(['2026-09-14'])
    expect(pendingReviewWeeks(settings, [], '2026-09-13')).toEqual([])
  })
})

describe('computeWeeklyReview', () => {
  it('prvý týždeň: cieľ sa nemení (< 14 dní)', () => {
    const r = computeWeeklyReview(settings, days('2026-09-07', [105, 105, 105, 105, 105, 105, 105]), '2026-09-07', '2026-09-14')
    expect(r.newTarget).toBe(2310)
    expect(r.reason).toContain('14 dní')
  })
  it('druhý týždeň s pomalým chudnutím → dole, ale nie pod podlahu BMR × 1,1', () => {
    const d = [...days('2026-09-07', [105, 105, 105, 105, 105, 105, 105]), ...days('2026-09-14', [104.9, 104.9, 104.9, 104.9, 104.9, 104.9, 104.9])]
    const r = computeWeeklyReview(settings, d, '2026-09-14', '2026-09-21')
    expect(r.rateKgPerWeek).toBe(-0.1)
    // krok by bol −150 (2160), podlaha pri BMR 2004 je 2200 → cieľ 2200 a rada pridať kroky
    expect(r.newTarget).toBe(2200)
    expect(r.reason).toContain('kroky')
  })
  it('keď je nad podlahou, urobí celý krok −150', () => {
    // 90 kg: BMR 1854, podlaha 2040; cieľ 2400 má priestor klesnúť na 2250
    const s2 = { ...settings, calorieTarget: 2400 }
    const d = [...days('2026-09-07', [90, 90, 90, 90, 90, 90, 90]), ...days('2026-09-14', [89.9, 89.9, 89.9, 89.9, 89.9, 89.9, 89.9])]
    const r = computeWeeklyReview(s2, d, '2026-09-14', '2026-09-21')
    expect(r.newTarget).toBe(2250)
    expect(r.reason).not.toContain('kroky')
  })
  it('podlaha zodpovedá deficitu ~550 kcal – hlbšie sa rezať nedá', () => {
    const s2 = { ...settings, calorieTarget: 2100 }
    const d = [...days('2026-09-07', [90, 90, 90, 90, 90, 90, 90]), ...days('2026-09-14', [89.9, 89.9, 89.9, 89.9, 89.9, 89.9, 89.9])]
    const r = computeWeeklyReview(s2, d, '2026-09-14', '2026-09-21')
    expect(r.newTarget).toBe(2040)
    expect(r.reason).toContain('kroky')
  })
  it('málo vážení → bez zmeny', () => {
    const d = [...days('2026-09-07', [105, 105, 105, 105, 105, 105, 105]), ...days('2026-09-14', [104, null, null, null, null, null, 103])]
    const r = computeWeeklyReview(settings, d, '2026-09-14', '2026-09-21')
    expect(r.newTarget).toBe(2310)
    expect(r.reason).toContain('Málo vážení')
  })
  it('krátky spánok ≥ 3 noci → +150 kcal', () => {
    const d = [...days('2026-09-07', [105, 105, 105, 105, 105, 105, 105]), ...days('2026-09-14', [104.4, 104.4, 104.4, 104.4, 104.4, 104.4, 104.4], { sleepH: 5 })]
    const r = computeWeeklyReview(settings, d, '2026-09-14', '2026-09-21')
    // tempo 0,6 kg v pásme → delta 0, potom +150 za spánok
    expect(r.newTarget).toBe(2460)
    expect(r.reason).toContain('Spánok')
  })
  it('deload týždeň cieľ nemení (je sa na udržiavacej úrovni)', () => {
    // 2026-10-19 je 7. týždeň cyklu => deload; hmotnosť stojí, ale kalórie sa nesmú znížiť
    const d = [...days('2026-10-12', [100, 100, 100, 100, 100, 100, 100]), ...days('2026-10-19', [100, 100, 100, 100, 100, 100, 100])]
    const r = computeWeeklyReview(settings, d, '2026-10-19', '2026-10-26')
    expect(r.newTarget).toBe(settings.calorieTarget)
    expect(r.reason).toContain('Deload')
  })
  it('týždeň po deloade sa už vyhodnocuje normálne', () => {
    const d = [...days('2026-10-19', [100, 100, 100, 100, 100, 100, 100]), ...days('2026-10-26', [100, 100, 100, 100, 100, 100, 100])]
    const r = computeWeeklyReview(settings, d, '2026-10-26', '2026-11-02')
    expect(r.newTarget).toBeLessThan(settings.calorieTarget)
  })
  it('so zapísaným príjmom sa výdaj počíta priamo', () => {
    const d = [...days('2026-09-07', [105, 105, 105, 105, 105, 105, 105]), ...days('2026-09-14', [104.5, 104.5, 104.5, 104.5, 104.5, 104.5, 104.5], { kcal: 2300 })]
    const r = computeWeeklyReview(settings, d, '2026-09-14', '2026-09-21')
    // výdaj = 2300 + 0,5 × 1100 = 2850 → cieľ 2350 → +40
    expect(r.newTarget).toBe(2350)
  })
})
