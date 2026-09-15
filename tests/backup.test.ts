import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { TrainingDB } from '../src/db/db'
import { BACKUP_VERSION, backupFileName, exportAll, importAll, stripSecrets, validateBackup } from '../src/db/backup'

describe('export / import', () => {
  it('round-trip zachová všetky tabuľky', async () => {
    const a = new TrainingDB('test-a')
    await a.days.put({ date: '2026-09-07', weightKg: 105, steps: 6500 })
    await a.exerciseStates.put({ exerciseId: 'goblet_squat', weightKg: 16, targetReps: 8, variant: 0, stage: 0, target: null, topStreak: 0, failStreak: 0, updatedAt: '2026-09-07', lastChange: null })
    const wid = await a.workouts.add({ date: '2026-09-07', template: 'A', startedAt: 'x', isDeload: false, minutes: 45 })
    await a.sets.add({ workoutId: wid as number, date: '2026-09-07', exerciseId: 'goblet_squat', setIndex: 0, weightKg: 16, reps: 8, seconds: null, rpe: 8, pain: null })
    await a.foods.add({ date: '2026-09-07', name: 'Banán', grams: 120, kcal: 107, proteinG: 1.3, source: 'ai' })
    const backup = await exportAll(a, new Date('2026-09-08T10:00:00Z'))
    expect(backup.version).toBe(BACKUP_VERSION)
    expect(backup.tables.days).toHaveLength(1)
    expect(backup.tables.sets).toHaveLength(1)

    const b = new TrainingDB('test-b')
    await b.days.put({ date: '2000-01-01', weightKg: 1 })
    const res = await importAll(b, JSON.parse(JSON.stringify(backup)))
    expect(res.counts.days).toBe(1)
    expect(await b.days.get('2000-01-01')).toBeUndefined()
    expect((await b.days.get('2026-09-07'))?.weightKg).toBe(105)
    expect((await b.sets.toArray())[0]?.reps).toBe(8)
    expect((await b.foods.toArray())[0]?.name).toBe('Banán')
  })
  it('staršia záloha bez denníka jedla sa dá importovať', async () => {
    const c = new TrainingDB('test-c')
    const res = await importAll(c, { app: 'domaci-trening', version: 1, exportedAt: 'x', tables: { days: [{ date: '2026-01-01', weightKg: 100 }] } })
    expect(res.counts.days).toBe(1)
    expect(await c.foods.count()).toBe(0)
  })
  it('API kľúč sa do zálohy nedostane, ostatné nastavenia áno', async () => {
    const d = new TrainingDB('test-d')
    await d.settings.put({ id: 1, calorieTarget: 2310, anthropicApiKey: 'sk-ant-tajny-kluc-1234567890', kettlebells: [12] } as never)
    const backup = await exportAll(d)
    const row = backup.tables.settings?.[0] as Record<string, unknown>
    expect(row.calorieTarget).toBe(2310)
    expect(row.anthropicApiKey).toBeUndefined()
    expect(JSON.stringify(backup)).not.toContain('sk-ant')
    // V databáze kľúč ostáva – export ho nemaže.
    expect((await d.settings.get(1))?.anthropicApiKey).toBe('sk-ant-tajny-kluc-1234567890')
  })
  it('stripSecrets nemení vstup a odstráni len tajomstvá', () => {
    const row = { id: 1, anthropicApiKey: 'x', calorieTarget: 2000 }
    expect(stripSecrets(row)).toEqual({ id: 1, calorieTarget: 2000 })
    expect(row.anthropicApiKey).toBe('x')
  })
  it('názov súboru má dátum', () => {
    expect(backupFileName('2026-09-15')).toBe('domaci-trening-2026-09-15.json')
  })
  it('odmietne cudzí súbor', () => {
    expect(validateBackup({ foo: 1 }).ok).toBe(false)
    expect(validateBackup({ app: 'domaci-trening', version: 99, tables: {} }).ok).toBe(false)
    expect(validateBackup({ app: 'domaci-trening', version: 1, tables: { days: 'x' } }).ok).toBe(false)
    expect(validateBackup({ app: 'domaci-trening', version: 1, tables: {} }).ok).toBe(true)
  })
})
