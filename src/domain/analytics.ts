/**
 * Čo si naozaj odcvičil – objem na partiu a dodržiavanie plánu.
 *
 * `program.weeklyVolume` hovorí, čo šablóny plánujú. Toto počíta zo zapísaných sérií, čo sa
 * naozaj stalo. Pri chudnutí je to hlavný ukazovateľ, že objem na udržanie svalov (RESEARCH R3)
 * nie je len na papieri. Čisté funkcie, žiadna databáza.
 */

import { addDays, weekStart } from './dates'
import { EXERCISE_MAP, MUSCLE_GROUPS, type MuscleGroup } from './exercises'
import { buildSession, weekOrder } from './program'
import type { Settings, SetLog, TemplateId, Workout } from './types'
import { isDeloadWeek } from './deload'

export type GroupSets = Record<MuscleGroup, number>

function emptyGroups(): GroupSets {
  return { chrbat: 0, hrudnik_triceps: 0, ramena: 0, kvadricepsy: 0, zadok_hamstringy: 0, lytka: 0, stred: 0 }
}

/** Rozcvičovacie série sa do objemu nerátajú – objem je len z pracovných sérií. */
function isWorkingSet(s: SetLog): boolean {
  return !(s as SetLog & { warmup?: boolean }).warmup
}

/**
 * Skutočný objem v týždni (pondelok–nedeľa): každá zapísaná pracovná séria sa pripočíta
 * partiám, pre ktoré je cvik priamou sériou (`Exercise.groups`). Berie sa dátum série,
 * nie stav tréningu – séria zapísaná dnes je odcvičená, aj keď tréning ešte beží.
 */
export function actualWeeklyVolume(sets: SetLog[], weekStartISO: string): GroupSets {
  const end = addDays(weekStartISO, 6)
  const out = emptyGroups()
  for (const s of sets) {
    if (s.date < weekStartISO || s.date > end || !isWorkingSet(s)) continue
    for (const g of EXERCISE_MAP[s.exerciseId]?.groups ?? []) out[g] += 1
  }
  return out
}

/**
 * Plánovaný objem toho istého týždňa: šablóny už odcvičených tréningov v poradí, doplnené
 * striedaním A/B do počtu dní v týždni. Objem A/B/A a B/A/B sa mierne líši (výpady majú aj
 * zadok), preto sa plán počíta z reálneho poradia, nie z paušálneho A/B/A.
 */
export function plannedWeeklyVolume(settings: Settings, workouts: Workout[], weekStartISO: string): GroupSets {
  const end = addDays(weekStartISO, 6)
  const done = workouts
    .filter((w) => w.date >= weekStartISO && w.date <= end)
    .sort((a, b) => (a.date === b.date ? (a.id ?? 0) - (b.id ?? 0) : a.date < b.date ? -1 : 1))
    .map((w) => w.template)
  const order: TemplateId[] = [...done]
  if (order.length < settings.daysPerWeek) {
    const last = order[order.length - 1]
    const startWith: TemplateId = last === 'A' ? 'B' : 'A'
    for (const t of weekOrder(settings.daysPerWeek, startWith)) {
      if (order.length >= settings.daysPerWeek) break
      order.push(t)
    }
  }
  const deload = isDeloadWeek(weekStartISO, settings)
  const out = emptyGroups()
  for (const t of order) {
    for (const item of buildSession(t, settings.minutesPerSession, deload)) {
      for (const g of EXERCISE_MAP[item.exerciseId]?.groups ?? []) out[g] += item.sets
    }
  }
  return out
}

export interface GroupVolumeLine {
  group: MuscleGroup
  done: number
  planned: number
}

/** Riadky pre zobrazenie v pevnom poradí partií. */
export function volumeLines(done: GroupSets, planned: GroupSets): GroupVolumeLine[] {
  return MUSCLE_GROUPS.map((group) => ({ group, done: done[group], planned: planned[group] }))
}

export interface AdherenceWeek {
  weekStart: string
  planned: number
  done: number
  deload: boolean
}

export interface Adherence {
  /** Uzavreté týždne od štartu programu, od najstaršieho. */
  weeks: AdherenceWeek[]
  plannedTotal: number
  doneTotal: number
  /** Percento z uzavretých týždňov; null, kým nie je žiadny uzavretý. */
  pct: number | null
  /** Bežiaci týždeň zvlášť – ešte sa dá dobehnúť. */
  thisWeek: AdherenceWeek
}

/**
 * Dodržiavanie plánu: koľko silových tréningov z plánovaného počtu za týždeň si naozaj ukončil.
 * Počet dní v týždni sa berie z aktuálnych nastavení pre všetky týždne (história zmien sa neukladá).
 */
export function adherence(settings: Settings, workouts: Workout[], today: string): Adherence {
  const finished = workouts.filter((w) => w.finishedAt)
  const countIn = (ws: string) => {
    const end = addDays(ws, 6)
    return finished.filter((w) => w.date >= ws && w.date <= end).length
  }
  const thisWs = weekStart(today)
  const weeks: AdherenceWeek[] = []
  for (let ws = weekStart(settings.programStartDate); ws < thisWs; ws = addDays(ws, 7)) {
    weeks.push({ weekStart: ws, planned: settings.daysPerWeek, done: countIn(ws), deload: isDeloadWeek(ws, settings) })
  }
  const plannedTotal = weeks.reduce((n, w) => n + w.planned, 0)
  const doneTotal = weeks.reduce((n, w) => n + w.done, 0)
  return {
    weeks,
    plannedTotal,
    doneTotal,
    pct: plannedTotal > 0 ? Math.round((Math.min(doneTotal, plannedTotal) / plannedTotal) * 100) : null,
    thisWeek: { weekStart: thisWs, planned: settings.daysPerWeek, done: countIn(thisWs), deload: isDeloadWeek(thisWs, settings) },
  }
}
