import { describe, expect, it } from 'vitest'
import { EXERCISES, EXERCISE_MAP } from '../src/domain/exercises'
import { applySwaps, buildSession, estimateMinutes, nextTemplate, swapCandidates, TEMPLATES, weeklyFrequency, weeklyVolume, weekOrder } from '../src/domain/program'
import { expandRoutine, routineTotalSeconds } from '../src/domain/mobility'
import { stepGoalForWeek, weeklySteps } from '../src/domain/steps'
import { planForToday } from '../src/domain/plan'

describe('šablóny', () => {
  it('každý cvik v šablóne existuje v knižnici', () => {
    for (const t of Object.values(TEMPLATES)) for (const it of t) expect(EXERCISE_MAP[it.exerciseId]).toBeDefined()
  })
  it('knižnica: každý cvik má techniku, chyby, regresiu, progresiu, náhradu', () => {
    for (const e of EXERCISES) {
      expect(e.technique.length).toBeGreaterThan(10)
      expect(e.mistakes.length).toBeGreaterThan(3)
      expect(e.regression.length).toBeGreaterThan(0)
      expect(e.progression.length).toBeGreaterThan(0)
      expect(e.painSub.length).toBeGreaterThan(0)
      if (e.kind === 'load') expect(e.range).toBeDefined()
      if (e.kind === 'stage') expect(e.stages?.length).toBeGreaterThan(2)
    }
  })
  it('45 min: 8 cvikov, hlavné po 3 série, finišer 2; deload o sériu menej', () => {
    const s = buildSession('A', 45, false)
    expect(s).toHaveLength(8)
    expect(s.filter((i) => i.exerciseId !== 'suitcase_carry').every((i) => i.sets === 3)).toBe(true)
    expect(s.find((i) => i.exerciseId === 'suitcase_carry')?.sets).toBe(2)
    const deload = buildSession('A', 45, true)
    expect(deload.filter((i) => i.exerciseId !== 'suitcase_carry').every((i) => i.sets === 2)).toBe(true)
    expect(deload.find((i) => i.exerciseId === 'suitcase_carry')?.sets).toBe(1)
  })
  it('30 min: vypadnú dvojice 3 a 4', () => {
    const s = buildSession('B', 30, false)
    expect(s.map((i) => i.pair)).toEqual([1, 1, 2, 2])
  })
  it('60 min: 4 série v dvojiciach 1–2, finišer zostáva na 2', () => {
    const s = buildSession('A', 60, false)
    expect(s.filter((i) => i.pair <= 2).every((i) => i.sets === 4)).toBe(true)
    expect(s.find((i) => i.exerciseId === 'suitcase_carry')?.sets).toBe(2)
  })
  it('odhad trvania sedí s nastaveným časom', () => {
    expect(estimateMinutes(buildSession('A', 30, false))).toBeLessThanOrEqual(35)
    const m45 = estimateMinutes(buildSession('A', 45, false))
    expect(m45).toBeGreaterThan(35)
    expect(m45).toBeLessThanOrEqual(52)
    expect(estimateMinutes(buildSession('A', 60, false))).toBeLessThanOrEqual(62)
  })
  it('striedanie A/B', () => {
    expect(nextTemplate(null)).toBe('A')
    expect(nextTemplate('A')).toBe('B')
    expect(nextTemplate('B')).toBe('A')
  })
})

