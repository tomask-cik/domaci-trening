import { describe, expect, it } from 'vitest'
import { getExercise } from '../src/domain/exercises'
import { estimated1RM, initialState, nextHeavier, nextLighter, pickStartWeight, recommend, suggestNext } from '../src/domain/progression'

const kbs = [12, 16, 24]
const ctx = { kettlebells: kbs, isDeload: false, today: '2026-09-07' }
const squat = getExercise('goblet_squat') // 6–15
const press = getExercise('kb_press') // 6–12
const pullup = getExercise('pullup_prog')
const carry = getExercise('suitcase_carry') // 30–45 s

const sets = (reps: number[], rpe = 8) => reps.map((r) => ({ reps: r, rpe }))

describe('výber váhy', () => {
  it('najťažší KB pod odporúčanou', () => {
    expect(pickStartWeight(kbs, 16)).toBe(16)
    expect(pickStartWeight(kbs, 20)).toBe(16)
    expect(pickStartWeight(kbs, 8)).toBe(12)
    expect(pickStartWeight([], 16)).toBeNull()
    expect(nextHeavier(kbs, 16)).toBe(24)
    expect(nextHeavier(kbs, 24)).toBeNull()
    expect(nextLighter(kbs, 16)).toBe(12)
    expect(nextLighter(kbs, 12)).toBeNull()
  })
  it('initialState pre load / stage / timed', () => {
    expect(initialState(squat, kbs, '2026-09-07')).toMatchObject({ weightKg: 16, targetReps: 6, variant: 0 })
    expect(initialState(pullup, kbs, '2026-09-07')).toMatchObject({ stage: 0, target: 20 })
    expect(initialState(carry, kbs, '2026-09-07')).toMatchObject({ weightKg: 24, target: 30 })
  })
})

