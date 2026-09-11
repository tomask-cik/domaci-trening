import { describe, expect, it } from 'vitest'
import { EXERCISES, EXERCISE_MAP } from '../src/domain/exercises'
import { buildSession, estimateMinutes, nextTemplate, TEMPLATES } from '../src/domain/program'
import { expandRoutine, routineTotalSeconds } from '../src/domain/mobility'
import { stepGoalForWeek, weeklySteps } from '../src/domain/steps'

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
  it('45 min: 7 cvikov po 3 série; deload 2 série', () => {
    const s = buildSession('A', 45, false)
    expect(s).toHaveLength(7)
    expect(s.every((i) => i.sets === 3)).toBe(true)
    expect(buildSession('A', 45, true).every((i) => i.sets === 2)).toBe(true)
  })
  it('30 min: vypadnú dvojice 3 a 4', () => {
    const s = buildSession('B', 30, false)
    expect(s.map((i) => i.pair)).toEqual([1, 1, 2, 2])
  })
  it('60 min: 4 série v dvojiciach 1–2', () => {
    const s = buildSession('A', 60, false)
    expect(s.filter((i) => i.pair <= 2).every((i) => i.sets === 4)).toBe(true)
    expect(s.filter((i) => i.pair > 2).every((i) => i.sets === 3)).toBe(true)
  })
  it('odhad trvania 45 min v rozumnom pásme', () => {
    const m = estimateMinutes(buildSession('A', 45, false))
    expect(m).toBeGreaterThan(35)
    expect(m).toBeLessThan(60)
  })
  it('striedanie A/B', () => {
    expect(nextTemplate(null)).toBe('A')
    expect(nextTemplate('A')).toBe('B')
    expect(nextTemplate('B')).toBe('A')
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
