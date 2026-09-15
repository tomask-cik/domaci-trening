export type TemplateId = 'A' | 'B'
export type ExerciseKind = 'load' | 'stage' | 'timed'
export type Sex = 'm' | 'f'

export interface Settings {
  id: 1
  createdAt: string
  sex: Sex
  age: number
  heightCm: number
  startWeightKg: number
  targetWeightKg: number
  bodyFatPct: number | null
  kettlebells: number[]
  hasBand: boolean
  hasMat: boolean
  daysPerWeek: 2 | 3 | 4
  minutesPerSession: 30 | 45 | 60
  stepsStart: number
  stepsGoal: number
  activityFactor: number
  calorieTarget: number
  programStartDate: string // ISO pondelok
  cycleStartDate: string // ISO pondelok – odkedy sa počíta deload cyklus
  deloadEveryWeeks: number
  manualDeloadWeeks: string[] // ISO pondelky
  breakReminders: boolean
  /** Kľúč k Claude API pre odhad kalórií. Ostáva len v tomto zariadení. */
  anthropicApiKey?: string
  /** ISO čas poslednej úspešnej zálohy. */
  lastBackupAt?: string
}

export interface RunLog {
  id?: number
  date: string
  /** Chýba pri záznamoch spred podpory ostatných aktivít – tie sú behy. */
  type?: 'run' | 'walk' | 'yoga' | 'strength' | 'other'
  meters: number
  seconds: number
  /** Čistý výdaj navyše oproti pokoju. Z Health je to aktívna energia. */
  kcal: number
  /** Priemerný tep z hodiniek, ak je k dispozícii. */
  avgHr?: number | null
  source?: 'manual' | 'health'
  pain?: number | null
  note?: string
}

export interface FoodEntry {
  id?: number
  date: string
  name: string
  grams: number
  kcal: number
  proteinG: number
  source: 'ai' | 'manual'
  note?: string
}

export interface DayLog {
  date: string // YYYY-MM-DD, primárny kľúč
  weightKg?: number
  steps?: number
  sleepH?: number
  kcal?: number
  mobilityDone?: boolean
}

export interface Workout {
  id?: number
  date: string
  template: TemplateId
  startedAt: string
  finishedAt?: string
  /** Doplnené z hodiniek cez Skratky. */
  healthKcal?: number | null
  healthAvgHr?: number | null
  isDeload: boolean
  minutes: number
}

export interface SetLog {
  id?: number
  workoutId: number
  date: string
  exerciseId: string
  setIndex: number
  weightKg: number | null
  reps: number | null
  seconds: number | null
  rpe: number
  pain: number | null
}

export interface ExerciseState {
  exerciseId: string
  weightKg: number | null // load, timed
  targetReps: number | null // load
  variant: number // load: index do exercise.variants
  stage: number // stage
  target: number | null // stage: opakovania alebo sekundy; timed: sekundy
  topStreak: number
  failStreak: number
  updatedAt: string
  lastChange: string | null
}

export interface WeekReview {
  weekStart: string
  avgThis: number | null
  avgPrev: number | null
  rateKgPerWeek: number | null
  oldTarget: number
  newTarget: number
  reason: string
  createdAt: string
}