describe('výmena cviku v tréningu', () => {
  const session = buildSession('B', 45, false)
  it('náhrada preberá miesto, série a pauzu; label ostáva len pôvodnému', () => {
    const pull = session.find((it) => it.exerciseId === 'pullup_prog')!
    const out = applySwaps(session, { [pull.order]: 'kb_floor_press' })
    const swapped = out.find((it) => it.order === pull.order)!
    expect(swapped.exerciseId).toBe('kb_floor_press')
    expect(swapped.originalExerciseId).toBe('pullup_prog')
    expect(swapped.sets).toBe(pull.sets)
    expect(swapped.restSec).toBe(pull.restSec)
    expect(swapped.label).toBeUndefined()
    expect(out.filter((it) => it.order !== pull.order).map((it) => it.exerciseId)).toEqual(session.filter((it) => it.order !== pull.order).map((it) => it.exerciseId))
  })
  it('bez výmen je sedenie nezmenené a každý cvik má originalExerciseId', () => {
    const out = applySwaps(session, undefined)
    expect(out.map((it) => it.exerciseId)).toEqual(session.map((it) => it.exerciseId))
    expect(out.every((it) => it.originalExerciseId === it.exerciseId)).toBe(true)
  })
  it('kandidáti: bez mobility, bez cvikov už v tréningu, rovnaká partia prvá', () => {
    const dip = session.find((it) => it.exerciseId === 'dip_prog')!
    const c = swapCandidates(session, dip.order)
    expect(c.some((e) => e.category === 'mobilita')).toBe(false)
    expect(c.some((e) => e.id === 'kb_row')).toBe(false) // už v tréningu B
    expect(c.some((e) => e.id === 'dip_prog')).toBe(true) // pôvodný cvik ostáva na výber (návrat)
    expect(c[0]?.groups).toContain('hrudnik_triceps')
    expect(swapCandidates(session, 99)).toEqual([])
  })
})

describe('týždenný objem a frekvencia (RESEARCH R3)', () => {
  const GROUPS = ['chrbat', 'hrudnik_triceps', 'ramena', 'kvadricepsy', 'zadok_hamstringy', 'lytka', 'stred'] as const

  it('každá partia sa trénuje aspoň 2× týždenne bez ohľadu na poradie A/B', () => {
    for (const start of ['A', 'B'] as const) {
      const freq = weeklyFrequency(weekOrder(3, start), 45)
      for (const g of GROUPS) expect(freq[g], `${g} pri štarte ${start}`).toBeGreaterThanOrEqual(2)
    }
  })
  it('objem na partiu je v pásme vhodnom pre deficit (6–18 priamych sérií)', () => {
    for (const start of ['A', 'B'] as const) {
      const vol = weeklyVolume(weekOrder(3, start), 45)
      for (const g of GROUPS) {
        expect(vol[g], `${g} pri štarte ${start}`).toBeGreaterThanOrEqual(6)
        expect(vol[g], `${g} pri štarte ${start}`).toBeLessThanOrEqual(18)
      }
    }
  })
  it('poradie týždňa nemení frekvenciu žiadnej partie', () => {
    const a = weeklyFrequency(weekOrder(3, 'A'), 45)
    const b = weeklyFrequency(weekOrder(3, 'B'), 45)
    expect(a).toEqual(b)
  })
  it('pri 2 dňoch v týždni je frekvencia aspoň 2× (minimálna dávka)', () => {
    const freq = weeklyFrequency(weekOrder(2, 'A'), 45)
    for (const g of GROUPS) expect(freq[g], g).toBeGreaterThanOrEqual(2)
  })
  it('deload uberie objem, nie frekvenciu', () => {
    const normal = weeklyVolume(weekOrder(3, 'A'), 45, false)
    const deload = weeklyVolume(weekOrder(3, 'A'), 45, true)
    for (const g of GROUPS) expect(deload[g]).toBeLessThan(normal[g])
  })
  it('lýtka sa trénujú 3× týždenne (protokol pre Achilovu šľachu, R12)', () => {
    expect(weeklyFrequency(weekOrder(3, 'A'), 45).lytka).toBe(3)
  })
})

