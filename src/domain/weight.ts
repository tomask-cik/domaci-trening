import { MA_MIN_POINTS, MA_WINDOW_DAYS, PHASE_THRESHOLDS } from './constants'
import { addDays } from './dates'
import type { DayLog } from './types'

export interface WeightPoint {
  date: string
  weightKg: number
}

/** Len dni so zapísanou hmotnosťou, v poradí, v akom prišli. */
export function weightPoints(days: DayLog[]): WeightPoint[] {
  return days.filter((d): d is DayLog & { weightKg: number } => typeof d.weightKg === 'number').map((d) => ({ date: d.date, weightKg: d.weightKg }))
}

/**
 * „Aktuálna hmotnosť“ pre všetky výpočty v appke: 7-dňový priemer, keď existuje; inak posledné
 * váženie; inak štartovacia hmotnosť. Jedno miesto namiesto troch kópií v obrazovkách –
 * fáza, kalórie na deload aj podlaha musia vychádzať z toho istého čísla.
 */
export function currentWeightKg(days: DayLog[], today: string, fallbackKg: number): number {
  const points = weightPoints(days)
  const avg = movingAverage(points, today)
  if (avg !== null) return avg
  const last = [...points].sort((a, b) => (a.date < b.date ? -1 : 1)).at(-1)
  return last?.weightKg ?? fallbackKg
}

function round1(x: number): number {
  return Math.round(x * 10) / 10
}

/** Priemer vážení v okne (atDate − window + 1 .. atDate). Null, ak je menej než MA_MIN_POINTS bodov. */
export function movingAverage(
  points: WeightPoint[],
  atDate: string,
  window: number = MA_WINDOW_DAYS,
  minPoints: number = MA_MIN_POINTS,
): number | null {
  const from = addDays(atDate, -(window - 1))
  const inWindow = points.filter((p) => p.date >= from && p.date <= atDate)
  if (inWindow.length < minPoints) return null
  const sum = inWindow.reduce((s, p) => s + p.weightKg, 0)
  return round1(sum / inWindow.length)
}

/** Séria pre graf: každý zapísaný deň + kĺzavý priemer k tomu dňu. */
export function trendSeries(points: WeightPoint[]): { date: string; kg: number; avg: number | null }[] {
  const sorted = [...points].sort((a, b) => (a.date < b.date ? -1 : 1))
  return sorted.map((p) => ({ date: p.date, kg: p.weightKg, avg: movingAverage(sorted, p.date) }))
}

export interface WeeklyRate {
  avgThis: number | null
  avgPrev: number | null
  /** kg za týždeň; záporné = chudnutie. Null, ak chýbajú dáta. */
  rateKgPerWeek: number | null
}

/** Priemer týždňa (pondelok..nedeľa) mínus priemer predchádzajúceho týždňa. */
export function weeklyRate(points: WeightPoint[], weekStartISO: string, minPoints: number = MA_MIN_POINTS): WeeklyRate {
  const endThis = addDays(weekStartISO, 6)
  const endPrev = addDays(weekStartISO, -1)
  const avgThis = movingAverage(points, endThis, 7, minPoints)
  const avgPrev = movingAverage(points, endPrev, 7, minPoints)
  const rate = avgThis !== null && avgPrev !== null ? round1(avgThis - avgPrev) : null
  return { avgThis, avgPrev, rateKgPerWeek: rate }
}

/** Fáza programu 1–3 podľa podielu prejdenej cesty (PROGRAM.md 6). */
export function phaseFor(currentKg: number, startKg: number, targetKg: number): 1 | 2 | 3 {
  const total = startKg - targetKg
  if (total <= 0) return 3
  const progress = (startKg - currentKg) / total
  const [t1, t2] = PHASE_THRESHOLDS
  if (progress < t1) return 1
  if (progress < t2) return 2
  return 3
}

export const PHASE_NAMES: Record<1 | 2 | 3, string> = {
  1: 'Fáza 1 – Základy',
  2: 'Fáza 2 – Sila',
  3: 'Fáza 3 – Dokončenie',
}

/** Hmotnosť, pri ktorej sa prepne fáza (pre zobrazenie). */
export function phaseBoundaries(startKg: number, targetKg: number): [number, number] {
  const total = startKg - targetKg
  return [round1(startKg - total * PHASE_THRESHOLDS[0]), round1(startKg - total * PHASE_THRESHOLDS[1])]
}
