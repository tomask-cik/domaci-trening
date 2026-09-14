import { describe, expect, it } from 'vitest'
import { dayTotals, parseNutrition, proteinProgress, scaleToGrams, validGrams } from '../src/domain/food'
import { buildDayContext, buildWeekContext } from '../src/domain/summary'
import { backupOverdue, daysSinceBackup } from '../src/lib/storage'
import type { FoodEntry } from '../src/domain/types'

const entry = (p: Partial<FoodEntry> = {}): FoodEntry => ({
  date: '2026-09-14',
  name: 'jedlo',
  grams: 100,
  kcal: 200,
  proteinG: 10,
  source: 'manual',
  ...p,
})

describe('prepočet jedla', () => {
  it('zo 100 g na skutočnú gramáž', () => {
    const n = { label: 'Banán', kcalPer100: 89, proteinPer100: 1.1, note: '' }
    expect(scaleToGrams(n, 120)).toEqual({ kcal: 107, proteinG: 1.3 })
    expect(scaleToGrams(n, 100)).toEqual({ kcal: 89, proteinG: 1.1 })
    expect(scaleToGrams(n, 50)).toEqual({ kcal: 45, proteinG: 0.6 })
  })
  it('súčty dňa', () => {
    const t = dayTotals([entry(), entry({ kcal: 350, proteinG: 25 })])
    expect(t).toEqual({ kcal: 550, proteinG: 35, count: 2 })
    expect(dayTotals([])).toEqual({ kcal: 0, proteinG: 0, count: 0 })
  })
  it('podiel bielkovín na cieli sa zastaví na 100 %', () => {
    expect(proteinProgress({ kcal: 0, proteinG: 80, count: 1 }, 160)).toBe(50)
    expect(proteinProgress({ kcal: 0, proteinG: 200, count: 1 }, 160)).toBe(100)
    expect(proteinProgress({ kcal: 0, proteinG: 10, count: 1 }, 0)).toBe(0)
  })
  it('kontrola gramáže', () => {
    expect(validGrams(100)).toBe(true)
    expect(validGrams(0)).toBe(false)
    expect(validGrams(null)).toBe(false)
    expect(validGrams(99999)).toBe(false)
  })
})

describe('čítanie odpovede z AI', () => {
  it('číta čistý JSON', () => {
    const r = parseNutrition('{"label":"Banán","kcalPer100":89,"proteinPer100":1.1,"note":"stredný kus"}')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.label).toBe('Banán')
      expect(r.value.kcalPer100).toBe(89)
    }
  })
  it('poradí si s textom a markdownom okolo JSON', () => {
    const r = parseNutrition('Tu je odhad:\n```json\n{"label":"Kofola","kcalPer100":32,"proteinPer100":0}\n```\nDobrú chuť.')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.kcalPer100).toBe(32)
  })
  it('odmietne nezmyselné hodnoty', () => {
    expect(parseNutrition('{"kcalPer100":5000,"proteinPer100":2}').ok).toBe(false)
    expect(parseNutrition('{"kcalPer100":-5,"proteinPer100":2}').ok).toBe(false)
    expect(parseNutrition('{"kcalPer100":200,"proteinPer100":500}').ok).toBe(false)
  })
  it('odmietne odpoveď bez čísel alebo bez JSON', () => {
    expect(parseNutrition('Neviem, čo to je.').ok).toBe(false)
    expect(parseNutrition('{"label":"nieco"}').ok).toBe(false)
    expect(parseNutrition('{nie je json}').ok).toBe(false)
  })
  it('rozpozná, že model jedlo nepozná', () => {
    const r = parseNutrition('{"neznama":true,"note":"upresni druh"}')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('nepozná')
  })
  it('akceptuje čísla ako reťazec s čiarkou', () => {
    const r = parseNutrition('{"label":"Mlieko","kcalPer100":"46,5","proteinPer100":"3,4"}')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.kcalPer100).toBe(46.5)
  })
})

