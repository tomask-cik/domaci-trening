import {
  ACTIVITY_FACTOR,
  CALORIE_FLOOR_ABS,
  CALORIE_FLOOR_BMR_FACTOR,
  DEFICIT_KCAL,
  KCAL_PER_KG,
  MAX_WEEKLY_ADJUST_KCAL,
  RATE_MAX_PCT,
  RATE_MIN_PCT,
} from './constants'
import type { Sex } from './types'

/**
 * Zaokrúhlenie na 10 kcal, symetricky od nuly (−55 → −60, 55 → 60).
 * Epsilon odstraňuje artefakty plávajúcej čiarky: (0,5 − 0,45) × 7700 / 7 dá 54,999…,
 * čo by inak spadlo na 50. Rovnaký vstup tak vždy dá rovnaký výstup (determinizmus).
 */
export function round10(x: number): number {
  const EPS = 1e-9
  return Math.sign(x) * Math.round(Math.abs(x) / 10 + EPS) * 10
}

/** Mifflin-St Jeor (RESEARCH R10). */
export function mifflinStJeor(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return Math.round(sex === 'm' ? base + 5 : base - 161)
}

export function tdeeEstimate(bmr: number, activityFactor: number = ACTIVITY_FACTOR): number {
  return Math.round(bmr * activityFactor)
}

/** Štartovací cieľ = odhad výdaja − 500 kcal, zaokrúhlené na 10. */
export function initialCalorieTarget(bmr: number, activityFactor: number = ACTIVITY_FACTOR): number {
  return round10(tdeeEstimate(bmr, activityFactor) - DEFICIT_KCAL)
}

export function calorieFloor(bmr: number): number {
  return Math.max(CALORIE_FLOOR_ABS, round10(bmr * CALORIE_FLOOR_BMR_FACTOR))
}

/** Cieľové tempo chudnutia v kg/týždeň (kladné čísla) pre danú hmotnosť. */
export function targetRateRange(weightKg: number): [number, number] {
  return [Math.round(weightKg * RATE_MIN_PCT * 100) / 100, Math.round(weightKg * RATE_MAX_PCT * 100) / 100]
}

export interface AdaptInput {
  currentTarget: number
  weightKg: number
  /** Zmena 7-dňového priemeru za týždeň; záporné = chudnutie. */
  rateKgPerWeek: number
  bmr: number
  /** Odhad výdaja (strop cieľa). */
  tdee: number
  /** Priemerný zapísaný denný príjem za týždeň, ak existuje. */
  avgIntakeKcal?: number | null
}

export interface AdaptResult {
  newTarget: number
  delta: number
  reason: string
}

/**
 * Týždenná adaptácia (PROGRAM.md 7, RESEARCH R10):
 * - so zapísaným príjmom: výdaj ≈ príjem + (strata × 7700)/7, cieľ = výdaj − 500;
 * - bez neho: pomalšie než 0,5 %/týž → dole, rýchlejšie než 0,7 %/týž → hore, o (rozdiel × 7700)/7;
 * - krok max ±150 kcal, podlaha max(1500, BMR × 1,1), strop = odhad výdaja.
 */
export function adaptCalorieTarget(input: AdaptInput): AdaptResult {
  const { currentTarget, weightKg, rateKgPerWeek, bmr, tdee, avgIntakeKcal } = input
  const loss = -rateKgPerWeek // kladné = chudnutie
  const [minLoss, maxLoss] = targetRateRange(weightKg)
  let rawDelta = 0
  let reason = ''

  if (avgIntakeKcal !== null && avgIntakeKcal !== undefined && avgIntakeKcal > 0) {
    const measuredTdee = avgIntakeKcal + (loss * KCAL_PER_KG) / 7
    const desired = round10(measuredTdee - DEFICIT_KCAL)
    rawDelta = desired - currentTarget
    reason = `Z príjmu ${Math.round(avgIntakeKcal)} kcal a zmeny ${rateKgPerWeek.toFixed(1)} kg/týž vychádza výdaj ~${Math.round(measuredTdee)} kcal.`
  } else if (loss < minLoss) {
    rawDelta = -((minLoss - loss) * KCAL_PER_KG) / 7
    reason = `Chudnutie ${loss.toFixed(2)} kg/týž je pomalšie než cieľ ${minLoss.toFixed(2)}–${maxLoss.toFixed(2)} kg/týž.`
  } else if (loss > maxLoss) {
    rawDelta = ((loss - maxLoss) * KCAL_PER_KG) / 7
    reason = `Chudnutie ${loss.toFixed(2)} kg/týž je rýchlejšie než cieľ ${minLoss.toFixed(2)}–${maxLoss.toFixed(2)} kg/týž – chránime svaly.`
  } else {
    reason = `Chudnutie ${loss.toFixed(2)} kg/týž je v cieľovom pásme ${minLoss.toFixed(2)}–${maxLoss.toFixed(2)} kg/týž.`
  }

  let delta = Math.max(-MAX_WEEKLY_ADJUST_KCAL, Math.min(MAX_WEEKLY_ADJUST_KCAL, rawDelta))
  delta = round10(delta)
  let newTarget = currentTarget + delta
  const floor = calorieFloor(bmr)
  if (newTarget < floor) {
    newTarget = floor
    reason += ` Cieľ je na podlahe ${floor} kcal (BMR × 1,1) – ďalej už nerež kalórie, pridaj kroky a pohyb (RESEARCH R6).`
  }
  if (newTarget > tdee) {
    newTarget = round10(tdee)
    reason += ` Cieľ je na strope = odhad výdaja.`
  }
  return { newTarget, delta: newTarget - currentTarget, reason: reason.trim() }
}