describe('mobilita', () => {
  it('rutina sa zmestí do 8–12 min (zadanie)', () => {
    const total = routineTotalSeconds()
    expect(total).toBeGreaterThan(8 * 60)
    expect(total).toBeLessThanOrEqual(12 * 60)
  })
  it('pyramída 3-2-1 na stranu = 6 výdrží × 2 strany', () => {
    const steps = expandRoutine().filter((s) => s.itemId === 'm8' && s.title !== 'Uvoľni')
    expect(steps).toHaveLength(12)
  })
  it('každá výdrž pyramídy má 10 s a pauzu 2 s', () => {
    const steps = expandRoutine().filter((s) => s.itemId === 'm7')
    expect(steps.filter((s) => s.seconds === 10)).toHaveLength(6)
    expect(steps.filter((s) => s.title === 'Uvoľni')).toHaveLength(6)
  })
})

describe('kroky', () => {
  it('cieľ rastie o 500/týždeň po strop', () => {
    expect(stepGoalForWeek(0, 6000, 9000)).toBe(6000)
    expect(stepGoalForWeek(3, 6000, 9000)).toBe(7500)
    expect(stepGoalForWeek(10, 6000, 9000)).toBe(9000)
    expect(stepGoalForWeek(-2, 6000, 9000)).toBe(6000)
  })
  it('týždenný prehľad', () => {
    const days = [
      { date: '2026-09-07', steps: 7000 },
      { date: '2026-09-08', steps: 5000 },
      { date: '2026-09-10', steps: 9000 },
    ]
    const w = weeklySteps(days, '2026-09-07', 6000)
    expect(w.total).toBe(21000)
    expect(w.daysLogged).toBe(3)
    expect(w.avgLogged).toBe(7000)
    expect(w.daysAtGoal).toBe(2)
    expect(w.days).toHaveLength(7)
  })
})

describe('plán dňa', () => {
  const settings = {
    id: 1 as const, createdAt: '2026-09-07', sex: 'm' as const, age: 35, heightCm: 180, startWeightKg: 105, targetWeightKg: 85,
    bodyFatPct: null, kettlebells: [12, 16, 24], hasBand: true, hasMat: true, daysPerWeek: 3 as const, minutesPerSession: 45 as const,
    stepsStart: 6000, stepsGoal: 9000, activityFactor: 1.4, calorieTarget: 2310, programStartDate: '2026-09-07',
    cycleStartDate: '2026-09-07', deloadEveryWeeks: 7, manualDeloadWeeks: [], breakReminders: true,
  }
  const w = (date: string, template: 'A' | 'B', finished = true) => ({
    id: Math.random(), date, template, startedAt: `${date}T10:00:00Z`, finishedAt: finished ? `${date}T11:00:00Z` : undefined, isDeload: false, minutes: 45,
  })

  it('prvý tréning je A', () => {
    const p = planForToday(settings, [], '2026-09-07')
    expect(p.kind).toBe('workout')
    expect(p.template).toBe('A')
    expect(p.isDeload).toBe(false)
  })
  it('po A nasleduje B', () => {
    expect(planForToday(settings, [w('2026-09-07', 'A')], '2026-09-09').template).toBe('B')
  })
  it('dnes už odtrénované → done', () => {
    expect(planForToday(settings, [w('2026-09-09', 'B')], '2026-09-09').kind).toBe('done')
  })
  it('splnený počet dní v týždni → rest', () => {
    const ws = [w('2026-09-07', 'A'), w('2026-09-09', 'B'), w('2026-09-11', 'A')]
    const p = planForToday(settings, ws, '2026-09-12')
    expect(p.kind).toBe('rest')
    expect(p.doneThisWeek).toBe(3)
  })
  it('nedokončený tréning → continue', () => {
    const p = planForToday(settings, [w('2026-09-09', 'B', false)], '2026-09-09')
    expect(p.kind).toBe('continue')
    expect(p.openWorkoutId).toBeDefined()
  })
  it('deload týždeň sa premietne do plánu', () => {
    const p = planForToday(settings, [], '2026-10-19')
    expect(p.isDeload).toBe(true)
    expect(p.note).toContain('Deload')
  })
})
