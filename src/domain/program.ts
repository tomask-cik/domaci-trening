import {
  DEFAULT_SETS,
  DELOAD_MIN_SETS,
  DELOAD_SET_REDUCTION,
  LONG_SESSION_MINUTES,
  LONG_SESSION_SETS,
  REST_MAIN_SEC,
  REST_SMALL_SEC,
  SHORT_SESSION_MINUTES,
} from './constants'
import type { TemplateId } from './types'

export interface TemplateItem {
  exerciseId: string
  pair: number // 1..4; 4 = samostatný cvik na záver
  restSec: number
  label?: string // variant v rámci šablóny (napr. podhmat)
}

export interface SessionItem extends TemplateItem {
  sets: number
  order: number
}

/** PROGRAM.md 1.2 */
export const TEMPLATES: Record<TemplateId, TemplateItem[]> = {
  A: [
    { exerciseId: 'goblet_squat', pair: 1, restSec: REST_SMALL_SEC },
    { exerciseId: 'pullup_prog', pair: 1, restSec: REST_MAIN_SEC },
    { exerciseId: 'kb_rdl', pair: 2, restSec: REST_SMALL_SEC },
    { exerciseId: 'pushup_prog', pair: 2, restSec: REST_MAIN_SEC },
    { exerciseId: 'kb_row', pair: 3, restSec: REST_SMALL_SEC },
    { exerciseId: 'calf_raise_slow', pair: 3, restSec: REST_SMALL_SEC },
    { exerciseId: 'suitcase_carry', pair: 4, restSec: REST_SMALL_SEC },
  ],
  B: [
    { exerciseId: 'kb_deadlift', pair: 1, restSec: REST_SMALL_SEC },
    { exerciseId: 'dip_prog', pair: 1, restSec: REST_MAIN_SEC },
    { exerciseId: 'reverse_lunge', pair: 2, restSec: REST_SMALL_SEC },
    { exerciseId: 'kb_press', pair: 2, restSec: REST_MAIN_SEC },
    { exerciseId: 'pullup_prog', pair: 3, restSec: REST_MAIN_SEC, label: 'podhmat / neutrálny úchop' },
    { exerciseId: 'calf_raise_slow', pair: 3, restSec: REST_SMALL_SEC },
    { exerciseId: 'hollow_hold', pair: 4, restSec: REST_SMALL_SEC },
  ],
}

export const TEMPLATE_NAMES: Record<TemplateId, string> = {
  A: 'Tréning A – drep, zhyby, hinge, kliky',
  B: 'Tréning B – mŕtvy ťah, dipy, výpady, tlak',
}

/** Ďalšia šablóna: striedanie A/B podľa posledného dokončeného tréningu. */
export function nextTemplate(lastTemplate: TemplateId | null | undefined): TemplateId {
  return lastTemplate === 'A' ? 'B' : 'A'
}

/**
 * PROGRAM.md 1.2 „Prispôsobenie času“: ≤30 min vypadne dvojica 3 a 4; ≥60 min 4 série v dvojiciach 1–2.
 * Deload: −1 séria (min. 2).
 */
export function buildSession(template: TemplateId, minutes: number, isDeload: boolean): SessionItem[] {
  const items = TEMPLATES[template]
  const out: SessionItem[] = []
  let order = 0
  for (const it of items) {
    if (minutes <= SHORT_SESSION_MINUTES && it.pair >= 3) continue
    let sets = DEFAULT_SETS
    if (minutes >= LONG_SESSION_MINUTES && it.pair <= 2) sets = LONG_SESSION_SETS
    if (isDeload) sets = Math.max(DELOAD_MIN_SETS, sets - DELOAD_SET_REDUCTION)
    out.push({ ...it, sets, order: order++ })
  }
  return out
}

/** Odhad trvania: rozcvička + série × (práca ~40 s + pauza). */
export function estimateMinutes(session: SessionItem[]): number {
  const work = session.reduce((s, it) => s + it.sets * (40 + it.restSec), 0)
  return Math.round(5 + work / 60)
}

export const WARMUP: string[] = [
  '10× cat-camel',
  '8× výpad vzad s rotáciou trupu (na stranu)',
  '10× drep bez záťaže',
  '10× krúženie ramenami vpred a vzad',
  '10× pull-apart s gumou',
  '1 ľahká séria prvého cviku',
]
