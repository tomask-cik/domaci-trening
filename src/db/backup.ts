import { TABLE_NAMES, type TrainingDB } from './db'

export const BACKUP_VERSION = 3

export interface Backup {
  app: 'domaci-trening'
  version: number
  exportedAt: string
  tables: Record<string, unknown[]>
}

export async function exportAll(database: TrainingDB, now: Date = new Date()): Promise<Backup> {
  const tables: Record<string, unknown[]> = {}
  for (const name of TABLE_NAMES) {
    tables[name] = await database.table(name).toArray()
  }
  return { app: 'domaci-trening', version: BACKUP_VERSION, exportedAt: now.toISOString(), tables }
}

export function validateBackup(input: unknown): { ok: true; backup: Backup } | { ok: false; error: string } {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Súbor nie je JSON objekt.' }
  const b = input as Partial<Backup>
  if (b.app !== 'domaci-trening') return { ok: false, error: 'Súbor nie je záloha tejto appky.' }
  if (typeof b.version !== 'number' || b.version > BACKUP_VERSION) return { ok: false, error: `Nepodporovaná verzia zálohy (${String(b.version)}).` }
  if (!b.tables || typeof b.tables !== 'object') return { ok: false, error: 'Záloha neobsahuje tabuľky.' }
  for (const name of TABLE_NAMES) {
    const rows = (b.tables as Record<string, unknown>)[name]
    if (rows !== undefined && !Array.isArray(rows)) return { ok: false, error: `Tabuľka ${name} nie je pole.` }
  }
  return { ok: true, backup: b as Backup }
}

/** Nahradí všetky dáta obsahom zálohy (v jednej transakcii). */
export async function importAll(database: TrainingDB, input: unknown): Promise<{ counts: Record<string, number> }> {
  const v = validateBackup(input)
  if (!v.ok) throw new Error(v.error)
  const counts: Record<string, number> = {}
  const tables = TABLE_NAMES.map((n) => database.table(n))
  await database.transaction('rw', tables, async () => {
    for (const name of TABLE_NAMES) {
      const t = database.table(name)
      await t.clear()
      const rows = (v.backup.tables[name] ?? []) as object[]
      if (rows.length) await t.bulkPut(rows)
      counts[name] = rows.length
    }
  })
  return { counts }
}
