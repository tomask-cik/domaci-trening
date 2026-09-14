/**
 * Denník jedla.
 *
 * Kalórie sa počítajú z hodnôt na 100 g / 100 ml – tak ich uvádzajú obaly aj tabuľky,
 * a tak sa dajú prepočítať na ľubovoľnú gramáž. AI vracia len tieto dve čísla,
 * násobenie robíme tu, aby sa v tom nedalo pomýliť.
 */

import type { FoodEntry } from './types'

/** Hranice zdravého rozumu – nad nimi je odhad takmer isto nezmysel. */
export const MAX_KCAL_PER_100 = 900 // čistý tuk má ~900
export const MAX_PROTEIN_PER_100 = 100
export const MAX_GRAMS = 5000

export interface Nutrition {
  label: string
  kcalPer100: number
  proteinPer100: number
  note: string
}

export interface DayTotals {
  kcal: number
  proteinG: number
  count: number
}

export function dayTotals(entries: FoodEntry[]): DayTotals {
  return entries.reduce<DayTotals>(
    (acc, e) => ({ kcal: acc.kcal + e.kcal, proteinG: acc.proteinG + e.proteinG, count: acc.count + 1 }),
    { kcal: 0, proteinG: 0, count: 0 },
  )
}

/** Prepočet zo 100 g na skutočnú gramáž. Zaokrúhľuje – desatiny kalórie nikoho nezaujímajú. */
export function scaleToGrams(n: Nutrition, grams: number): { kcal: number; proteinG: number } {
  const f = grams / 100
  return {
    kcal: Math.round(n.kcalPer100 * f),
    proteinG: Math.round(n.proteinPer100 * f * 10) / 10,
  }
}

function num(v: unknown): number | null {
  const x = typeof v === 'string' ? Number(v.replace(',', '.')) : v
  return typeof x === 'number' && Number.isFinite(x) ? x : null
}

/**
 * Overí, čo prišlo z AI. Model môže vrátiť čokoľvek vrátane textu okolo JSON,
 * takže si vyrežeme prvý objekt a každé číslo skontrolujeme proti hraniciam.
 */
export function parseNutrition(raw: string): { ok: true; value: Nutrition } | { ok: false; error: string } {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start < 0 || end <= start) return { ok: false, error: 'Odpoveď neobsahuje JSON.' }

  let obj: Record<string, unknown>
  try {
    obj = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return { ok: false, error: 'Odpoveď sa nedá prečítať ako JSON.' }
  }

  if (obj['neznama'] === true || obj['unknown'] === true) {
    return { ok: false, error: 'Model jedlo nepozná. Skús presnejší názov alebo zadaj kalórie ručne.' }
  }

  const kcalPer100 = num(obj['kcalPer100'])
  const proteinPer100 = num(obj['proteinPer100'])
  if (kcalPer100 === null || proteinPer100 === null) return { ok: false, error: 'V odpovedi chýbajú čísla.' }
  if (kcalPer100 < 0 || kcalPer100 > MAX_KCAL_PER_100) return { ok: false, error: `Nezmyselná hodnota ${kcalPer100} kcal/100 g.` }
  if (proteinPer100 < 0 || proteinPer100 > MAX_PROTEIN_PER_100) return { ok: false, error: `Nezmyselná hodnota ${proteinPer100} g bielkovín/100 g.` }

  const label = typeof obj['label'] === 'string' && obj['label'].trim() ? obj['label'].trim() : ''
  const note = typeof obj['note'] === 'string' ? obj['note'].trim() : ''
  return {
    ok: true,
    value: {
      label,
      note,
      kcalPer100: Math.round(kcalPer100 * 10) / 10,
      proteinPer100: Math.round(proteinPer100 * 10) / 10,
    },
  }
}

export function validGrams(g: number | null): boolean {
  return g !== null && Number.isFinite(g) && g > 0 && g <= MAX_GRAMS
}

/** Podiel bielkovín na dennom cieli – hlavné číslo pri chudnutí. */
export function proteinProgress(totals: DayTotals, targetG: number): number {
  if (targetG <= 0) return 0
  return Math.min(100, Math.round((totals.proteinG / targetG) * 100))
}
