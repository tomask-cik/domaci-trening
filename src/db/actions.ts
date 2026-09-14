import { initialCalorieTarget, mifflinStJeor } from '../domain/calories'
import { STEPS_GOAL, STEPS_START } from '../domain/constants'
import { todayISO, weekStart } from '../domain/dates'
import { startManualDeload } from '../domain/deload'
import { EXERCISES, getExercise } from '../domain/exercises'
import { dayTotals } from '../domain/food'
import { isDeloadWeek } from '../domain/deload'
import { buildSession } from '../domain/program'
import { initialState, suggestNext, type ChangeKind } from '../domain/progression'
import { computeWeeklyReview, pendingReviewWeeks } from '../domain/review'
import type { DayLog, ExerciseState, FoodEntry, Settings, SetLog, TemplateId } from '../domain/types'
import { db } from './db'

export interface SetupInput {
  sex: Settings['sex']
  age: number
  heightCm: number
  startWeightKg: number
  targetWeightKg: number
  bodyFatPct: number | null
  kettlebells: number[]
  hasBand: boolean
  hasMat: boolean
  daysPerWeek: Settings['daysPerWeek']
  minutesPerSession: Settings['minutesPerSession']
  stepsStart: number
}

export async function saveSetup(input: SetupInput, today = todayISO()): Promise<Settings> {
  const bmr = mifflinStJeor(input.sex, input.startWeightKg, input.heightCm, input.age)
  const settings: Settings = {
    id: 1,
    createdAt: today,
    sex: input.sex,
    age: input.age,
    heightCm: input.heightCm,
    startWeightKg: input.startWeightKg,
    targetWeightKg: input.targetWeightKg,
    bodyFatPct: input.bodyFatPct,
    kettlebells: [...input.kettlebells].sort((a, b) => a - b),
    hasBand: input.hasBand,
    hasMat: input.hasMat,
    daysPerWeek: input.daysPerWeek,
    minutesPerSession: input.minutesPerSession,
    stepsStart: input.stepsStart || STEPS_START,
    stepsGoal: STEPS_GOAL,
    activityFactor: DEFAULTS_ACTIVITY,
    calorieTarget: initialCalorieTarget(bmr),
    programStartDate: today,
    cycleStartDate: weekStart(today),
    deloadEveryWeeks: DEFAULTS_DELOAD,
    manualDeloadWeeks: [],
    breakReminders: true,
  }
  await db.settings.put(settings)
  await ensureExerciseStates(settings, today)
  await db.days.put({ date: today, weightKg: input.startWeightKg })
  return settings
}

const DEFAULTS_ACTIVITY = 1.4
const DEFAULTS_DELOAD = 7

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const cur = await db.settings.get(1)
  if (!cur) return
  await db.settings.put({ ...cur, ...patch, id: 1 })
}

/** Doplní chýbajúce stavy cvikov (aj po zmene vybavenia). */
export async function ensureExerciseStates(settings: Settings, today = todayISO()): Promise<void> {
  const existing = new Set((await db.exerciseStates.toArray()).map((s) => s.exerciseId))
  const missing = EXERCISES.filter((e) => e.category !== 'mobilita' && !existing.has(e.id))
  if (missing.length) await db.exerciseStates.bulkPut(missing.map((e) => initialState(e, settings.kettlebells, today)))
}

export async function getState(exerciseId: string, settings: Settings, today: string): Promise<ExerciseState> {
  const s = await db.exerciseStates.get(exerciseId)
  if (s) return s
  const fresh = initialState(getExercise(exerciseId), settings.kettlebells, today)
  await db.exerciseStates.put(fresh)
  return fresh
}

export async function saveDay(date: string, patch: Partial<DayLog>): Promise<void> {
  const cur = (await db.days.get(date)) ?? { date }
  await db.days.put({ ...cur, ...patch, date })
}

export async function startWorkout(settings: Settings, template: TemplateId, today = todayISO()): Promise<number> {
  const open = await db.workouts.where('date').equals(today).filter((w) => !w.finishedAt).first()
  if (open?.id) return open.id
  const id = await db.workouts.add({
    date: today,
    template,
    startedAt: new Date().toISOString(),
    isDeload: isDeloadWeek(today, settings),
    minutes: settings.minutesPerSession,
  })
  return id as number
}

export async function logSet(entry: Omit<SetLog, 'id'>): Promise<number> {
  const existing = await db.sets
    .where('workoutId')
    .equals(entry.workoutId)
    .filter((s) => s.exerciseId === entry.exerciseId && s.setIndex === entry.setIndex)
    .first()
  if (existing?.id) {
    await db.sets.put({ ...entry, id: existing.id })
    return existing.id
  }
  return (await db.sets.add(entry)) as number
}

