import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyHealthImport,
  applyPendingReviews,
  deleteSet,
  finishWorkout,
  logSet,
  saveDay,
  saveSetup,
  startWorkout,
  syncDayKcal,
  addFood,
  deleteFood,
} from '../src/db/actions'
import { db } from '../src/db/db'
import type { Settings } from '../src/domain/types'

/**
 * Testy vrstvy nad Dexie – tu sa stretávajú čisté pravidlá s databázou a tu sa doteraz
 * nič netestovalo. Beží nad fake-indexeddb, každý test začína s prázdnou databázou.
 */

const TODAY = '2026-09-16' // streda

async function freshSettings(today = TODAY): Promise<Settings> {
  return saveSetup(
    {
      sex: 'm', age: 35, heightCm: 180, startWeightKg: 105, targetWeightKg: 85, bodyFatPct: null,
      kettlebells: [12, 16, 24], hasBand: true, hasMat: true, daysPerWeek: 3, minutesPerSession: 45, stepsStart: 6000,
    },
    today,
  )
}

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('saveDay', () => {
  it('dva súbežné zápisy do toho istého dňa sa nestratia', async () => {
    await saveDay(TODAY, { weightKg: 105 })
    // Bez transakcie by oba zápisy prečítali {105} a kroky by hmotnosť 103,9 prepísali späť na 105.
    await Promise.all([saveDay(TODAY, { weightKg: 103.9 }), saveDay(TODAY, { steps: 5000 })])
    expect(await db.days.get(TODAY)).toEqual({ date: TODAY, weightKg: 103.9, steps: 5000 })
  })
  it('patch nemení ostatné polia', async () => {
    await saveDay(TODAY, { weightKg: 104, sleepH: 7 })
    await saveDay(TODAY, { steps: 8000 })
    expect(await db.days.get(TODAY)).toEqual({ date: TODAY, weightKg: 104, sleepH: 7, steps: 8000 })
  })
})

describe('nastavenie', () => {
  it('uloží nastavenia, stavy cvikov a prvé váženie', async () => {
    const s = await freshSettings()
    expect(s.calorieTarget).toBe(2310)
    expect(s.cycleStartDate).toBe('2026-09-14') // pondelok
    expect((await db.days.get(TODAY))?.weightKg).toBe(105)
    const states = await db.exerciseStates.toArray()
    expect(states.find((x) => x.exerciseId === 'goblet_squat')?.weightKg).toBe(16)
    expect(states.some((x) => x.exerciseId === 'cat_camel')).toBe(false) // mobilita nemá stav
  })
})

describe('tréning', () => {
  it('startWorkout je idempotentný v rámci dňa', async () => {
    const s = await freshSettings()
    const a = await startWorkout(s, 'A', TODAY)
    const b = await startWorkout(s, 'B', TODAY)
    expect(b).toBe(a)
    expect(await db.workouts.count()).toBe(1)
    expect((await db.workouts.get(a))?.template).toBe('A')
  })
  it('logSet prepíše sériu s rovnakým indexom namiesto duplikátu', async () => {
    const s = await freshSettings()
    const wid = await startWorkout(s, 'A', TODAY)
    const base = { workoutId: wid, date: TODAY, exerciseId: 'goblet_squat', setIndex: 0, weightKg: 16, seconds: null, pain: null }
    const id1 = await logSet({ ...base, reps: 6, rpe: 8 })
    const id2 = await logSet({ ...base, reps: 7, rpe: 9 })
    expect(id2).toBe(id1)
    const sets = await db.sets.toArray()
    expect(sets).toHaveLength(1)
    expect(sets[0]?.reps).toBe(7)
    expect(sets[0]?.rpe).toBe(9)
  })
  it('deleteSet prečísluje zvyšné série, takže ďalší zápis nič neprepíše', async () => {
    const s = await freshSettings()
    const wid = await startWorkout(s, 'A', TODAY)
    const base = { workoutId: wid, date: TODAY, exerciseId: 'goblet_squat', weightKg: 16, seconds: null, rpe: 8, pain: null }
    await logSet({ ...base, setIndex: 0, reps: 6 })
    const mid = await logSet({ ...base, setIndex: 1, reps: 7 })
    await logSet({ ...base, setIndex: 2, reps: 8 })
    await logSet({ ...base, exerciseId: 'kb_rdl', setIndex: 0, reps: 10 }) // iný cvik ostane nedotknutý
    await deleteSet(mid)
    const squat = (await db.sets.where('workoutId').equals(wid).filter((x) => x.exerciseId === 'goblet_squat').toArray()).sort((a, b) => a.setIndex - b.setIndex)
    expect(squat.map((x) => [x.setIndex, x.reps])).toEqual([[0, 6], [1, 8]])
    await logSet({ ...base, setIndex: squat.length, reps: 9, note: 'posledná' })
    const after = await db.sets.where('workoutId').equals(wid).filter((x) => x.exerciseId === 'goblet_squat').toArray()
    expect(after.map((x) => x.reps).sort()).toEqual([6, 8, 9])
    expect(after.find((x) => x.reps === 9)?.note).toBe('posledná')
    expect((await db.sets.filter((x) => x.exerciseId === 'kb_rdl').toArray())[0]?.setIndex).toBe(0)
  })
  it('finishWorkout uloží finishedAt a prepočíta progresiu len pre cviky so sériami', async () => {
    const s = await freshSettings()
    const wid = await startWorkout(s, 'A', TODAY)
    for (let i = 0; i < 3; i++) {
      await logSet({ workoutId: wid, date: TODAY, exerciseId: 'goblet_squat', setIndex: i, weightKg: 16, reps: 6, seconds: null, rpe: 8, pain: null })
    }
    const results = await finishWorkout(wid, s, TODAY)
    expect(results.map((r) => r.exerciseId)).toEqual(['goblet_squat'])
    expect(results[0]?.change).toBe('up_reps')
    expect((await db.exerciseStates.get('goblet_squat'))?.targetReps).toBe(7)
    expect((await db.exerciseStates.get('kb_rdl'))?.targetReps).toBe(8) // bez sérií bez zmeny
    expect((await db.workouts.get(wid))?.finishedAt).toBeTruthy()
  })
  it('v deload týždni finishWorkout stav nemení', async () => {
    const s = await freshSettings()
    const deload = { ...s, manualDeloadWeeks: ['2026-09-14'] }
    await db.settings.put(deload)
    const wid = await startWorkout(deload, 'A', TODAY)
    expect((await db.workouts.get(wid))?.isDeload).toBe(true)
    await logSet({ workoutId: wid, date: TODAY, exerciseId: 'goblet_squat', setIndex: 0, weightKg: 16, reps: 15, seconds: null, rpe: 7, pain: null })
    const results = await finishWorkout(wid, deload, TODAY)
    expect(results[0]?.change).toBe('deload')
    expect((await db.exerciseStates.get('goblet_squat'))?.targetReps).toBe(6)
  })
})

