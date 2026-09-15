/**
 * Beh.
 *
 * Vzdialenosť, čas a tempo sú tri pohľady na to isté – ukladáme len vzdialenosť a čas,
 * tempo sa dopočíta. Inak by sa dali zapísať tri čísla, ktoré si navzájom odporujú.
 *
 * Kalórie: pri behu stojí prekonanie jedného kilometra zhruba 1,036 kcal na kilogram
 * telesnej hmotnosti a je to takmer nezávislé od tempa – pomalší beh trvá dlhšie,
 * ale na rovnakej trase minie podobne. Je to hrubý odhad, nie meranie.
 */

export const KCAL_PER_KG_PER_KM = 1.036

/** Pokojový výdaj, ktorý by bežal aj tak – odpočítava sa, aby sa nerátal dvakrát. */
export const RESTING_KCAL_PER_KG_PER_MIN = 0.0175

export interface RunInput {
  meters: number
  seconds: number
  weightKg: number
}

/** Sekundy na kilometer. null, keď sa tempo nedá určiť. */
export function paceSecPerKm(meters: number, seconds: number): number | null {
  if (meters <= 0 || seconds <= 0) return null
  return Math.round(seconds / (meters / 1000))
}

export function formatPace(secPerKm: number | null): string {
  if (secPerKm === null || !Number.isFinite(secPerKm)) return '–'
  const m = Math.floor(secPerKm / 60)
  const s = Math.round(secPerKm % 60)
  return `${m}:${String(s).padStart(2, '0')} min/km`
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.round(seconds % 60)
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Hrubý výdaj za beh (všetko, čo telo minulo vrátane pokojového metabolizmu).
 */
export function grossKcal(input: RunInput): number {
  const { meters, weightKg } = input
  if (meters <= 0 || weightKg <= 0) return 0
  return Math.round(KCAL_PER_KG_PER_KM * weightKg * (meters / 1000))
}

/**
 * Čistý výdaj navyše oproti ležaniu na gauči. Toto je číslo, ktoré má zmysel
 * pripočítavať k dennému výdaju – hrubé by pokojový metabolizmus rátalo druhýkrát.
 */
export function netKcal(input: RunInput): number {
  const { seconds, weightKg } = input
  const resting = Math.round(RESTING_KCAL_PER_KG_PER_MIN * weightKg * (seconds / 60))
  return Math.max(0, grossKcal(input) - resting)
}

export function validRun(meters: number | null, seconds: number | null): boolean {
  if (meters === null || seconds === null) return false
  if (!Number.isFinite(meters) || !Number.isFinite(seconds)) return false
  if (meters <= 0 || meters > 100_000) return false
  if (seconds <= 0 || seconds > 12 * 3600) return false
  return true
}

/** Sekundy z minút a sekúnd zadaných zvlášť – tak to má človek na hodinkách. */
export function toSeconds(minutes: number | null, seconds: number | null): number {
  return Math.max(0, Math.round((minutes ?? 0) * 60 + (seconds ?? 0)))
}
