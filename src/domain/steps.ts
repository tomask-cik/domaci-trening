import { STEPS_INCREMENT_PER_WEEK } from './constants'
import { addDays } from './dates'
import type { DayLog } from './types'

/** Cieľ krokov v týždni `weekIdx` (0 = prvý): štart + 500/týždeň až po cieľ (PROGRAM.md 4). */
export function stepGoalForWeek(weekIdx: number, start: number, goal: number): number {
  const idx = Math.max(0, weekIdx)
  return Math.min(goal, start + STEPS_INCREMENT_PER_WEEK * idx)
}

export interface WeekStepsSummary {
  weekStart: string
  days: { date: string; steps: number | null }[]
  total: number
  daysLogged: number
  avgLogged: number | null
  daysAtGoal: number
}

export function weeklySteps(days: DayLog[], weekStartISO: string, goal: number): WeekStepsSummary {
  const byDate = new Map(days.map((d) => [d.date, d]))
  const list: { date: string; steps: number | null }[] = []
  let total = 0
  let logged = 0
  let atGoal = 0
  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStartISO, i)
    const s = byDate.get(date)?.steps
    const steps = typeof s === 'number' ? s : null
    list.push({ date, steps })
    if (steps !== null) {
      total += steps
      logged++
      if (steps >= goal) atGoal++
    }
  }
  return {
    weekStart: weekStartISO,
    days: list,
    total,
    daysLogged: logged,
    avgLogged: logged ? Math.round(total / logged) : null,
    daysAtGoal: atGoal,
  }
}
