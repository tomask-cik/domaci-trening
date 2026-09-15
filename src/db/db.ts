import Dexie, { type EntityTable } from 'dexie'
import type { DayLog, ExerciseState, FoodEntry, RunLog, SetLog, Settings, WeekReview, Workout } from '../domain/types'

export class TrainingDB extends Dexie {
  settings!: EntityTable<Settings, 'id'>
  days!: EntityTable<DayLog, 'date'>
  workouts!: EntityTable<Workout, 'id'>
  sets!: EntityTable<SetLog, 'id'>
  exerciseStates!: EntityTable<ExerciseState, 'exerciseId'>
  weekReviews!: EntityTable<WeekReview, 'weekStart'>
  foods!: EntityTable<FoodEntry, 'id'>
  runs!: EntityTable<RunLog, 'id'>

  constructor(name = 'domaci-trening') {
    super(name)
    this.version(1).stores({
      settings: 'id',
      days: 'date',
      workouts: '++id, date, template, finishedAt',
      sets: '++id, workoutId, exerciseId, date',
      exerciseStates: 'exerciseId',
      weekReviews: 'weekStart',
    })
    // v2: denník jedla. Dexie doplní tabuľku bez straty existujúcich dát.
    this.version(2).stores({
      foods: '++id, date',
    })
    // v3: beh mimo silového tréningu.
    this.version(3).stores({
      runs: '++id, date',
    })
  }
}

export const db = new TrainingDB()

export const TABLE_NAMES = ['settings', 'days', 'workouts', 'sets', 'exerciseStates', 'weekReviews', 'foods', 'runs'] as const
export type TableName = (typeof TABLE_NAMES)[number]
