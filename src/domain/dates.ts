/** Dátumy ako ISO reťazce YYYY-MM-DD v lokálnom čase (DECISIONS C5). */

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

export function todayISO(now: Date = new Date()): string {
  return toISODate(now)
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

/** b − a v dňoch (celé číslo). */
export function diffDays(a: string, b: string): number {
  const ms = parseISO(b).getTime() - parseISO(a).getTime()
  return Math.round(ms / 86_400_000)
}

/** Pondelok týždňa, do ktorého patrí dátum. */
export function weekStart(iso: string): string {
  const d = parseISO(iso)
  const dow = (d.getDay() + 6) % 7 // Po = 0
  return addDays(iso, -dow)
}

/** Index týždňa od `start` (pondelok): 0 = prvý týždeň. Záporné pred štartom. */
export function weekIndex(iso: string, start: string): number {
  return Math.floor(diffDays(weekStart(start), iso) / 7)
}

export function isBefore(a: string, b: string): boolean {
  return a < b
}

export function formatSk(iso: string): string {
  const d = parseISO(iso)
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`
}

export const SK_DAYS = ['Po', 'Ut', 'St', 'Št', 'Pi', 'So', 'Ne'] as const

export function dayOfWeekSk(iso: string): string {
  const d = parseISO(iso)
  return SK_DAYS[(d.getDay() + 6) % 7] ?? ''
}