describe('stav zálohy', () => {
  const now = new Date('2026-09-14T12:00:00Z')
  it('počíta dni od poslednej zálohy', () => {
    expect(daysSinceBackup('2026-09-10T12:00:00Z', now)).toBe(4)
    expect(daysSinceBackup(undefined, now)).toBeNull()
    expect(daysSinceBackup('nezmysel', now)).toBeNull()
  })
  it('upozorní po 14 dňoch aj keď záloha nikdy nebola', () => {
    expect(backupOverdue(undefined, now)).toBe(true)
    expect(backupOverdue('2026-09-13T12:00:00Z', now)).toBe(false)
    expect(backupOverdue('2026-08-20T12:00:00Z', now)).toBe(true)
  })
})

describe('podklady pre AI sumár', () => {
  it('denný kontext spočíta jedlá a doplní ciele', () => {
    const ctx = buildDayContext(
      '2026-09-14',
      [entry({ name: 'Banán', kcal: 107, proteinG: 1.3 }), entry({ name: 'Tvaroh', kcal: 200, proteinG: 25 })],
      { date: '2026-09-14', weightKg: 104.2, steps: 8000 },
      { kcal: 2230, proteinG: 175 },
      true,
    )
    expect(ctx.kcal).toBe(307)
    expect(ctx.proteinG).toBe(26.3)
    expect(ctx.kcalTarget).toBe(2230)
    expect(ctx.weightKg).toBe(104.2)
    expect(ctx.foods).toHaveLength(2)
    expect(ctx.trainedToday).toBe(true)
  })

  it('denný kontext zvládne prázdny deň', () => {
    const ctx = buildDayContext('2026-09-14', [], undefined, { kcal: 2230, proteinG: 175 }, false)
    expect(ctx.kcal).toBe(0)
    expect(ctx.weightKg).toBeNull()
    expect(ctx.foods).toEqual([])
  })

  it('týždenný kontext ráta priemery a zmenu hmotnosti len z rozsahu', () => {
    const ctx = buildWeekContext(
      '2026-09-07',
      '2026-09-13',
      [
        { date: '2026-09-07', weightKg: 105, steps: 6000 },
        { date: '2026-09-13', weightKg: 104.2, steps: 10000 },
        { date: '2026-09-20', weightKg: 100 },
      ],
      [entry({ date: '2026-09-07', kcal: 2000, proteinG: 150 }), entry({ date: '2026-09-13', kcal: 2400, proteinG: 170 })],
      [
        { id: 1, date: '2026-09-08', template: 'A', startedAt: 'x', finishedAt: 'y', isDeload: false, minutes: 45 },
        { id: 2, date: '2026-09-25', template: 'B', startedAt: 'x', finishedAt: 'y', isDeload: false, minutes: 45 },
      ],
      { kcal: 2230, proteinG: 175 },
      2,
    )
    expect(ctx.workouts).toBe(1)
    expect(ctx.avgKcal).toBe(2200)
    expect(ctx.daysLogged).toBe(2)
    expect(ctx.weightChangeKg).toBe(-0.8)
    expect(ctx.avgSteps).toBe(8000)
    expect(ctx.prCount).toBe(2)
  })

  it('týždeň bez dát nevracia vymyslené čísla', () => {
    const ctx = buildWeekContext('2026-09-07', '2026-09-13', [], [], [], { kcal: 2230, proteinG: 175 }, 0)
    expect(ctx.avgKcal).toBeNull()
    expect(ctx.weightChangeKg).toBeNull()
    expect(ctx.avgSteps).toBeNull()
    expect(ctx.workouts).toBe(0)
  })

  it('neukončené tréningy sa do týždňa nerátajú', () => {
    const ctx = buildWeekContext(
      '2026-09-07',
      '2026-09-13',
      [],
      [],
      [{ id: 1, date: '2026-09-08', template: 'A', startedAt: 'x', isDeload: false, minutes: 0 }],
      { kcal: 2230, proteinG: 175 },
      0,
    )
    expect(ctx.workouts).toBe(0)
  })
})
