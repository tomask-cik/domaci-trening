import {
  DELOAD_REP_REDUCTION,
  FAIL_STREAK_TO_REGRESS,
  PAIN_REGRESS_ABOVE,
  REGRESS_REPS_BELOW_HI,
  RPE_PROGRESS_MAX,
  STAGE_DOWN_BELOW_HI,
  TIMED_INCREMENT_SEC,
  TOP_STREAK_TO_STAGE_UP,
} from './constants'
import type { Exercise } from './exercises'
import type { ExerciseState } from './types'

export type ChangeKind =
  | 'up_reps'
  | 'up_weight'
  | 'up_variant'
  | 'up_time'
  | 'stage_up'
  | 'hold'
  | 'down'
  | 'stage_down'
  | 'deload'
  | 'none'

export interface SetInput {
  weightKg?: number | null
  reps?: number | null
  seconds?: number | null
  rpe: number
  pain?: number | null
}

export interface Suggestion {
  state: ExerciseState
  change: ChangeKind
  message: string
}

export interface ProgressionContext {
  kettlebells: number[]
  isDeload: boolean
  today: string
}

/** Najťažší dostupný KB ≤ navrhovanej váhe; ak žiadny, najľahší. */
export function pickStartWeight(kettlebells: number[], suggested: number): number | null {
  const kbs = [...kettlebells].sort((a, b) => a - b)
  if (kbs.length === 0) return null
  const fit = kbs.filter((k) => k <= suggested)
  return fit.length ? (fit[fit.length - 1] ?? null) : (kbs[0] ?? null)
}

export function nextHeavier(kettlebells: number[], current: number): number | null {
  const kbs = [...kettlebells].sort((a, b) => a - b)
  return kbs.find((k) => k > current) ?? null
}

export function nextLighter(kettlebells: number[], current: number): number | null {
  const kbs = [...kettlebells].sort((a, b) => b - a)
  return kbs.find((k) => k < current) ?? null
}

export function initialState(ex: Exercise, kettlebells: number[], today: string): ExerciseState {
  const base: ExerciseState = {
    exerciseId: ex.id,
    weightKg: null,
    targetReps: null,
    variant: 0,
    stage: 0,
    target: null,
    topStreak: 0,
    failStreak: 0,
    updatedAt: today,
    lastChange: null,
  }
  if (ex.kind === 'load') {
    const [lo] = ex.range ?? [8, 12]
    return { ...base, weightKg: pickStartWeight(kettlebells, ex.startWeightKg ?? 12), targetReps: lo }
  }
  if (ex.kind === 'timed') {
    const [lo] = ex.timedRange ?? [20, 40]
    return {
      ...base,
      weightKg: ex.startWeightKg ? pickStartWeight(kettlebells, ex.startWeightKg) : null,
      target: lo,
    }
  }
  const st = ex.stages?.[0]
  return { ...base, stage: 0, target: st ? st.lo : null }
}

export interface Recommendation {
  title: string // napr. „16 kg × 8 op.“
  detail: string // napr. názov štádia / variantu
  weightKg: number | null
  targetReps: number | null
  targetSeconds: number | null
  unit: 'reps' | 'sec'
}

