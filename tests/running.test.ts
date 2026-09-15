import { describe, expect, it } from 'vitest'
import { formatDuration, formatPace, grossKcal, netKcal, paceSecPerKm, toSeconds, validRun } from '../src/domain/running'

describe('tempo a čas', () => {
  it('tempo zo vzdialenosti a času', () => {
    expect(paceSecPerKm(5000, 1800)).toBe(360) // 6:00 min/km
    expect(paceSecPerKm(10000, 3000)).toBe(300) // 5:00 min/km
    expect(paceSecPerKm(0, 600)).toBeNull()
    expect(paceSecPerKm(1000, 0)).toBeNull()
  })
  it('formát tempa', () => {
    expect(formatPace(360)).toBe('6:00 min/km')
    expect(formatPace(345)).toBe('5:45 min/km')
    expect(formatPace(null)).toBe('–')
  })
  it('formát trvania', () => {
    expect(formatDuration(1800)).toBe('30:00')
    expect(formatDuration(3725)).toBe('1:02:05')
    expect(formatDuration(0)).toBe('0:00')
  })
  it('minúty a sekundy na sekundy', () => {
    expect(toSeconds(30, 15)).toBe(1815)
    expect(toSeconds(null, null)).toBe(0)
    expect(toSeconds(5, null)).toBe(300)
  })
})

describe('kalórie z behu', () => {
  it('hrubý výdaj rastie so vzdialenosťou aj hmotnosťou', () => {
    const a = grossKcal({ meters: 5000, seconds: 1800, weightKg: 100 })
    const b = grossKcal({ meters: 10000, seconds: 3600, weightKg: 100 })
    const c = grossKcal({ meters: 5000, seconds: 1800, weightKg: 80 })
    expect(a).toBe(518)
    expect(b).toBe(2 * a)
    expect(c).toBeLessThan(a)
  })
  it('čistý výdaj je nižší než hrubý o pokojový metabolizmus', () => {
    const input = { meters: 5000, seconds: 1800, weightKg: 100 }
    expect(netKcal(input)).toBeLessThan(grossKcal(input))
    expect(netKcal(input)).toBe(518 - 53)
  })
  it('pomalší beh na rovnakej trase minie podobne, ale čistý výdaj je nižší', () => {
    const rychly = netKcal({ meters: 5000, seconds: 1500, weightKg: 100 })
    const pomaly = netKcal({ meters: 5000, seconds: 2400, weightKg: 100 })
    expect(pomaly).toBeLessThan(rychly)
    expect(rychly - pomaly).toBeLessThan(50)
  })
  it('nula alebo nezmysel nevráti zápornú hodnotu', () => {
    expect(grossKcal({ meters: 0, seconds: 0, weightKg: 100 })).toBe(0)
    expect(netKcal({ meters: 0, seconds: 3600, weightKg: 100 })).toBe(0)
    expect(grossKcal({ meters: 5000, seconds: 1800, weightKg: 0 })).toBe(0)
  })
})

describe('kontrola zadania', () => {
  it('prijme rozumný beh', () => {
    expect(validRun(5000, 1800)).toBe(true)
  })
  it('odmietne nuly, zápory a nezmysly', () => {
    expect(validRun(0, 1800)).toBe(false)
    expect(validRun(5000, 0)).toBe(false)
    expect(validRun(-100, 1800)).toBe(false)
    expect(validRun(null, 1800)).toBe(false)
    expect(validRun(200000, 1800)).toBe(false)
    expect(validRun(5000, 20 * 3600)).toBe(false)
  })
})
