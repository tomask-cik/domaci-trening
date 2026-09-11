import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { todayISO, weekStart } from '../domain/dates'
import type { DayLog, ExerciseState, Settings, WeekReview, Workout } from '../domain/types'

export function useSettings(): Settings | null | undefined {
  return useLiveQuery(async () => (await db.settings.get(1)) ?? null, [])
}

export function useDays(): DayLog[] | undefined {
  return useLiveQuery(() => db.days.orderBy('date').toArray(), [])
}

export function useDay(date: string): DayLog | null | undefined {
  return useLiveQuery(async () => (await db.days.get(date)) ?? null, [date])
}

export function useWorkouts(): Workout[] | undefined {
  return useLiveQuery(() => db.workouts.orderBy('date').toArray(), [])
}

export function useExerciseStates(): ExerciseState[] | undefined {
  return useLiveQuery(() => db.exerciseStates.toArray(), [])
}

export function useWeekReviews(): WeekReview[] | undefined {
  return useLiveQuery(() => db.weekReviews.orderBy('weekStart').toArray(), [])
}

export function useToday(): string {
  return todayISO()
}

export function useThisWeek(): string {
  return weekStart(todayISO())
}
