import { describe, expect, it } from 'vitest'
import { actualWeeklyVolume, adherence, plannedWeeklyVolume, volumeLines } from '../src/domain/analytics'
import { weeklyVolume } from '../src/domain/program'
import type { Settings, SetLog, Workout } from '../src/domain/types'

const settings: Settings = {
  id: 1, createdAt: '2026-09-07', sex: 'm', age: 35, heightCm: 180, startWeightKg: 105, targetWeightKg: 85, bodyFatPct: null,
  kettlebells: [12, 16, 24], hasBand: true, hasMat: true, daysPerWeek: 3, minutesPerSession: 45, stepsStart: 6000, stepsGoal: 9000,
  activityFactor: 1.4, calorieTarget: 2310, programStartDate: '2026-09-07', cycleStartDate: '2026-09-07', deloadEveryWeeks: 7,
  manualDeloadWeeks: [], breakReminders: true,
}

let id = 1
const set = (date: string, exerciseId: string, p: Partial<SetLog> = {}): SetLog => ({
  id: id++, workoutId: 1, date, exerciseId, setIndex: 0, weightKg: 16, reps: 8, seconds: null, rpe: 8, pain: null, ...p,
})
const workout = (wid: number, date: string, template: 'A' | 'B', finished = true): Workout => ({
  id: wid, date, template, startedAt: `${date}T18:00:00`, finishedAt: finished ? `${date}T19:00:00` : undefined, isDeload: false, minutes: 45,
})

describe('skutočný týždenný objem', () => {
  it('ráta zapísané série podľa partií cviku, len v danom týždni', () => {
    const sets = [
      set('2026-09-07', 'goblet_squat'), set('2026-09-07', 'goblet_squat'), set('2026-09-07', 'goblet_squat'),
      set('2026-09-09', 'reverse_lunge'), // kvadricepsy + zadok
      set('2026-09-13', 'kb_row'), // nedeľa ešte patrí do týždňa
      set('2026-09-14', 'kb_row'), // ďalší pondelok už nie
      set('2026-09-06', 'kb_row'), // predchádzajúca nedeľa nie
    ]
    const v = actualWeeklyVolume(sets, '2026-09-07')
    expect(v.kvadricepsy).toBe(4)
    expect(v.zadok_hamstringy).toBe(1)
    expect(v.chrbat).toBe(1)
    expect(v.ramena).toBe(0)
  })
  it('rozcvičovacie série sa nerátajú', () => {
    const sets = [set('2026-09-07', 'kb_press', { warmup: true } as Partial<SetLog>), set('2026-09-07', 'kb_press')]
    expect(actualWeeklyVolume(sets, '2026-09-07').ramena).toBe(1)
  })
  it('cvik bez partií (mobilita) nič nepridá', () => {
    const v = actualWeeklyVolume([set('2026-09-07', 'cat_camel')], '2026-09-07')
    expect(Object.values(v).every((n) => n === 0)).toBe(true)
  })
})

describe('plánovaný objem týždňa', () => {
  it('bez odcvičených tréningov = A/B/A z programu', () => {
    expect(plannedWeeklyVolume(settings, [], '2026-09-07')).toEqual(weeklyVolume(['A', 'B', 'A'], 45))
  })
  it('začatý týždeň B pokračuje B/A/B', () => {
    const w = [workout(1, '2026-09-07', 'B')]
    expect(plannedWeeklyVolume(settings, w, '2026-09-07')).toEqual(weeklyVolume(['B', 'A', 'B'], 45))
  })
  it('viac tréningov než plán sa počíta celý', () => {
    const w = [workout(1, '2026-09-07', 'A'), workout(2, '2026-09-08', 'B'), workout(3, '2026-09-10', 'A'), workout(4, '2026-09-12', 'B')]
    expect(plannedWeeklyVolume(settings, w, '2026-09-07')).toEqual(weeklyVolume(['A', 'B', 'A', 'B'], 45))
  })
  it('deload týždeň má o sériu menej', () => {
    const s = { ...settings, manualDeloadWeeks: ['2026-09-07'] }
    expect(plannedWeeklyVolume(s, [], '2026-09-07')).toEqual(weeklyVolume(['A', 'B', 'A'], 45, true))
  })
  it('volumeLines drží pevné poradie partií', () => {
    const lines = volumeLines(actualWeeklyVolume([], '2026-09-07'), plannedWeeklyVolume(settings, [], '2026-09-07'))
    expect(lines.map((l) => l.group)).toEqual(['chrbat', 'hrudnik_triceps', 'ramena', 'kvadricepsy', 'zadok_hamstringy', 'lytka', 'stred'])
    expect(lines.find((l) => l.group === 'chrbat')?.planned).toBe(18)
  })
})

describe('dodržiavanie plánu', () => {
  it('uzavreté týždne od štartu, bežiaci týždeň zvlášť', () => {
    const w = [
      workout(1, '2026-09-07', 'A'), workout(2, '2026-09-09', 'B'), workout(3, '2026-09-11', 'A'), // 3/3
      workout(4, '2026-09-15', 'B'), // 1/3
      workout(5, '2026-09-16', 'A', false), // nedokončený sa neráta
      workout(6, '2026-09-22', 'A'), // bežiaci týždeň
    ]
    const a = adherence(settings, w, '2026-09-23')
    expect(a.weeks.map((x) => [x.weekStart, x.done, x.planned])).toEqual([
      ['2026-09-07', 3, 3],
      ['2026-09-14', 1, 3],
    ])
    expect(a.doneTotal).toBe(4)
    expect(a.plannedTotal).toBe(6)
    expect(a.pct).toBe(67)
    expect(a.thisWeek).toEqual({ weekStart: '2026-09-21', planned: 3, done: 1, deload: false })
  })
  it('prvý týždeň programu: žiadny uzavretý, percento null', () => {
    const a = adherence(settings, [], '2026-09-10')
    expect(a.weeks).toEqual([])
    expect(a.pct).toBeNull()
  })
  it('viac tréningov než plán nedá viac než 100 %', () => {
    const w = [workout(1, '2026-09-07', 'A'), workout(2, '2026-09-08', 'B'), workout(3, '2026-09-09', 'A'), workout(4, '2026-09-10', 'B')]
    expect(adherence(settings, w, '2026-09-14').pct).toBe(100)
  })
  it('deload týždeň je označený', () => {
    const s = { ...settings, manualDeloadWeeks: ['2026-09-07'] }
    expect(adherence(s, [], '2026-09-14').weeks[0]?.deload).toBe(true)
  })
})
