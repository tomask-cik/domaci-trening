/**
 * Podklady pre AI sumár.
 *
 * Do modelu neposielame celú databázu – zostavíme malý objekt s číslami, ktoré niečo
 * znamenajú. Všetko je čistá funkcia, takže sa to dá otestovať bez volania API.
 */

import { dayTotals } from './food'
import type { DayLog, FoodEntry, Workout } from './types'

export interface DayContext {
  date: string
  kcal: number
  kcalTarget: number
  proteinG: number
  proteinTargetG: number
  foods: { name: string; grams: number; kcal: number; proteinG: number }[]
  weightKg: number | null
  steps: number | null
  trainedToday: boolean
}

export function buildDayContext(
  date: string,
  foods: FoodEntry[],
  day: DayLog | undefined,
  targets: { kcal: number; proteinG: number },
  trainedToday: boolean,
): DayContext {
  const t = dayTotals(foods)
  return {
    date,
    kcal: t.kcal,
    kcalTarget: targets.kcal,
    proteinG: Math.round(t.proteinG * 10) / 10,
    proteinTargetG: targets.proteinG,
    foods: foods.map((f) => ({ name: f.name, grams: f.grams, kcal: f.kcal, proteinG: f.proteinG })),
    weightKg: day?.weightKg ?? null,
    steps: day?.steps ?? null,
    trainedToday,
  }
}

export interface WeekContext {
  from: string
  to: string
  workouts: number
  workoutDates: string[]
  avgKcal: number | null
  kcalTarget: number
  daysLogged: number
  avgProteinG: number | null
  proteinTargetG: number
  weightStartKg: number | null
  weightEndKg: number | null
  weightChangeKg: number | null
  avgSteps: number | null
  prCount: number
}

function mean(xs: number[]): number | null {
  return xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null
}

export function buildWeekContext(
  from: string,
  to: string,
  days: DayLog[],
  foods: FoodEntry[],
  workouts: Workout[],
  targets: { kcal: number; proteinG: number },
  prCount: number,
): WeekContext {
  const inRange = <T extends { date: string }>(xs: T[]) => xs.filter((x) => x.date >= from && x.date <= to)
  const d = inRange(days).sort((a, b) => (a.date < b.date ? -1 : 1))
  const f = inRange(foods)
  const w = inRange(workouts).filter((x) => x.finishedAt)

  const byDate = new Map<string, FoodEntry[]>()
  for (const x of f) byDate.set(x.date, [...(byDate.get(x.date) ?? []), x])
  const dayKcals = [...byDate.values()].map((xs) => dayTotals(xs).kcal)
  const dayProteins = [...byDate.values()].map((xs) => dayTotals(xs).proteinG)

  const weights = d.map((x) => x.weightKg).filter((x): x is number => typeof x === 'number')
  const steps = d.map((x) => x.steps).filter((x): x is number => typeof x === 'number')
  const start = weights[0] ?? null
  const end = weights.at(-1) ?? null

  return {
    from,
    to,
    workouts: w.length,
    workoutDates: w.map((x) => x.date),
    avgKcal: mean(dayKcals),
    kcalTarget: targets.kcal,
    daysLogged: byDate.size,
    avgProteinG: mean(dayProteins),
    proteinTargetG: targets.proteinG,
    weightStartKg: start,
    weightEndKg: end,
    weightChangeKg: start !== null && end !== null ? Math.round((end - start) * 10) / 10 : null,
    avgSteps: steps.length ? Math.round(steps.reduce((a, b) => a + b, 0) / steps.length) : null,
    prCount,
  }
}

export const DAY_SYSTEM = `Si tréner a výživový poradca. Dostaneš JSON so záznamom jedného dňa.
Napíš po slovensky krátke zhrnutie – maximálne 6 viet, bez nadpisov a bez odrážok.
Povedz, ako deň vyšiel oproti cieľom, čo bolo dobré a čo by si zmenil zajtra.
Buď konkrétny a vychádzaj len z čísel, ktoré máš. Keď je dáta málo, povedz to namiesto hádania.
Nikdy neodporúčaj denný príjem pod 1200 kcal ani vynechávanie jedál.`

export const WEEK_SYSTEM = `Si tréner a výživový poradca. Dostaneš JSON so súhrnom jedného týždňa.
Napíš po slovensky zhrnutie – maximálne 10 viet, bez nadpisov a bez odrážok.
Zhodnoť tréningovú dochádzku, priemerný príjem oproti cieľu, bielkoviny a trend hmotnosti.
Týždenné výkyvy hmotnosti do ±1 kg sú voda, nie tuk – neprikladaj im váhu.
Na koniec pridaj jednu konkrétnu vec, na ktorú sa má budúci týždeň sústrediť.
Vychádzaj len z čísel, ktoré máš. Nikdy neodporúčaj denný príjem pod 1200 kcal ani vynechávanie jedál.`