describe('progresia cvikov s KB (PROGRAM.md 1.3)', () => {
  const st = initialState(squat, kbs, '2026-09-07')
  it('pravidlo 1: všetky série ≥ cieľ a RPE ≤ 8,5 → +1 opakovanie', () => {
    const r = suggestNext(squat, { ...st, targetReps: 8 }, sets([8, 8, 9]), ctx)
    expect(r.change).toBe('up_reps')
    expect(r.state.targetReps).toBe(9)
  })
  it('pravidlo 2: všetky série na hi → ťažší KB a cieľ lo', () => {
    const r = suggestNext(squat, { ...st, targetReps: 15 }, sets([15, 15, 15]), ctx)
    expect(r.change).toBe('up_weight')
    expect(r.state.weightKg).toBe(24)
    expect(r.state.targetReps).toBe(6)
  })
  it('pravidlo 2b: bez ťažšieho KB → ťažší variant', () => {
    const r = suggestNext(squat, { ...st, weightKg: 24, targetReps: 15 }, sets([15, 15, 15]), ctx)
    expect(r.change).toBe('up_variant')
    expect(r.state.variant).toBe(1)
    expect(r.state.targetReps).toBe(6)
  })
  it('pravidlo 2c: posledný variant → drž s odporúčaním', () => {
    const r = suggestNext(squat, { ...st, weightKg: 24, variant: 2, targetReps: 15 }, sets([15, 15, 15]), ctx)
    expect(r.change).toBe('hold')
    expect(r.message).toContain('Maximum')
  })
  it('preberá váhu, s ktorou si naozaj cvičil (nie tú z plánu)', () => {
    const r = suggestNext(squat, { ...st, weightKg: 16, targetReps: 6 }, [
      { weightKg: 20, reps: 10, rpe: 7 },
      { weightKg: 20, reps: 11, rpe: 8 },
      { weightKg: 20, reps: 10, rpe: 8 },
    ], ctx)
    expect(r.state.weightKg).toBe(20)
    expect(r.change).toBe('up_reps')
  })
  it('cieľ vychádza z odcvičených opakovaní, nie z plánu', () => {
    const r = suggestNext(squat, { ...st, targetReps: 6 }, sets([10, 11, 10], 8), ctx)
    expect(r.state.targetReps).toBe(11)
  })
  it('pri vysokom RPE nepridá +1, ale cieľ nespadne pod odcvičené', () => {
    const r = suggestNext(squat, { ...st, targetReps: 6 }, sets([10, 11, 10], 9.5), ctx)
    expect(r.change).toBe('hold')
    expect(r.state.targetReps).toBe(10)
  })
  it('ústup ide od váhy z tréningu, nie od plánu', () => {
    const r = suggestNext(squat, { ...st, weightKg: 12, targetReps: 8, failStreak: 1 }, [
      { weightKg: 24, reps: 4, rpe: 9 },
      { weightKg: 24, reps: 4, rpe: 9 },
    ], ctx)
    expect(r.change).toBe('down')
    expect(r.state.weightKg).toBe(16)
  })
  it('pravidlo 3: vysoké RPE → drž', () => {
    const r = suggestNext(squat, { ...st, targetReps: 8 }, sets([8, 8, 8], 9.5), ctx)
    expect(r.change).toBe('hold')
    expect(r.state.targetReps).toBe(8)
  })
  it('pravidlo 3: nesplnený cieľ ale nad lo → drž', () => {
    const r = suggestNext(squat, { ...st, targetReps: 10 }, sets([10, 9, 8]), ctx)
    expect(r.change).toBe('hold')
    expect(r.state.failStreak).toBe(0)
  })
  it('pravidlo 4: dvakrát pod lo → ľahší KB, cieľ hi−3', () => {
    const first = suggestNext(squat, { ...st, targetReps: 8 }, sets([8, 5, 4]), ctx)
    expect(first.change).toBe('hold')
    expect(first.state.failStreak).toBe(1)
    const second = suggestNext(squat, first.state, sets([6, 5, 5]), ctx)
    expect(second.change).toBe('down')
    expect(second.state.weightKg).toBe(12)
    expect(second.state.targetReps).toBe(12)
    expect(second.state.failStreak).toBe(0)
  })
  it('pravidlo 4b: ústup z variantu pred ľahším KB', () => {
    const r = suggestNext(squat, { ...st, weightKg: 24, variant: 1, targetReps: 8, failStreak: 1 }, sets([5, 5, 5]), ctx)
    expect(r.change).toBe('down')
    expect(r.state.variant).toBe(0)
    expect(r.state.weightKg).toBe(24)
  })
  it('bolesť > 3/10 → okamžitá regresia', () => {
    const r = suggestNext(squat, { ...st, targetReps: 8 }, [{ reps: 8, rpe: 7, pain: 4 }], ctx)
    expect(r.change).toBe('down')
    expect(r.message).toContain('Bolesť')
  })
  it('deload: bez vyhodnotenia', () => {
    const r = suggestNext(squat, { ...st, targetReps: 15 }, sets([15, 15, 15]), { ...ctx, isDeload: true })
    expect(r.change).toBe('deload')
    expect(r.state).toEqual({ ...st, targetReps: 15 })
  })
  it('bez sérií → bez zmeny', () => {
    expect(suggestNext(squat, st, [], ctx).change).toBe('none')
  })
  it('tlak 6–12: strop opakovaní je hi', () => {
    const r = suggestNext(press, { ...initialState(press, kbs, '2026-09-07'), targetReps: 12 }, sets([12, 12, 12], 9), ctx)
    expect(r.change).toBe('hold') // RPE 9 > 8,5
  })
})

