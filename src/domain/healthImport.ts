/**
 * Import z Apple Health cez Skratky.
 *
 * Safari k HealthKitu prístup nemá, takže dáta musí dotlačiť iOS. Skratka prečíta
 * vzorky z Health a otvorí appku s parametrami v adrese. Tu ich overíme a prevedieme
 * na zápis. Parametre prichádzajú zvonku, takže sa im never – všetko sa kontroluje.
 *
 * Tvar adresy:
 *   ?hk=activity&type=run&date=2026-09-15&meters=5120&seconds=1840&kcal=430&hr=148
 *   ?hk=steps&date=2026-09-15&steps=8432
 *   ?hk=workout&id=17&kcal=380&hr=132
 *
 * `hk=workout` dopĺňa čísla z hodiniek k tréningu, ktorý si odcvičil v appke –
 * appka pozná svoje `startedAt` a `finishedAt`, takže skratke stačí dať to okno.
 */

export type ActivityType = 'run' | 'walk' | 'yoga' | 'strength' | 'other'

const TYPES: ActivityType[] = ['run', 'walk', 'yoga', 'strength', 'other']

export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  run: 'Beh',
  walk: 'Chôdza',
  yoga: 'Joga',
  strength: 'Silový tréning',
  other: 'Iné',
}

export interface ActivityImport {
  kind: 'activity'
  type: ActivityType
  date: string
  meters: number
  seconds: number
  kcal: number | null
  avgHr: number | null
}

export interface StepsImport {
  kind: 'steps'
  date: string
  steps: number
}

export interface WorkoutImport {
  kind: 'workout'
  workoutId: number
  kcal: number | null
  avgHr: number | null
}

export type HealthImport = ActivityImport | StepsImport | WorkoutImport

function int(v: string | null, max: number): number | null {
  if (v === null || v.trim() === '') return null
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0 || n > max) return null
  return Math.round(n)
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function dateOf(v: string | null, fallback: string): string | null {
  if (v === null || v.trim() === '') return fallback
  return ISO_DATE.test(v.trim()) ? v.trim() : null
}

/**
 * Prečíta parametre adresy. Vráti null, keď tam import nie je alebo je nezmyselný –
 * radšej nezapísať nič než zapísať vymyslené číslo.
 */
export function parseHealthParams(search: string, today: string): HealthImport | null {
  const q = new URLSearchParams(search)
  const hk = q.get('hk')
  if (!hk) return null

  if (hk === 'steps') {
    const date = dateOf(q.get('date'), today)
    const steps = int(q.get('steps'), 200_000)
    if (date === null || steps === null) return null
    return { kind: 'steps', date, steps }
  }

  if (hk === 'workout') {
    const workoutId = int(q.get('id'), 10_000_000)
    if (workoutId === null || workoutId <= 0) return null
    return { kind: 'workout', workoutId, kcal: int(q.get('kcal'), 10_000), avgHr: hrOf(q.get('hr')) }
  }

  if (hk === 'activity') {
    const raw = (q.get('type') ?? 'other').toLowerCase()
    const type = (TYPES as string[]).includes(raw) ? (raw as ActivityType) : 'other'
    const date = dateOf(q.get('date'), today)
    const seconds = int(q.get('seconds'), 12 * 3600)
    const meters = int(q.get('meters'), 200_000) ?? 0
    if (date === null || seconds === null || seconds <= 0) return null
    return { kind: 'activity', type, date, meters, seconds, kcal: int(q.get('kcal'), 10_000), avgHr: hrOf(q.get('hr')) }
  }

  return null
}

/** Tep mimo 30–230 je chyba merania, nie údaj. */
function hrOf(v: string | null): number | null {
  const n = int(v, 300)
  return n !== null && n >= 30 && n <= 230 ? n : null
}

/** Ľudský popis toho, čo sa práve naimportovalo. */
export function describeImport(i: HealthImport): string {
  if (i.kind === 'steps') return `Kroky ${i.steps} (${i.date})`
  if (i.kind === 'workout') {
    const parts = [i.kcal !== null ? `${i.kcal} kcal` : null, i.avgHr !== null ? `tep ${i.avgHr}` : null].filter(Boolean)
    return parts.length ? `Tréning doplnený: ${parts.join(', ')}` : 'Tréning bez použiteľných čísel'
  }
  const km = i.meters > 0 ? `${Math.round((i.meters / 1000) * 100) / 100} km · ` : ''
  return `${ACTIVITY_LABEL[i.type]}: ${km}${Math.round(i.seconds / 60)} min${i.kcal !== null ? ` · ${i.kcal} kcal` : ''}`
}
