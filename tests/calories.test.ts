import { describe, expect, it } from 'vitest'
import { adaptCalorieTarget, calorieFloor, initialCalorieTarget, mifflinStJeor, round10, targetRateRange, tdeeEstimate } from '../src/domain/calories'

describe('mifflinStJeor', () => {
  it('muž 105 kg, 180 cm, 35 r.', () => {
    // 1050 + 1125 − 175 + 5 = 2005
    expect(mifflinStJeor('m', 105, 180, 35)).toBe(2005)
  })
  it('žena (zaokrúhlené na celé kcal)', () => {
    // 600 + 1031,25 − 150 − 161 = 1320,25 → 1320
    expect(mifflinStJeor('f', 60, 165, 30)).toBe(1320)
  })
})

describe('štartovací cieľ', () => {
  it('výdaj × 1,4 − 500, zaokrúhlené na 10', () => {
    const bmr = mifflinStJeor('m', 105, 180, 35)
    expect(tdeeEstimate(bmr)).toBe(2807)
    expect(initialCalorieTarget(bmr)).toBe(2310)
  })
  it('podlaha = max(1500, BMR × 1,1)', () => {
    expect(calorieFloor(2005)).toBe(2210)
    expect(calorieFloor(1200)).toBe(1500)
  })
  it('cieľové tempo 0,5–0,7 %', () => {
    expect(targetRateRange(100)).toEqual([0.5, 0.7])
    expect(targetRateRange(105)).toEqual([0.53, 0.74])
  })
})

describe('adaptCalorieTarget bez zápisu príjmu', () => {
  const base = { currentTarget: 2300, weightKg: 100, bmr: 1950, tdee: 2730 }
  it('v pásme → bez zmeny', () => {
    const r = adaptCalorieTarget({ ...base, rateKgPerWeek: -0.6 })
    expect(r.delta).toBe(0)
    expect(r.newTarget).toBe(2300)
  })
  it('pomalšie → dole, max −150', () => {
    // strata 0,1 vs min 0,5 → (0,4 × 7700)/7 = 440 → clamp −150
    const r = adaptCalorieTarget({ ...base, rateKgPerWeek: -0.1 })
    expect(r.delta).toBe(-150)
    expect(r.newTarget).toBe(2150)
  })
  it('mierne pomalšie → proporcionálne dole', () => {
    // strata 0,45 vs 0,5 → 0,05 × 7700/7 = 55 → −60 (symetrické zaokrúhlenie na 10)
    const r = adaptCalorieTarget({ ...base, rateKgPerWeek: -0.45 })
    expect(r.delta).toBe(-60)
  })
  it('rýchlejšie → hore, max +150', () => {
    const r = adaptCalorieTarget({ ...base, rateKgPerWeek: -1.5 })
    expect(r.delta).toBe(150)
  })
  it('priberanie → dole o max', () => {
    const r = adaptCalorieTarget({ ...base, rateKgPerWeek: 0.3 })
    expect(r.delta).toBe(-150)
  })
  it('nepodlezie podlahu a poradí kroky namiesto rezania', () => {
    const r = adaptCalorieTarget({ ...base, currentTarget: 2200, rateKgPerWeek: 0 })
    expect(r.newTarget).toBe(calorieFloor(1950))
    expect(r.reason).toContain('podlahe')
    expect(r.reason).toContain('kroky')
  })
  it('zaokrúhlenie na 10 je symetrické a odolné voči plávajúcej čiarke', () => {
    expect(round10(55)).toBe(60)
    expect(round10(-55)).toBe(-60)
    expect(round10(-54.999999999999986)).toBe(-60) // artefakt (0,5 − 0,45) × 7700 / 7
    expect(round10(-54)).toBe(-50)
    expect(round10(0)).toBe(0)
  })
  it('neprekročí strop (výdaj)', () => {
    const r = adaptCalorieTarget({ ...base, currentTarget: 2700, rateKgPerWeek: -2 })
    expect(r.newTarget).toBe(2730)
  })
})

describe('adaptCalorieTarget so zapísaným príjmom', () => {
  it('výdaj = príjem + strata × 7700/7; cieľ = výdaj − 500; krok max 150', () => {
    // príjem 2400, strata 0,5 kg → výdaj 2950 → cieľ 2450 → z 2300 je +150
    const r = adaptCalorieTarget({ currentTarget: 2300, weightKg: 100, rateKgPerWeek: -0.5, bmr: 1950, tdee: 3000, avgIntakeKcal: 2400 })
    expect(r.delta).toBe(150)
    expect(r.reason).toContain('2950')
  })
  it('malá korekcia sa zaokrúhli na 10', () => {
    // príjem 2300, strata 0,6 → výdaj 2960 → cieľ 2460 → z 2450 je +10
    const r = adaptCalorieTarget({ currentTarget: 2450, weightKg: 100, rateKgPerWeek: -0.6, bmr: 1950, tdee: 3000, avgIntakeKcal: 2300 })
    expect(r.delta).toBe(10)
  })
})
