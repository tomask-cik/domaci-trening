import { describe, expect, it } from 'vitest'
import { buildHistory, describeSet, personalBests, recentPrCount, setScore } from '../src/domain/history'
import type { SetLog, Workout } from '../src/domain/types'

let nextId = 1
const set = (workoutId: number, date: string, exerciseId: string, p: Partial<SetLog> = {}): SetLog => ({
  id: nextId++,
  workoutId,
  date,
  exerciseId,
  setIndex: 0,
  weightKg: null,
  reps: null,
  seconds: null,
  rpe: 8,
  pain: null,
  ...p,
})

const workout = (id: number, date: string, p: Partial<Workout> = {}): Workout => ({
  id,
  date,
  template: 'A',
  startedAt: `${date}T10:00:00`,
  finishedAt: `${date}T11:00:00`,
  isDeload: false,
  minutes: 45,
  ...p,
})

describe('skóre série', () => {
  it('cvik so záťažou sa porovnáva cez odhad 1RM', () => {
    const a = setScore('goblet_squat', { weightKg: 20, reps: 10, seconds: null })
    const b = setScore('goblet_squat', { weightKg: 24, reps: 8, seconds: null })
    expect(b).toBeGreaterThan(a)
  })
  it('zhyby sa porovnávajú cez opakovania, výdrže cez sekundy', () => {
    expect(setScore('pullup_prog', { weightKg: null, reps: 6, seconds: null })).toBe(6)
    expect(setScore('suitcase_carry', { weightKg: 24, reps: null, seconds: 40 })).toBe(40)
  })
  it('séria bez čísel má skóre 0', () => {
    expect(setScore('goblet_squat', { weightKg: null, reps: null, seconds: null })).toBe(0)
  })
  it('popis série', () => {
    expect(describeSet({ weightKg: 20, reps: 11, seconds: null })).toBe('20 kg × 11 op.')
    expect(describeSet({ weightKg: null, reps: 6, seconds: null })).toBe('6 op.')
    expect(describeSet({ weightKg: 24, reps: null, seconds: 40 })).toBe('24 kg – 40 s')
  })
})

describe('história tréningov', () => {
  const workouts = [workout(1, '2026-09-01'), workout(2, '2026-09-03'), workout(3, '2026-09-08')]
  const sets = [
    set(1, '2026-09-01', 'goblet_squat', { weightKg: 16, reps: 8, setIndex: 0 }),
    set(1, '2026-09-01', 'goblet_squat', { weightKg: 16, reps: 8, setIndex: 1 }),
    set(2, '2026-09-03', 'goblet_squat', { weightKg: 20, reps: 10, setIndex: 0, rpe: 9 }),
    set(3, '2026-09-08', 'goblet_squat', { weightKg: 20, reps: 8, setIndex: 0 }),
  ]

  it('vracia tréningy od najnovšieho', () => {
    const h = buildHistory(workouts, sets)
    expect(h.map((w) => w.date)).toEqual(['2026-09-08', '2026-09-03', '2026-09-01'])
  })

  it('prvý zápis cviku nie je rekord', () => {
    const h = buildHistory(workouts, sets)
    expect(h.at(-1)?.prs).toEqual([])
  })

  it('lepšia séria než doteraz je rekord, slabšia nie', () => {
    const h = buildHistory(workouts, sets)
    const [posledny, stredny] = h
    expect(stredny?.prs).toHaveLength(1)
    expect(stredny?.prs[0]?.detail).toBe('20 kg × 10 op.')
    expect(stredny?.prs[0]?.previous).toBeGreaterThan(0)
    expect(posledny?.prs).toEqual([])
  })

  it('počíta objem, priemerné RPE a najvyššiu bolesť', () => {
    const h = buildHistory([workout(9, '2026-09-10')], [
      set(9, '2026-09-10', 'goblet_squat', { weightKg: 20, reps: 10, rpe: 7 }),
      set(9, '2026-09-10', 'goblet_squat', { weightKg: 20, reps: 10, rpe: 9, pain: 2, setIndex: 1 }),
    ])
    expect(h[0]?.volumeKg).toBe(400)
    expect(h[0]?.avgRpe).toBe(8)
    expect(h[0]?.maxPain).toBe(2)
    expect(h[0]?.setCount).toBe(2)
  })

  it('neukončené tréningy a tréningy bez sérií sa preskočia', () => {
    const h = buildHistory(
      [workout(4, '2026-09-11', { finishedAt: undefined }), workout(5, '2026-09-12')],
      [set(4, '2026-09-11', 'goblet_squat', { weightKg: 24, reps: 12 })],
    )
    expect(h).toEqual([])
  })

  it('rekordy sa držia zvlášť pre každý cvik', () => {
    const h = buildHistory(workouts.slice(0, 2), [
      set(1, '2026-09-01', 'goblet_squat', { weightKg: 16, reps: 8 }),
      set(1, '2026-09-01', 'pullup_prog', { reps: 3 }),
      set(2, '2026-09-03', 'pullup_prog', { reps: 5 }),
    ])
    expect(h[0]?.prs).toHaveLength(1)
    expect(h[0]?.prs[0]?.exerciseId).toBe('pullup_prog')
  })
})

describe('osobné rekordy', () => {
  it('najlepšia séria každého cviku', () => {
    const best = personalBests([
      set(1, '2026-09-01', 'pullup_prog', { reps: 3 }),
      set(2, '2026-09-03', 'pullup_prog', { reps: 7 }),
      set(2, '2026-09-03', 'goblet_squat', { weightKg: 24, reps: 8 }),
    ])
    expect(best).toHaveLength(2)
    expect(best.find((b) => b.exerciseId === 'pullup_prog')?.detail).toBe('7 op.')
  })
  it('série bez čísel sa ignorujú', () => {
    expect(personalBests([set(1, '2026-09-01', 'goblet_squat')])).toEqual([])
  })
  it('počíta rekordy za posledné obdobie', () => {
    const h = buildHistory(
      [workout(1, '2026-07-01'), workout(2, '2026-07-08'), workout(3, '2026-09-10')],
      [
        set(1, '2026-07-01', 'pullup_prog', { reps: 3 }),
        set(2, '2026-07-08', 'pullup_prog', { reps: 5 }),
        set(3, '2026-09-10', 'pullup_prog', { reps: 8 }),
      ],
    )
    expect(recentPrCount(h, '2026-09-14', 28)).toBe(1)
    expect(recentPrCount(h, '2026-09-14', 365)).toBe(2)
  })
})

describe('recentPrCount cez hranicu mesiaca', () => {
  it('okno 28 dní sa počíta v lokálnych dátumoch, nie cez UTC', () => {
    const w = [workout(1, '2026-09-03'), workout(2, '2026-09-04')]
    const s = [set(1, '2026-09-03', 'goblet_squat', { weightKg: 16, reps: 8 }), set(2, '2026-09-04', 'goblet_squat', { weightKg: 16, reps: 9 })]
    const h = buildHistory(w, s)
    expect(recentPrCount(h, '2026-10-02', 28)).toBe(1) // 2026-09-04 je presne 28 dní pred 2026-10-02
    expect(recentPrCount(h, '2026-10-03', 28)).toBe(0)
  })
})
