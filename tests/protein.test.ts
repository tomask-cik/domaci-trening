import { describe, expect, it } from 'vitest'
import { proteinFor, proteinTarget } from '../src/domain/protein'

describe('proteinTarget', () => {
  it('bez % tuku: 2,0 g/kg cieľovej hmotnosti', () => {
    const r = proteinTarget({ targetWeightKg: 85, referenceWeightKg: 105, bodyFatPct: null })
    expect(r.gramsPerDay).toBe(170)
    expect(r.perMeal).toBe(43)
    expect(r.basis).toContain('cieľovej')
  })
  it('s % tuku: 2,3 g/kg čistej hmoty', () => {
    // FFM = 105 × 0,7 = 73,5 → 169 → 170
    const r = proteinTarget({ targetWeightKg: 85, referenceWeightKg: 105, bodyFatPct: 30 })
    expect(r.gramsPerDay).toBe(170)
    expect(r.basis).toContain('čistej')
  })
  it('ohraničenie 1,6–2,4 g/kg cieľovej hmotnosti', () => {
    // veľmi nízke % tuku a vysoká hmotnosť → 2,3 × 120 × 0,9 = 248 → strop 2,4 × 85 = 204 → 205
    const hi = proteinTarget({ targetWeightKg: 85, referenceWeightKg: 120, bodyFatPct: 10 })
    expect(hi.gramsPerDay).toBe(205)
    // vysoké % tuku → 2,3 × 105 × 0,4 = 96,6 → podlaha 136 → 135
    const lo = proteinTarget({ targetWeightKg: 85, referenceWeightKg: 105, bodyFatPct: 60 })
    expect(lo.gramsPerDay).toBe(135)
  })
  it('cieľ sa nemení s aktuálnou hmotnosťou, keď nie je % tuku', () => {
    const a = proteinTarget({ targetWeightKg: 85, referenceWeightKg: 105, bodyFatPct: null })
    const b = proteinTarget({ targetWeightKg: 85, referenceWeightKg: 95, bodyFatPct: null })
    expect(a.gramsPerDay).toBe(b.gramsPerDay)
  })
  it('referenčná hmotnosť je tá, pri ktorej sa meral tuk – cieľ neklesá s chudnutím', () => {
    // 105 kg pri 30 % tuku => FFM 73,5 kg => 169 g. Po schudnutí na 95 kg zostáva cieľ rovnaký,
    // lebo čistá hmota sa nemá meniť; prepočet z 95 kg by dal o 16 g menej.
    const start = proteinTarget({ targetWeightKg: 85, referenceWeightKg: 105, bodyFatPct: 30 })
    const naive = proteinTarget({ targetWeightKg: 85, referenceWeightKg: 95, bodyFatPct: 30 })
    expect(start.gramsPerDay).toBe(170)
    expect(naive.gramsPerDay).toBeLessThan(start.gramsPerDay)
  })
})

describe('proteinFor', () => {
  it('nové meranie tuku pri nižšej hmotnosti počíta čistú hmotu z tej hmotnosti', () => {
    // 25 % pri 95 kg: FFM 71,25 × 2,3 = 163,9 → 165; zo 105 kg by vyšlo 181 → 180.
    expect(proteinFor({ targetWeightKg: 85, startWeightKg: 105, bodyFatPct: 25, bodyFatRefKg: 95 }).gramsPerDay).toBe(165)
    expect(proteinFor({ targetWeightKg: 85, startWeightKg: 105, bodyFatPct: 25 }).gramsPerDay).toBe(180)
  })
  it('berie cieľovú a štartovaciu hmotnosť z nastavení', () => {
    expect(proteinFor({ targetWeightKg: 85, startWeightKg: 105, bodyFatPct: null }).gramsPerDay).toBe(170)
    expect(proteinFor({ targetWeightKg: 85, startWeightKg: 105, bodyFatPct: 30 })).toEqual(proteinTarget({ targetWeightKg: 85, referenceWeightKg: 105, bodyFatPct: 30 }))
  })
})
