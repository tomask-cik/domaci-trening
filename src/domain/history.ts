/**
 * História tréningov a osobné rekordy.
 *
 * Čisté funkcie nad tým, čo je už v databáze (workouts + sets) – nič nové sa neukladá,
 * takže história funguje spätne aj pre tréningy zapísané pred pridaním tejto obrazovky.
 *
 * Rekord sa počíta z jednej série, nie z celého tréningu:
 *  - cviky so záťažou (`load`): odhad 1RM (Epley) – porovná 20 kg × 10 op. s 24 kg × 8 op.
 *  - výdrže (`timed`) a štádiá v sekundách: sekundy
 *  - štádiá v opakovaniach (zhyby, dipy): opakovania
 */

import { addDays } from './dates'
import { EXERCISE_MAP } from './exercises'
import { estimated1RM } from './progression'
import type { SetLog, TemplateId, Workout } from './types'

export type ScoreUnit = 'kg1rm' | 'reps' | 'sec'

export interface PersonalRecord {
  exerciseId: string
  name: string
  score: number
  previous: number | null
  unit: ScoreUnit
  /** Ako séria vyzerala: „24 kg × 8 op.“ */
  detail: string
  date: string
}

export interface ExerciseLine {
  exerciseId: string
  name: string
  setCount: number
  /** Najlepšia séria tréningu, napr. „24 kg × 8 op.“ */
  best: string
  bestScore: number
  unit: ScoreUnit
  isPr: boolean
  /** Neprázdne poznámky k sériám v poradí sérií. */
  notes: string[]
}

export interface WorkoutSummary {
  workoutId: number
  date: string
  template: TemplateId
  isDeload: boolean
  setCount: number
  /** Σ (váha × opakovania) – len cviky so záťažou. */
  volumeKg: number
  avgRpe: number | null
  maxPain: number
  exercises: ExerciseLine[]
  prs: PersonalRecord[]
}

function unitFor(exerciseId: string): ScoreUnit {
  const ex = EXERCISE_MAP[exerciseId]
  if (!ex) return 'reps'
  if (ex.kind === 'load') return 'kg1rm'
  if (ex.kind === 'timed') return 'sec'
  const st = ex.stages?.[0]
  return st?.unit === 'sec' ? 'sec' : 'reps'
}

/** Porovnateľné číslo jednej série. 0 = séria bez použiteľných čísel. */
export function setScore(exerciseId: string, s: Pick<SetLog, 'weightKg' | 'reps' | 'seconds'>): number {
  if (unitFor(exerciseId) === 'kg1rm') {
    return s.weightKg !== null && s.reps !== null ? estimated1RM(s.weightKg, s.reps) : 0
  }
  if (s.seconds !== null) return s.seconds
  return s.reps ?? 0
}

export function describeSet(s: Pick<SetLog, 'weightKg' | 'reps' | 'seconds'>): string {
  const w = s.weightKg !== null ? `${s.weightKg} kg × ` : ''
  if (s.seconds !== null) return `${s.weightKg !== null ? `${s.weightKg} kg – ` : ''}${s.seconds} s`
  return `${w}${s.reps ?? 0} op.`
}

export function nameOf(exerciseId: string): string {
  return EXERCISE_MAP[exerciseId]?.name ?? exerciseId
}

/**
 * Prejde tréningy od najstaršieho a označí série, ktoré prekonali dovtedajšie maximum.
 * Prvý zápis cviku rekord nie je – nie je čo prekonať.
 * Vracia zoznam od najnovšieho tréningu.
 */
export function buildHistory(workouts: Workout[], sets: SetLog[]): WorkoutSummary[] {
  const done = workouts.filter((w) => typeof w.id === 'number' && w.finishedAt)
  const order = [...done].sort((a, b) => (a.date === b.date ? (a.id ?? 0) - (b.id ?? 0) : a.date < b.date ? -1 : 1))

  const byWorkout = new Map<number, SetLog[]>()
  for (const s of sets) byWorkout.set(s.workoutId, [...(byWorkout.get(s.workoutId) ?? []), s])

  const bestSoFar = new Map<string, number>()
  const out: WorkoutSummary[] = []

  for (const w of order) {
    const id = w.id as number
    const logged = (byWorkout.get(id) ?? []).sort((a, b) => a.setIndex - b.setIndex)
    if (logged.length === 0) continue

    const perExercise = new Map<string, SetLog[]>()
    for (const s of logged) perExercise.set(s.exerciseId, [...(perExercise.get(s.exerciseId) ?? []), s])

    const lines: ExerciseLine[] = []
    const prs: PersonalRecord[] = []
    let volumeKg = 0

    for (const [exerciseId, exSets] of perExercise) {
      let top = exSets[0] as SetLog
      let topScore = setScore(exerciseId, top)
      for (const s of exSets) {
        if (s.weightKg !== null && s.reps !== null) volumeKg += s.weightKg * s.reps
        const sc = setScore(exerciseId, s)
        if (sc > topScore) {
          top = s
          topScore = sc
        }
      }
      const prev = bestSoFar.get(exerciseId) ?? null
      const isPr = topScore > 0 && prev !== null && topScore > prev
      if (isPr) {
        prs.push({
          exerciseId,
          name: nameOf(exerciseId),
          score: topScore,
          previous: prev,
          unit: unitFor(exerciseId),
          detail: describeSet(top),
          date: w.date,
        })
      }
      if (topScore > (prev ?? 0)) bestSoFar.set(exerciseId, topScore)
      lines.push({
        exerciseId,
        name: nameOf(exerciseId),
        setCount: exSets.length,
        best: describeSet(top),
        bestScore: topScore,
        unit: unitFor(exerciseId),
        isPr,
        notes: exSets.map((s) => s.note?.trim() ?? '').filter(Boolean),
      })
    }

    const rpes = logged.map((s) => s.rpe)
    out.push({
      workoutId: id,
      date: w.date,
      template: w.template,
      isDeload: w.isDeload,
      setCount: logged.length,
      volumeKg: Math.round(volumeKg),
      avgRpe: rpes.length ? Math.round((rpes.reduce((a, b) => a + b, 0) / rpes.length) * 10) / 10 : null,
      maxPain: Math.max(0, ...logged.map((s) => s.pain ?? 0)),
      exercises: lines,
      prs,
    })
  }

  return out.reverse()
}

export interface BestEntry {
  exerciseId: string
  name: string
  score: number
  unit: ScoreUnit
  detail: string
  date: string
}

/** Najlepšia séria každého cviku za celú históriu, zoradené podľa dátumu (najnovšie hore). */
export function personalBests(sets: SetLog[]): BestEntry[] {
  const best = new Map<string, BestEntry>()
  for (const s of sets) {
    const score = setScore(s.exerciseId, s)
    if (score <= 0) continue
    const cur = best.get(s.exerciseId)
    if (!cur || score > cur.score) {
      best.set(s.exerciseId, {
        exerciseId: s.exerciseId,
        name: nameOf(s.exerciseId),
        score,
        unit: unitFor(s.exerciseId),
        detail: describeSet(s),
        date: s.date,
      })
    }
  }
  return [...best.values()].sort((a, b) => (a.date === b.date ? b.score - a.score : a.date < b.date ? 1 : -1))
}

/** Koľko rekordov padlo za posledných `days` dní – malé povzbudenie na Dnes. */
export function recentPrCount(history: WorkoutSummary[], today: string, days = 28): number {
  const fromISO = addDays(today, -days)
  return history.filter((w) => w.date >= fromISO).reduce((n, w) => n + w.prs.length, 0)
}
