import { DELOAD_EVERY_WEEKS, EARLY_DELOAD_SIGNALS_NEEDED } from './constants'
import { addDays, weekIndex, weekStart } from './dates'
import type { Settings } from './types'

type DeloadSettings = Pick<Settings, 'cycleStartDate' | 'deloadEveryWeeks' | 'manualDeloadWeeks'>

/** Plánovaný deload: každý N-tý týždeň cyklu (N = 7 => 6 práce + 1 ľahký). Manuálny: v zozname. */
export function isDeloadWeek(dateISO: string, s: DeloadSettings): boolean {
  const ws = weekStart(dateISO)
  if (s.manualDeloadWeeks.includes(ws)) return true
  const idx = weekIndex(dateISO, s.cycleStartDate)
  if (idx < 0) return false
  const every = s.deloadEveryWeeks || DELOAD_EVERY_WEEKS
  return (idx + 1) % every === 0
}

/** Zoznam pondelkov nasledujúcich `count` týždňov s príznakom deloadu (kalendár). */
export function weekCalendar(fromISO: string, count: number, s: DeloadSettings): { weekStart: string; deload: boolean; index: number }[] {
  const start = weekStart(fromISO)
  const out: { weekStart: string; deload: boolean; index: number }[] = []
  for (let i = 0; i < count; i++) {
    const ws = addDays(start, i * 7)
    out.push({ weekStart: ws, deload: isDeloadWeek(ws, s), index: weekIndex(ws, s.cycleStartDate) })
  }
  return out
}

export function nextDeloadWeekStart(fromISO: string, s: DeloadSettings): string | null {
  const cal = weekCalendar(fromISO, 26, s)
  return cal.find((w) => w.deload)?.weekStart ?? null
}

export interface EarlyDeloadSignals {
  repsDroppedTwice: boolean
  jointPain: boolean
  shortSleepNights: boolean
  highRpe: boolean
}

/** 2 zo 4 znakov => odporučiť skorší deload (PROGRAM.md 5). */
export function shouldSuggestEarlyDeload(sig: EarlyDeloadSignals): boolean {
  const n = [sig.repsDroppedTwice, sig.jointPain, sig.shortSleepNights, sig.highRpe].filter(Boolean).length
  return n >= EARLY_DELOAD_SIGNALS_NEEDED
}

/** Spustiť deload v týždni dátumu; nový cyklus začína nasledujúci pondelok. */
export function startManualDeload<T extends DeloadSettings>(s: T, dateISO: string): T {
  const ws = weekStart(dateISO)
  const manual = s.manualDeloadWeeks.includes(ws) ? s.manualDeloadWeeks : [...s.manualDeloadWeeks, ws]
  return { ...s, manualDeloadWeeks: manual, cycleStartDate: addDays(ws, 7) }
}