/** Čo zobraziť v tréningu (deload = −2 opakovania / −5 s, nie pod dolnú hranicu). */
export function recommend(ex: Exercise, state: ExerciseState, isDeload: boolean): Recommendation {
  const side = ex.perSide ? ' / strana' : ''
  if (ex.kind === 'load') {
    const [lo] = ex.range ?? [8, 12]
    let reps = state.targetReps ?? lo
    if (isDeload) reps = Math.max(lo, reps - DELOAD_REP_REDUCTION)
    const w = state.weightKg
    const variant = ex.variants?.[state.variant] ?? ''
    return {
      title: `${w !== null ? `${w} kg × ` : ''}${reps} op.${side}`,
      detail: variant && state.variant > 0 ? variant : '',
      weightKg: w,
      targetReps: reps,
      targetSeconds: null,
      unit: 'reps',
    }
  }
  if (ex.kind === 'timed') {
    const [lo] = ex.timedRange ?? [20, 40]
    let sec = state.target ?? lo
    if (isDeload) sec = Math.max(lo, sec - TIMED_INCREMENT_SEC)
    const w = state.weightKg
    return {
      title: `${w !== null ? `${w} kg – ` : ''}${sec} s${side}`,
      detail: '',
      weightKg: w,
      targetReps: null,
      targetSeconds: sec,
      unit: 'sec',
    }
  }
  const st = ex.stages?.[state.stage] ?? ex.stages?.[0]
  if (!st) return { title: '', detail: '', weightKg: null, targetReps: null, targetSeconds: null, unit: 'reps' }
  let t = state.target ?? st.lo
  if (isDeload) t = Math.max(st.lo, t - (st.unit === 'sec' ? TIMED_INCREMENT_SEC : DELOAD_REP_REDUCTION))
  return {
    title: st.unit === 'sec' ? `${t} s` : `${t} op.`,
    detail: `Štádium ${state.stage + 1}/${ex.stages?.length ?? 0}: ${st.name}${st.note ? ` – ${st.note}` : ''}`,
    weightKg: null,
    targetReps: st.unit === 'reps' ? t : null,
    targetSeconds: st.unit === 'sec' ? t : null,
    unit: st.unit,
  }
}

function avg(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
}

/**
 * PROGRAM.md 1.3 – algoritmus progresie. Čistá funkcia: stav + zapísané série → nový stav + správa.
 */