export async function deleteSet(id: number): Promise<void> {
  await db.sets.delete(id)
}

export interface ProgressionResult {
  exerciseId: string
  name: string
  change: ChangeKind
  message: string
}

/** Ukončí tréning a prepočíta progresiu pre každý cvik so zapísanými sériami (PROGRAM.md 1.3). */
export async function finishWorkout(workoutId: number, settings: Settings, today = todayISO()): Promise<ProgressionResult[]> {
  const workout = await db.workouts.get(workoutId)
  if (!workout) return []
  const sets = await db.sets.where('workoutId').equals(workoutId).toArray()
  const byExercise = new Map<string, SetLog[]>()
  for (const s of sets) {
    const arr = byExercise.get(s.exerciseId) ?? []
    arr.push(s)
    byExercise.set(s.exerciseId, arr)
  }
  const results: ProgressionResult[] = []
  for (const [exerciseId, list] of byExercise) {
    const ex = getExercise(exerciseId)
    const state = await getState(exerciseId, settings, today)
    const sorted = [...list].sort((a, b) => a.setIndex - b.setIndex)
    const suggestion = suggestNext(
      ex,
      state,
      sorted.map((s) => ({ weightKg: s.weightKg, reps: s.reps, seconds: s.seconds, rpe: s.rpe, pain: s.pain })),
      { kettlebells: settings.kettlebells, isDeload: workout.isDeload, today },
    )
    await db.exerciseStates.put(suggestion.state)
    results.push({ exerciseId, name: ex.name, change: suggestion.change, message: suggestion.message })
  }
  await db.workouts.put({ ...workout, finishedAt: new Date().toISOString() })
  return results
}

export async function discardWorkout(workoutId: number): Promise<void> {
  await db.transaction('rw', db.workouts, db.sets, async () => {
    await db.sets.where('workoutId').equals(workoutId).delete()
    await db.workouts.delete(workoutId)
  })
}

/** Vyhodnotí všetky uzavreté týždne bez záznamu a upraví kalorický cieľ (PROGRAM.md 7). */
export async function applyPendingReviews(today = todayISO()): Promise<number> {
  const settings = await db.settings.get(1)
  if (!settings) return 0
  const days = await db.days.toArray()
  const reviews = await db.weekReviews.toArray()
  const pending = pendingReviewWeeks(settings, reviews, today)
  let current = settings
  for (const week of pending) {
    const review = computeWeeklyReview(current, days, week, today)
    await db.weekReviews.put(review)
    if (review.newTarget !== current.calorieTarget) {
      current = { ...current, calorieTarget: review.newTarget }
      await db.settings.put(current)
    }
  }
  return pending.length
}

export async function triggerDeload(today = todayISO()): Promise<void> {
  const settings = await db.settings.get(1)
  if (!settings) return
  await db.settings.put(startManualDeload(settings, today))
}

/** Počet sérií pre dnešný tréning (na zobrazenie odhadu). */
export function sessionFor(settings: Settings, template: TemplateId, isDeload: boolean) {
  return buildSession(template, settings.minutesPerSession, isDeload)
}

export async function resetAll(): Promise<void> {
  await db.transaction('rw', [db.settings, db.days, db.workouts, db.sets, db.exerciseStates, db.weekReviews, db.foods], async () => {
    await Promise.all([db.settings.clear(), db.days.clear(), db.workouts.clear(), db.sets.clear(), db.exerciseStates.clear(), db.weekReviews.clear(), db.foods.clear()])
  })
}

export async function getWorkoutSets(workoutId: number): Promise<SetLog[]> {
  return db.sets.where('workoutId').equals(workoutId).toArray()
}

// --- Denník jedla ---

export async function addFood(entry: Omit<FoodEntry, 'id'>): Promise<void> {
  await db.foods.add(entry as FoodEntry)
  await syncDayKcal(entry.date)
}

export async function deleteFood(id: number, date: string): Promise<void> {
  await db.foods.delete(id)
  await syncDayKcal(date)
}

/**
 * Prepíše kcal v dennom zázname súčtom jedál.
 * Keď za deň nie je zapísané žiadne jedlo, ručne zadanú hodnotu necháme tak –
 * inak by zmazanie poslednej položky vymazalo aj číslo, ktoré si zadal sám.
 */
export async function syncDayKcal(date: string): Promise<void> {
  const entries = await db.foods.where('date').equals(date).toArray()
  if (entries.length === 0) return
  await saveDay(date, { kcal: dayTotals(entries).kcal })
}