describe('progresia štádií (zhyby)', () => {
  const st = initialState(pullup, kbs, '2026-09-07') // štádium 0: vis 20–40 s
  it('výdrže: +5 s', () => {
    const r = suggestNext(pullup, st, [{ seconds: 20, rpe: 7 }, { seconds: 22, rpe: 7 }, { seconds: 20, rpe: 8 }], ctx)
    expect(r.change).toBe('up_time')
    expect(r.state.target).toBe(25)
  })
  it('na hi prvýkrát → drž, topStreak 1; druhýkrát → ďalšie štádium', () => {
    const one = suggestNext(pullup, { ...st, target: 40 }, [{ seconds: 40, rpe: 8 }, { seconds: 41, rpe: 8 }, { seconds: 40, rpe: 8 }], ctx)
    expect(one.change).toBe('hold')
    expect(one.state.topStreak).toBe(1)
    const two = suggestNext(pullup, one.state, [{ seconds: 40, rpe: 8 }, { seconds: 40, rpe: 8 }, { seconds: 45, rpe: 8 }], ctx)
    expect(two.change).toBe('stage_up')
    expect(two.state.stage).toBe(1)
    expect(two.state.target).toBe(3) // negatívy lo
    expect(two.state.topStreak).toBe(0)
  })
  it('topStreak sa vynuluje, keď sa hi nesplní', () => {
    const one = suggestNext(pullup, { ...st, target: 40, topStreak: 1 }, [{ seconds: 40, rpe: 8 }, { seconds: 30, rpe: 8 }, { seconds: 40, rpe: 8 }], ctx)
    expect(one.state.topStreak).toBe(0)
  })
  it('dvakrát pod lo → predchádzajúce štádium na hi−2', () => {
    const s1 = { ...st, stage: 3, target: 5, failStreak: 1 } // guma silná 4–8
    const r = suggestNext(pullup, s1, sets([3, 2, 2]), ctx)
    expect(r.change).toBe('stage_down')
    expect(r.state.stage).toBe(2)
    expect(r.state.target).toBe(13) // izometria hi 15 − 2
  })
  it('v prvom štádiu sa nedá ustúpiť – drž lo', () => {
    const r = suggestNext(pullup, { ...st, failStreak: 1 }, [{ seconds: 10, rpe: 9 }], ctx)
    expect(r.change).toBe('stage_down')
    expect(r.state.stage).toBe(0)
    expect(r.state.target).toBe(20)
  })
  it('posledné štádium na maxime → odporučí záťaž', () => {
    const r = suggestNext(pullup, { ...st, stage: 5, target: 8, topStreak: 1 }, sets([8, 8, 8]), ctx)
    expect(r.change).toBe('hold')
    expect(r.message).toContain('záťaž')
  })
})

describe('výdrže so záťažou (carry)', () => {
  const st = initialState(carry, kbs, '2026-09-07')
  it('+5 s, potom pri 45 s bez ťažšieho KB drž', () => {
    const r = suggestNext(carry, st, [{ seconds: 30, rpe: 7 }, { seconds: 35, rpe: 7 }], ctx)
    expect(r.state.target).toBe(35)
    const top = suggestNext(carry, { ...st, target: 45 }, [{ seconds: 45, rpe: 7 }, { seconds: 45, rpe: 7 }], ctx)
    expect(top.change).toBe('hold')
  })
  it('s ťažším KB prejde na váhu', () => {
    const top = suggestNext(carry, { ...st, weightKg: 16, target: 45 }, [{ seconds: 45, rpe: 7 }, { seconds: 45, rpe: 7 }], ctx)
    expect(top.change).toBe('up_weight')
    expect(top.state.weightKg).toBe(24)
    expect(top.state.target).toBe(30)
  })
})

describe('recommend', () => {
  it('load: váha × opakovania; deload −2', () => {
    const st = { ...initialState(squat, kbs, '2026-09-07'), targetReps: 10 }
    expect(recommend(squat, st, false).title).toBe('16 kg × 10 op.')
    expect(recommend(squat, st, true).targetReps).toBe(8)
    expect(recommend(squat, { ...st, targetReps: 6 }, true).targetReps).toBe(6) // nie pod lo
  })
  it('stage: názov štádia', () => {
    const st = initialState(pullup, kbs, '2026-09-07')
    const r = recommend(pullup, st, false)
    expect(r.title).toBe('20 s')
    expect(r.detail).toContain('Štádium 1/6')
  })
  it('timed / strana', () => {
    const st = initialState(carry, kbs, '2026-09-07')
    expect(recommend(carry, st, false).title).toBe('24 kg – 30 s / strana')
  })
  it('estimated1RM', () => {
    expect(estimated1RM(24, 10)).toBe(32)
    expect(estimated1RM(24, 0)).toBe(0)
  })
})
