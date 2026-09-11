import { describe, expect, it } from 'vitest'
import { addDays, dayOfWeekSk, diffDays, formatSk, weekIndex, weekStart } from '../src/domain/dates'

describe('dates', () => {
  it('weekStart je pondelok', () => {
    expect(weekStart('2026-09-07')).toBe('2026-09-07') // pondelok
    expect(weekStart('2026-09-13')).toBe('2026-09-07') // nedeľa
    expect(weekStart('2026-09-14')).toBe('2026-09-14')
  })
  it('addDays cez mesiac', () => {
    expect(addDays('2026-09-28', 5)).toBe('2026-10-03')
    expect(addDays('2026-10-03', -5)).toBe('2026-09-28')
  })
  it('diffDays a weekIndex', () => {
    expect(diffDays('2026-09-07', '2026-09-21')).toBe(14)
    expect(weekIndex('2026-09-07', '2026-09-07')).toBe(0)
    expect(weekIndex('2026-09-20', '2026-09-07')).toBe(1)
    expect(weekIndex('2026-09-06', '2026-09-07')).toBe(-1)
    expect(weekIndex('2026-09-10', '2026-09-09')).toBe(0) // štart v stredu → týždeň od pondelka
  })
  it('formát', () => {
    expect(formatSk('2026-09-07')).toBe('7. 9. 2026')
    expect(dayOfWeekSk('2026-09-07')).toBe('Po')
    expect(dayOfWeekSk('2026-09-13')).toBe('Ne')
  })
})
