import Dexie, { type EntityTable } from 'dexie'
import type { DayLog, ExerciseState, SetLog, Settings, WeekReview, Workout } from '../domain/types'

export class TrainingDB extends Dexie {
  settings!: EntityTable<Settings, 'id'>
  days!: EntityTable<DayLog, 'date'>
  workouts!: EntityTable<Workout, 'id'>
  sets!: EntityTable<SetLog, 'id'>
  exerciseStates!: EntityTable<ExerciseState, 'exerciseId'>
  weekReviews!: EntityTable<WeekReview, 'weekStart'>

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
  }
}

export const db = new TrainingDB()

export const TABLE_NAMES = ['settings', 'days', 'workouts', 'sets', 'exerciseStates', 'weekReviews'] as const
export type TableName = (typeof TABLE_NAMES)[number]
