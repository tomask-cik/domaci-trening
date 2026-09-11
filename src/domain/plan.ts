import { isDeloadWeek } from './deload'
import { nextTemplate } from './program'
import { weekStart } from './dates'
import type { Settings, TemplateId, Workout } from './types'

export interface DayPlan {
  kind: 'continue' | 'workout' | 'done' | 'rest'
  template: TemplateId
  isDeload: boolean
  doneThisWeek: number
  openWorkoutId?: number
  note: string
}

function sortedFinished(workouts: Workout[]): Workout[] {
  return workouts
    .filter((w) => w.finishedAt)
    .sort((a, b) => (a.date === b.date ? (a.startedAt < b.startedAt ? -1 : 1) : a.date < b.date ? -1 : 1))
}

/** Čo je dnes na rade (PROGRAM.md 0): striedanie A/B, cieľový počet dní v týždni, deload. */
export function planForToday(settings: Settings, workouts: Workout[], today: string): DayPlan {
  const isDeload = isDeloadWeek(today, settings)
  const finished = sortedFinished(workouts)
  const last = finished[finished.length - 1]
  const ws = weekStart(today)
  const doneThisWeek = finished.filter((w) => w.date >= ws && w.date <= today).length
  const open = workouts.find((w) => w.date === today && !w.finishedAt)
  const base = { isDeload, doneThisWeek }

  if (open) {
    return { ...base, kind: 'continue', template: open.template, openWorkoutId: open.id, note: 'Máš rozrobený tréning – môžeš pokračovať.' }
  }
  const next = nextTemplate(last?.template ?? null)
  if (last?.date === today) {
    return { ...base, kind: 'done', template: next, note: 'Dnešný tréning je hotový. Zvyšok dňa: mobilita a kroky.' }
  }
  if (doneThisWeek >= settings.daysPerWeek) {
    return { ...base, kind: 'rest', template: next, note: `Tento týždeň máš odtrénované ${doneThisWeek}/${settings.daysPerWeek}. Dnes stačí mobilita, kroky a kardio.` }
  }
  const note = isDeload
    ? 'Deload týždeň: rovnaké váhy, o sériu menej, RPE do 7. Progresia sa nevyhodnocuje.'
    : 'Medzi silovými tréningmi nechaj aspoň jeden deň pauzy.'
  return { ...base, kind: 'workout', template: next, note }
}