describe('týždenné vyhodnotenie', () => {
  it('vyhodnotí každý uzavretý týždeň raz a reťazí zmenu cieľa', async () => {
    const s = await freshSettings('2026-08-31')
    // 3 týždne vážení bez chudnutia -> po 14 dňoch ide cieľ dole (max −150, nie pod podlahu 2 210).
    for (let i = 0; i < 21; i++) {
      const d = new Date('2026-08-31T00:00:00')
      d.setDate(d.getDate() + i)
      await saveDay(d.toISOString().slice(0, 10), { weightKg: 105 })
    }
    const n = await applyPendingReviews('2026-09-21')
    expect(n).toBe(3)
    const reviews = await db.weekReviews.orderBy('weekStart').toArray()
    expect(reviews.map((r) => r.weekStart)).toEqual(['2026-08-31', '2026-09-07', '2026-09-14'])
    expect(reviews[0]?.newTarget).toBe(2310) // prvých 14 dní bez zmeny
    expect(reviews[1]?.newTarget).toBe(2210) // −150 orezané na podlahu BMR × 1,1
    expect((await db.settings.get(1))?.calorieTarget).toBe(2210)
    // Druhé volanie už nič nepridá.
    expect(await applyPendingReviews('2026-09-21')).toBe(0)
    expect(s.calorieTarget).toBe(2310)
  })
})

describe('denník jedla', () => {
  it('súčet jedál sa premietne do dňa; po zmazaní posledného ostáva ručná hodnota', async () => {
    await saveDay(TODAY, { kcal: 1800 })
    await addFood({ date: TODAY, name: 'Banán', grams: 120, kcal: 107, proteinG: 1.3, source: 'ai' })
    expect((await db.days.get(TODAY))?.kcal).toBe(107)
    const id = (await db.foods.toArray())[0]?.id as number
    await deleteFood(id, TODAY)
    expect((await db.days.get(TODAY))?.kcal).toBe(107) // syncDayKcal bez jedál nič neprepíše
    await syncDayKcal(TODAY)
    expect((await db.days.get(TODAY))?.kcal).toBe(107)
  })
})

describe('import z Apple Health', () => {
  it('doplní tep a energiu k existujúcemu tréningu, neznámy tréning odmietne', async () => {
    const s = await freshSettings()
    const wid = await startWorkout(s, 'A', TODAY)
    expect(await applyHealthImport({ kind: 'workout', workoutId: wid, kcal: 380, avgHr: 132 })).toBe(true)
    const w = await db.workouts.get(wid)
    expect(w?.healthKcal).toBe(380)
    expect(w?.healthAvgHr).toBe(132)
    expect(await applyHealthImport({ kind: 'workout', workoutId: 999, kcal: 1, avgHr: null })).toBe(false)
  })
  it('kroky idú do dňa, aktivita do behov', async () => {
    await applyHealthImport({ kind: 'steps', date: TODAY, steps: 8432 })
    expect((await db.days.get(TODAY))?.steps).toBe(8432)
    await applyHealthImport({ kind: 'activity', type: 'walk', date: TODAY, meters: 3000, seconds: 2400, kcal: 150, avgHr: 105 })
    const runs = await db.runs.toArray()
    expect(runs).toHaveLength(1)
    expect(runs[0]?.type).toBe('walk')
    expect(runs[0]?.source).toBe('health')
  })
})
