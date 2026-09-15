import {
  PROTEIN_MAX_PER_KG_TARGET,
  PROTEIN_MEALS,
  PROTEIN_MIN_PER_KG_TARGET,
  PROTEIN_PER_KG_FFM,
  PROTEIN_PER_KG_TARGET,
} from './constants'

export interface ProteinInput {
  targetWeightKg: number
  /**
   * Hmotnosť, pri ktorej bolo zmerané % tuku (spravidla štartovacia). Čistá hmota je to, čo sa
   * program snaží zachovať, takže sa neprepočítava s klesajúcou hmotnosťou – inak by cieľ
   * bielkovín klesal práve vtedy, keď je najviac potrebný (RESEARCH R2).
   */
  referenceWeightKg: number
  bodyFatPct: number | null
}

export interface ProteinResult {
  gramsPerDay: number
  perMeal: number
  basis: string
}

function round5(x: number): number {
  return Math.round(x / 5) * 5
}

/**
 * RESEARCH R2: 2,3 g/kg čistej hmoty, ak je známe % tuku; inak 2,0 g/kg cieľovej hmotnosti.
 * Ohraničené 1,6–2,4 g/kg cieľovej hmotnosti. Cieľ sa neviaže na aktuálnu hmotnosť.
 */
export function proteinTarget(input: ProteinInput): ProteinResult {
  const { targetWeightKg, referenceWeightKg, bodyFatPct } = input
  let grams: number
  let basis: string
  if (bodyFatPct !== null && bodyFatPct > 0 && bodyFatPct < 70) {
    const ffm = referenceWeightKg * (1 - bodyFatPct / 100)
    grams = PROTEIN_PER_KG_FFM * ffm
    basis = `${PROTEIN_PER_KG_FFM} g/kg čistej hmoty (${ffm.toFixed(1)} kg pri ${bodyFatPct} % tuku)`
  } else {
    grams = PROTEIN_PER_KG_TARGET * targetWeightKg
    basis = `${PROTEIN_PER_KG_TARGET.toFixed(1)} g/kg cieľovej hmotnosti (${targetWeightKg} kg)`
  }
  const min = PROTEIN_MIN_PER_KG_TARGET * targetWeightKg
  const max = PROTEIN_MAX_PER_KG_TARGET * targetWeightKg
  const clamped = Math.min(max, Math.max(min, grams))
  const gramsPerDay = round5(clamped)
  return { gramsPerDay, perMeal: Math.round(gramsPerDay / PROTEIN_MEALS), basis }
}

/**
 * Cieľ bielkovín z nastavení. Referenčná hmotnosť je tá, pri ktorej sa % tuku meralo
 * (`bodyFatRefKg`); pri starších nastaveniach štartovacia. Bez toho by nové meranie pri 95 kg
 * počítalo čistú hmotu zo 105 kg.
 */
export function proteinFor(s: { targetWeightKg: number; startWeightKg: number; bodyFatPct: number | null; bodyFatRefKg?: number }): ProteinResult {
  return proteinTarget({ targetWeightKg: s.targetWeightKg, referenceWeightKg: s.bodyFatRefKg ?? s.startWeightKg, bodyFatPct: s.bodyFatPct })
}
