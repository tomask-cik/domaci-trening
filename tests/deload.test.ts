import { describe, expect, it } from 'vitest'
import { isDeloadWeek, nextDeloadWeekStart, shouldSuggestEarlyDeload, startManualDeload, weekCalendar } from '../src/domain/deload'

const s = { cycleStartDate: '2026-09-07', deloadEveryWeeks: 7, manualDeloadWeeks: [] as string[] }

describe('isDeloadWeek', () => {
  it('7. týždeň cyklu je deload (index 6)', () => {
    expect(isDeloadWeek('2026-09-07', s)).toBe(false) // týždeň 1
    expect(isDeloadWeek('2026-10-12', s)).toBe(false) // týždeň 6
    expect(isDeloadWeek('2026-10-19', s)).toBe(true) // týždeň 7
    expect(isDeloadWeek('2026-10-25', s)).toBe(true) // nedeľa toho istého týždňa
    expect(isDeloadWeek('2026-10-26', s)).toBe(false) // týždeň 8
    expect(isDeloadWeek('2026-12-07', s)).toBe(true) // týždeň 14
  })
  it('pred štartom cyklu nie je deload', () => {
    expect(isDeloadWeek('2026-08-31', s)).toBe(false)
  })
  it('manuálny deload', () => {
    const m = startManualDeload(s, '2026-09-23')
    expect(m.manualDeloadWeeks).toEqual(['2026-09-21'])
    expect(m.cycleStartDate).toBe('2026-09-28')
    expect(isDeloadWeek('2026-09-24', m)).toBe(true)
    // nový cyklus: 7. týždeň od 2026-09-28 = 2026-11-09
    expect(isDeloadWeek('2026-11-09', m)).toBe(true)
    expect(isDeloadWeek('2026-10-19', m)).toBe(false)
  })
})

describe('kalendár', () => {
  it('prvých 14 týždňov má deload na 7. a 14.', () => {
    const cal = weekCalendar('2026-09-07', 14, s)
    expect(cal.filter((w) => w.deload).map((w) => w.weekStart)).toEqual(['2026-10-19', '2026-12-07'])
    expect(nextDeloadWeekStart('2026-09-07', s)).toBe('2026-10-19')
    expect(nextDeloadWeekStart('2026-10-20', s)).toBe('2026-10-19')
  })
})

describe('skorší deload', () => {
  it('2 zo 4 znakov', () => {
    expect(shouldSuggestEarlyDeload({ repsDroppedTwice: true, jointPain: false, shortSleepNights: false, highRpe: false })).toBe(false)
    expect(shouldSuggestEarlyDeload({ repsDroppedTwice: true, jointPain: true, shortSleepNights: false, highRpe: false })).toBe(true)
  })
})
