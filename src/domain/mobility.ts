/**
 * PROGRAM.md 2 – denná mobilitná rutina (~12 min vrátane pauz).
 * Strečingové časy: 30–45 s na pozíciu => ~5 min/partiu/týždeň (RESEARCH R8: Thomas 2018 ≥5 min/týž,
 * Konrad 2024 strop 10 min/týž). Big 3 pyramída 3-2-1 × 10 s (RESEARCH R9); pokročilý môže 5-3-1,
 * rutina sa tým predĺži na ~17 min.
 */

export type RoutineItem =
  | { id: string; exerciseId: string; title: string; type: 'reps'; reps: number; seconds: number; perSide: boolean; cue: string }
  | { id: string; exerciseId: string; title: string; type: 'hold'; seconds: number; perSide: boolean; cue: string }
  | { id: string; exerciseId: string; title: string; type: 'pyramid'; pyramid: number[]; holdSec: number; perSide: boolean; cue: string }

export const MOBILITY_ROUTINE: RoutineItem[] = [
  { id: 'm1', exerciseId: 'cat_camel', title: 'Cat-camel', type: 'reps', reps: 10, seconds: 35, perSide: false, cue: 'Pomaly, celá chrbtica, bez tlaku do krajných polôh.' },
  { id: 'm2', exerciseId: 'hip_flexor_stretch', title: 'Flexory bedier v polokľaku', type: 'hold', seconds: 45, perSide: true, cue: 'Zadok stiahnutý, panva podsadená, ťah vpredu na stehne.' },
  { id: 'm3', exerciseId: 'ninety_ninety', title: '90/90 prehadzovanie bokov', type: 'hold', seconds: 40, perSide: false, cue: 'Trup vzpriamený, pomaly na obe strany.' },
  { id: 'm4', exerciseId: 'figure_four', title: 'Strečing zadku „štvorka“', type: 'hold', seconds: 45, perSide: true, cue: 'Členok na koleno, pritiahni stehno.' },
  { id: 'm5', exerciseId: 'thoracic_ext', title: 'Hrudná chrbtica: extenzia + open book', type: 'reps', reps: 8, seconds: 35, perSide: true, cue: '8× extenzia cez operadlo, potom 8× rotácia na boku.' },
  { id: 'm6', exerciseId: 'wall_slides', title: 'Wall slides / pull-apart', type: 'reps', reps: 10, seconds: 30, perSide: false, cue: 'Lakte pri stene, ramená dole.' },
  { id: 'm7', exerciseId: 'mcgill_curlup', title: 'McGill curl-up', type: 'pyramid', pyramid: [3, 2, 1], holdSec: 10, perSide: false, cue: 'Ruky pod driekom, dvíhaj len hlavu a ramená.' },
  { id: 'm8', exerciseId: 'side_bridge', title: 'Bočný most', type: 'pyramid', pyramid: [3, 2, 1], holdSec: 10, perSide: true, cue: 'Telo v jednej línii, boky hore.' },
  { id: 'm9', exerciseId: 'bird_dog', title: 'Bird dog', type: 'pyramid', pyramid: [3, 2, 1], holdSec: 10, perSide: true, cue: 'Panva rovno, „zametaj“ späť.' },
]

export interface TimerStep {
  itemId: string
  title: string
  detail: string
  seconds: number
}

const PYRAMID_REST_SEC = 2

/** Rozbalí rutinu na sekvenciu krokov s časom (pyramída: každá výdrž ako krok, medzi nimi 3 s). */
export function expandRoutine(routine: RoutineItem[] = MOBILITY_ROUTINE): TimerStep[] {
  const steps: TimerStep[] = []
  for (const it of routine) {
    const sides = it.perSide ? ['ľavá', 'pravá'] : ['']
    for (const side of sides) {
      const sideLabel = side ? ` – ${side} strana` : ''
      if (it.type === 'reps') {
        steps.push({ itemId: it.id, title: `${it.title}${sideLabel}`, detail: `${it.reps}× – ${it.cue}`, seconds: it.seconds })
      } else if (it.type === 'hold') {
        steps.push({ itemId: it.id, title: `${it.title}${sideLabel}`, detail: it.cue, seconds: it.seconds })
      } else {
        it.pyramid.forEach((count, blockIdx) => {
          for (let r = 1; r <= count; r++) {
            steps.push({
              itemId: it.id,
              title: `${it.title}${sideLabel}`,
              detail: `Blok ${blockIdx + 1}/${it.pyramid.length}, výdrž ${r}/${count} (${it.holdSec} s) – ${it.cue}`,
              seconds: it.holdSec,
            })
            steps.push({ itemId: it.id, title: 'Uvoľni', detail: `${PYRAMID_REST_SEC} s pauza`, seconds: PYRAMID_REST_SEC })
          }
        })
      }
    }
  }
  return steps
}

export function routineTotalSeconds(routine: RoutineItem[] = MOBILITY_ROUTINE): number {
  return expandRoutine(routine).reduce((s, st) => s + st.seconds, 0)
}

/** PROGRAM.md 3 – mikropauzy. */
export const MICRO_BREAKS = [
  'Vstaň a prejdi 40 krokov.',
  '10× vstávanie zo stoličky (alebo 10× hip hinge).',
  '5× extenzia hrudníka cez operadlo stoličky.',
  '20 s strečing hrudníka v dverách.',
  'Každé 2 hodiny: 5 min chôdze.',
]