export function suggestNext(ex: Exercise, state: ExerciseState, sets: SetInput[], ctx: ProgressionContext): Suggestion {
  const upd = (patch: Partial<ExerciseState>, change: ChangeKind, message: string): Suggestion => ({
    state: { ...state, ...patch, updatedAt: ctx.today, lastChange: message },
    change,
    message,
  })

  if (sets.length === 0) return { state, change: 'none', message: 'Bez zapísaných sérií – bez zmeny.' }
  if (ctx.isDeload) return { state, change: 'deload', message: 'Deload týždeň – progresia sa nevyhodnocuje.' }

  const maxPain = Math.max(0, ...sets.map((s) => s.pain ?? 0))
  const avgRpe = avg(sets.map((s) => s.rpe))

  if (maxPain > PAIN_REGRESS_ABOVE) {
    return regress(ex, state, ctx, `Bolesť ${maxPain}/10 – ustupujeme o krok. Ak pretrvá, použi náhradu pri bolesti.`)
  }

  if (ex.kind === 'load') {
    const [lo, hi] = ex.range ?? [8, 12]
    const target = state.targetReps ?? lo
    const reps = sets.map((s) => s.reps ?? 0)
    const allHitHi = reps.every((r) => r >= hi)
    const allHitTarget = reps.every((r) => r >= target)
    const anyBelowLo = reps.some((r) => r < lo)

    if (allHitHi && avgRpe <= RPE_PROGRESS_MAX) {
      const heavier = state.weightKg !== null ? nextHeavier(ctx.kettlebells, state.weightKg) : null
      if (heavier !== null) {
        return upd(
          { weightKg: heavier, targetReps: lo, failStreak: 0, topStreak: 0 },
          'up_weight',
          `Všetky série ${hi} op. s RPE ≤ 8,5 → ťažší kettlebell ${heavier} kg, cieľ ${lo} op.`,
        )
      }
      const variants = ex.variants ?? []
      if (state.variant < variants.length - 1) {
        const v = state.variant + 1
        return upd(
          { variant: v, targetReps: lo, failStreak: 0, topStreak: 0 },
          'up_variant',
          `Nemáš ťažší kettlebell → ťažší variant: ${variants[v]}, cieľ ${lo} op.`,
        )
      }
      return upd(
        { failStreak: 0 },
        'hold',
        `Maximum vybavenia aj variantov – pridaj sériu alebo spomaľ tempo. Zváž kúpu ťažšieho kettlebellu.`,
      )
    }
    if (allHitTarget && avgRpe <= RPE_PROGRESS_MAX) {
      const t = Math.min(hi, target + 1)
      return upd({ targetReps: t, failStreak: 0 }, 'up_reps', `Splnené ${target} op. vo všetkých sériách → nabudúce ${t} op.`)
    }
    if (anyBelowLo) {
      const fs = state.failStreak + 1
      if (fs >= FAIL_STREAK_TO_REGRESS) {
        return regress(ex, state, ctx, `Dva tréningy pod ${lo} op. → ľahšie.`)
      }
      return upd({ failStreak: fs }, 'hold', `Séria pod ${lo} op. – drž váhu; ak sa to zopakuje, ustúpime.`)
    }
    return upd({ failStreak: 0 }, 'hold', avgRpe > RPE_PROGRESS_MAX ? `RPE ${avgRpe.toFixed(1)} – drž, kým nebude ≤ 8,5.` : `Nesplnený cieľ ${target} op. – drž.`)
  }

  if (ex.kind === 'timed') {
    const [lo, hi] = ex.timedRange ?? [20, 40]
    const target = state.target ?? lo
    const secs = sets.map((s) => s.seconds ?? 0)
    const allHitHi = secs.every((x) => x >= hi)
    const allHitTarget = secs.every((x) => x >= target)
    const anyBelowLo = secs.some((x) => x < lo)
    if (allHitHi && avgRpe <= RPE_PROGRESS_MAX) {
      const heavier = state.weightKg !== null ? nextHeavier(ctx.kettlebells, state.weightKg) : null
      if (heavier !== null) {
        return upd({ weightKg: heavier, target: lo, failStreak: 0 }, 'up_weight', `${hi} s vo všetkých sériách → ${heavier} kg, cieľ ${lo} s.`)
      }
      return upd({ failStreak: 0 }, 'hold', `Maximum ${hi} s – bez ťažšieho KB drž alebo pridaj sériu.`)
    }
    if (allHitTarget && avgRpe <= RPE_PROGRESS_MAX) {
      const t = Math.min(hi, target + TIMED_INCREMENT_SEC)
      return upd({ target: t, failStreak: 0 }, 'up_time', `Splnené ${target} s → nabudúce ${t} s.`)
    }
    if (anyBelowLo) {
      const fs = state.failStreak + 1
      if (fs >= FAIL_STREAK_TO_REGRESS) return regress(ex, state, ctx, `Dva tréningy pod ${lo} s → ľahšie.`)
      return upd({ failStreak: fs }, 'hold', `Pod ${lo} s – drž.`)
    }
    return upd({ failStreak: 0 }, 'hold', `Nesplnený cieľ ${target} s – drž.`)
  }

  // stage
  const stages = ex.stages ?? []
  const st = stages[state.stage]
  if (!st) return { state, change: 'none', message: 'Cvik bez štádií.' }
  const target = state.target ?? st.lo
  const vals = sets.map((s) => (st.unit === 'sec' ? (s.seconds ?? 0) : (s.reps ?? 0)))
  const inc = st.unit === 'sec' ? TIMED_INCREMENT_SEC : 1
  const unitLabel = st.unit === 'sec' ? 's' : 'op.'
  const allHitHi = vals.every((v) => v >= st.hi)
  const allHitTarget = vals.every((v) => v >= target)
  const anyBelowLo = vals.some((v) => v < st.lo)

  if (allHitHi && avgRpe <= RPE_PROGRESS_MAX) {
    const ts = state.topStreak + 1
    const isLast = state.stage >= stages.length - 1
    if (ts >= TOP_STREAK_TO_STAGE_UP && !isLast) {
      const ns = stages[state.stage + 1]
      return upd(
        { stage: state.stage + 1, target: ns?.lo ?? null, topStreak: 0, failStreak: 0 },
        'stage_up',
        `Dvakrát za sebou ${st.hi} ${unitLabel} → štádium ${state.stage + 2}: ${ns?.name ?? ''}, cieľ ${ns?.lo ?? ''} ${ns?.unit === 'sec' ? 's' : 'op.'}.`,
      )
    }
    if (isLast) {
      return upd({ target: st.hi, topStreak: ts, failStreak: 0 }, 'hold', `Posledné štádium na maxime – pridaj záťaž (KB medzi nohami) a začni od ${st.lo} op.`)
    }
    return upd({ target: st.hi, topStreak: ts, failStreak: 0 }, 'hold', `${st.hi} ${unitLabel} vo všetkých sériách – ešte raz a postupuješ do ďalšieho štádia.`)
  }
  if (allHitTarget && avgRpe <= RPE_PROGRESS_MAX) {
    const t = Math.min(st.hi, target + inc)
    return upd({ target: t, topStreak: 0, failStreak: 0 }, st.unit === 'sec' ? 'up_time' : 'up_reps', `Splnené ${target} ${unitLabel} → nabudúce ${t} ${unitLabel}.`)
  }
  if (anyBelowLo) {
    const fs = state.failStreak + 1
    if (fs >= FAIL_STREAK_TO_REGRESS) return regress(ex, state, ctx, `Dva tréningy pod ${st.lo} ${unitLabel} → predchádzajúce štádium.`)
    return upd({ failStreak: fs, topStreak: 0 }, 'hold', `Pod ${st.lo} ${unitLabel} – drž; ak sa zopakuje, vrátime sa o štádium.`)
  }
  return upd({ topStreak: 0, failStreak: 0 }, 'hold', avgRpe > RPE_PROGRESS_MAX ? `RPE ${avgRpe.toFixed(1)} – drž.` : `Nesplnený cieľ ${target} ${unitLabel} – drž.`)
}

