/**
 * Odovzdanie tréningu Skratke (druhá polovica okruhu s Apple Health).
 *
 * Appka nevie čítať HealthKit; vie ale spustiť Skratku cez `shortcuts://run-shortcut`
 * a dať jej text. Posielame malý JSON: id tréningu, okno štart–koniec a návratovú adresu,
 * na ktorú má Skratka pripojiť `&kcal=…&hr=…` a otvoriť ju (pozri README, sekcia Apple Health).
 * Skratka tak nemusí nič vedieť o appke – všetko, čo potrebuje, dostane v texte.
 */

import type { Workout } from './types'

export const DEFAULT_SHORTCUT_NAME = 'Tréning do appky'

export interface WorkoutWindowPayload {
  id: number
  /** ISO čas začiatku tréningu (z appky). */
  start: string
  /** ISO čas konca; pre nedokončený tréning „teraz“. */
  end: string
  /** Adresa appky s `?hk=workout&id=…`; Skratka pripojí `&kcal=…&hr=…`. */
  return: string
}

/** Adresa appky bez parametrov a bez hash časti – základ pre návrat zo Skratky. */
export function appBaseUrl(href: string): string {
  const u = new URL(href)
  return `${u.origin}${u.pathname}`
}

export function workoutWindowPayload(w: Pick<Workout, 'id' | 'startedAt' | 'finishedAt'>, appUrl: string, now: string): WorkoutWindowPayload | null {
  if (typeof w.id !== 'number') return null
  return { id: w.id, start: w.startedAt, end: w.finishedAt ?? now, return: `${appUrl}?hk=workout&id=${w.id}` }
}

/** `shortcuts://run-shortcut?name=…&input=text&text=…` – iOS otvorí Skratky a spustí menovanú skratku. */
export function shortcutRunUrl(name: string, input: string): string {
  return `shortcuts://run-shortcut?name=${encodeURIComponent(name.trim())}&input=text&text=${encodeURIComponent(input)}`
}

export function workoutShortcutUrl(name: string, payload: WorkoutWindowPayload): string {
  return shortcutRunUrl(name, JSON.stringify(payload))
}

export function hasShortcutName(name: string | undefined | null): name is string {
  return typeof name === 'string' && name.trim().length > 0
}
