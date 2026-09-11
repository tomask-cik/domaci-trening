import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { TrainingDB } from '../src/db/db'
import { exportAll, importAll, validateBackup } from '../src/db/backup'

describe('export / import', () => {
  it('round-trip zachová všetky tabuľky', async () => {
    const a = new TrainingDB('test-a')
    await a.days.put({ date: '2026-09-07', weightKg: 105, steps: 6500 })
    await a.exerciseStates.put({ exerciseId: 'goblet_squat', weightKg: 16, targetReps: 8, variant: 0, stage: 0, target: null, topStreak: 0, failStreak: 0, updatedAt: '2026-09-07', lastChange: null })
    const wid = await a.workouts.add({ date: '2026-09-07', template: 'A', startedAt: 'x', isDeload: false, minutes: 45 })
    await a.sets.add({ workoutId: wid as number, date: '2026-09-07', exerciseId: 'goblet_squat', setIndex: 0, weightKg: 16, reps: 8, seconds: null, rpe: 8, pain: null })
    const backup = await exportAll(a, new Date('2026-09-08T10:00:00Z'))
    expect(backup.version).toBe(1)
    expect(backup.tables.days).toHaveLength(1)
    expect(backup.tables.sets).toHaveLength(1)

    const b = new TrainingDB('test-b')
    await b.days.put({ date: '2000-01-01', weightKg: 1 })
    const res = await importAll(b, JSON.parse(JSON.stringify(backup)))
    expect(res.counts.days).toBe(1)
    expect(await b.days.get('2000-01-01')).toBeUndefined()
    expect((await b.days.get('2026-09-07'))?.weightKg).toBe(105)
    expect((await b.sets.toArray())[0]?.reps).toBe(8)
  })
  it('odmietne cudzí súbor', () => {
    expect(validateBackup({ foo: 1 }).ok).toBe(false)
    expect(validateBackup({ app: 'domaci-trening', version: 99, tables: {} }).ok).toBe(false)
    expect(validateBackup({ app: 'domaci-trening', version: 1, tables: { days: 'x' } }).ok).toBe(false)
    expect(validateBackup({ app: 'domaci-trening', version: 1, tables: {} }).ok).toBe(true)
  })
})
