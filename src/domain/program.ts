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
import { getExercise, type MuscleGroup } from './exercises'
import type { TemplateId } from './types'

export interface TemplateItem {
  exerciseId: string
  pair: number // 1..4; dvojice sa robia striedavo (superset antagonistov)
  restSec: number
  label?: string // variant v rámci šablóny (napr. podhmat)
  sets?: number // override počtu sérií (finišery majú 2)
}

export interface SessionItem extends TemplateItem {
  sets: number
  order: number
}

/**
 * PROGRAM.md 1.2. Obe šablóny pokrývajú rovnaké vzory pohybu (drep, hinge, vertikálny ťah,
 * horizontálny ťah, tlak, tlak nad hlavu, lýtka, stred), líšia sa variantom. Vďaka tomu má každá
 * partia frekvenciu 3× týždenne bez ohľadu na to, či týždeň vyjde A/B/A alebo B/A/B (RESEARCH R3:
 * frekvencia aspoň 2×). Prvý návrh mal tlak nad hlavu len v B, takže ramená vychádzali 1× týždenne.
 */
export const TEMPLATES: Record<TemplateId, TemplateItem[]> = {
  A: [
    { exerciseId: 'goblet_squat', pair: 1, restSec: REST_SMALL_SEC },
    { exerciseId: 'pullup_prog', pair: 1, restSec: REST_MAIN_SEC },
    { exerciseId: 'kb_rdl', pair: 2, restSec: REST_SMALL_SEC },
    { exerciseId: 'pushup_prog', pair: 2, restSec: REST_MAIN_SEC },
    { exerciseId: 'kb_row', pair: 3, restSec: REST_SMALL_SEC },
    { exerciseId: 'kb_press', pair: 3, restSec: REST_MAIN_SEC },
    { exerciseId: 'calf_raise_slow', pair: 4, restSec: REST_SMALL_SEC },
    { exerciseId: 'suitcase_carry', pair: 4, restSec: REST_SMALL_SEC, sets: 2 },
  ],
  B: [
    { exerciseId: 'kb_deadlift', pair: 1, restSec: REST_SMALL_SEC },
    { exerciseId: 'pullup_prog', pair: 1, restSec: REST_MAIN_SEC, label: 'podhmat / neutrálny úchop' },
    { exerciseId: 'reverse_lunge', pair: 2, restSec: REST_SMALL_SEC },
    { exerciseId: 'dip_prog', pair: 2, restSec: REST_MAIN_SEC },
    { exerciseId: 'kb_row', pair: 3, restSec: REST_SMALL_SEC },
    { exerciseId: 'kb_press', pair: 3, restSec: REST_MAIN_SEC },
    { exerciseId: 'calf_raise_slow', pair: 4, restSec: REST_SMALL_SEC },
    { exerciseId: 'hollow_hold', pair: 4, restSec: REST_SMALL_SEC, sets: 2 },
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
 * PROGRAM.md 1.2 „Prispôsobenie času“: ≤30 min vypadnú dvojice 3 a 4; ≥60 min 4 série v dvojiciach 1–2.
 * Deload: −1 séria (min. 2). Finišery (nosenie, stred tela) majú vlastný počet sérií.
 */
export function buildSession(template: TemplateId, minutes: number, isDeload: boolean): SessionItem[] {
  const items = TEMPLATES[template]
  const out: SessionItem[] = []
  let order = 0
  for (const it of items) {
    if (minutes <= SHORT_SESSION_MINUTES && it.pair >= 3) continue
    let sets = it.sets ?? DEFAULT_SETS
    if (minutes >= LONG_SESSION_MINUTES && it.pair <= 2 && it.sets === undefined) sets = LONG_SESSION_SETS
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

/**
 * Týždenný objem na partiu pre daný sled tréningov (RESEARCH R3: 10–14 priamych sérií,
 * frekvencia 2× týždenne). Slúži na kontrolu, že šablóny naozaj dávajú, čo PROGRAM.md tvrdí.
 */
export function weeklyVolume(order: TemplateId[], minutes: number, isDeload = false): Record<MuscleGroup, number> {
  const totals: Record<MuscleGroup, number> = {
    chrbat: 0,
    hrudnik_triceps: 0,
    ramena: 0,
    kvadricepsy: 0,
    zadok_hamstringy: 0,
    lytka: 0,
    stred: 0,
  }
  for (const t of order) {
    for (const item of buildSession(t, minutes, isDeload)) {
      for (const g of getExercise(item.exerciseId).groups ?? []) totals[g] += item.sets
    }
  }
  return totals
}

/** Koľkokrát za týždeň sa partia trénuje (frekvencia). */
export function weeklyFrequency(order: TemplateId[], minutes: number): Record<MuscleGroup, number> {
  const counts: Record<MuscleGroup, number> = {
    chrbat: 0,
    hrudnik_triceps: 0,
    ramena: 0,
    kvadricepsy: 0,
    zadok_hamstringy: 0,
    lytka: 0,
    stred: 0,
  }
  for (const t of order) {
    const groups = new Set<MuscleGroup>()
    for (const item of buildSession(t, minutes, false)) for (const g of getExercise(item.exerciseId).groups ?? []) groups.add(g)
    for (const g of groups) counts[g] += 1
  }
  return counts
}

/** Sled tréningov v týždni podľa počtu dní (striedanie A/B, PROGRAM.md 0). */
export function weekOrder(daysPerWeek: 2 | 3 | 4, startWith: TemplateId = 'A'): TemplateId[] {
  const out: TemplateId[] = []
  let cur = startWith
  for (let i = 0; i < daysPerWeek; i++) {
    out.push(cur)
    cur = cur === 'A' ? 'B' : 'A'
  }
  return out
}