function regress(ex: Exercise, state: ExerciseState, ctx: ProgressionContext, why: string): Suggestion {
  const base = { updatedAt: ctx.today, failStreak: 0, topStreak: 0 }
  if (ex.kind === 'load') {
    const [lo, hi] = ex.range ?? [8, 12]
    const target = Math.max(lo, hi - REGRESS_REPS_BELOW_HI)
    if (state.variant > 0) {
      const v = state.variant - 1
      const msg = `${why} Späť na variant: ${ex.variants?.[v] ?? 'základ'}, cieľ ${target} op.`
      return { state: { ...state, ...base, variant: v, targetReps: target, lastChange: msg }, change: 'down', message: msg }
    }
    const lighter = state.weightKg !== null ? nextLighter(ctx.kettlebells, state.weightKg) : null
    if (lighter !== null) {
      const msg = `${why} Ľahší kettlebell ${lighter} kg, cieľ ${target} op.`
      return { state: { ...state, ...base, weightKg: lighter, targetReps: target, lastChange: msg }, change: 'down', message: msg }
    }
    const msg = `${why} Najľahší kettlebell – použi regresiu z knižnice: ${ex.regression}`
    return { state: { ...state, ...base, targetReps: lo, lastChange: msg }, change: 'down', message: msg }
  }
  if (ex.kind === 'timed') {
    const [lo] = ex.timedRange ?? [20, 40]
    const lighter = state.weightKg !== null ? nextLighter(ctx.kettlebells, state.weightKg) : null
    const msg = lighter !== null ? `${why} ${lighter} kg, cieľ ${lo} s.` : `${why} Cieľ ${lo} s.`
    return { state: { ...state, ...base, weightKg: lighter ?? state.weightKg, target: lo, lastChange: msg }, change: 'down', message: msg }
  }
  const stages = ex.stages ?? []
  if (state.stage > 0) {
    const ps = stages[state.stage - 1]
    const t = ps ? Math.max(ps.lo, ps.hi - STAGE_DOWN_BELOW_HI) : null
    const msg = `${why} Štádium ${state.stage}: ${ps?.name ?? ''}, cieľ ${t ?? ''} ${ps?.unit === 'sec' ? 's' : 'op.'}.`
    return { state: { ...state, ...base, stage: state.stage - 1, target: t, lastChange: msg }, change: 'stage_down', message: msg }
  }
  const st = stages[0]
  const msg = `${why} Si v prvom štádiu – drž ${st?.lo ?? ''} ${st?.unit === 'sec' ? 's' : 'op.'} a použi regresiu: ${ex.regression}`
  return { state: { ...state, ...base, target: st?.lo ?? null, lastChange: msg }, change: 'stage_down', message: msg }
}

/** Odhad 1RM (Epley) pre grafy sily – len pre cviky so záťažou. */
export function estimated1RM(weightKg: number, reps: number): number {
  if (reps <= 0) return 0
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10
}
