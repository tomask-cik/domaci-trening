/**
 * Trvalé úložisko a stav zálohy.
 *
 * IndexedDB je pre prehliadač „najlepšia snaha“ – Safari vie úložisko webu vyhodiť
 * po ~7 dňoch nepoužívania. `navigator.storage.persist()` požiada prehliadač,
 * aby dáta nemazal. U nainštalovanej PWA to zvyčajne prejde bez pýtania.
 */

export async function requestPersistentStorage(): Promise<boolean> {
  if (!('storage' in navigator) || !navigator.storage.persist) return false
  try {
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export async function isStoragePersisted(): Promise<boolean> {
  if (!('storage' in navigator) || !navigator.storage.persisted) return false
  try {
    return await navigator.storage.persisted()
  } catch {
    return false
  }
}

export const BACKUP_WARN_DAYS = 14

/** Koľko dní od poslednej zálohy; null = ešte nikdy. */
export function daysSinceBackup(lastBackupAt: string | undefined, now: Date = new Date()): number | null {
  if (!lastBackupAt) return null
  const t = Date.parse(lastBackupAt)
  if (Number.isNaN(t)) return null
  return Math.floor((now.getTime() - t) / 86_400_000)
}

export function backupOverdue(lastBackupAt: string | undefined, now: Date = new Date()): boolean {
  const d = daysSinceBackup(lastBackupAt, now)
  return d === null || d >= BACKUP_WARN_DAYS
}

/** Prvé dni po nastavení niet čo zálohovať – pripomienka na Dnes až od tretieho dňa programu. */
export const BACKUP_FIRST_NAG_DAYS = 3

/**
 * Či má Dnes ukázať pripomienku zálohy: bez zálohy od 3. dňa programu, inak po 14 dňoch.
 * `programStartDate` a `today` sú ISO dátumy (YYYY-MM-DD).
 */
export function backupReminderDue(lastBackupAt: string | undefined, programStartDate: string, today: string, now: Date = new Date()): boolean {
  const d = daysSinceBackup(lastBackupAt, now)
  if (d !== null) return d >= BACKUP_WARN_DAYS
  const start = Date.parse(programStartDate)
  const t = Date.parse(today)
  if (Number.isNaN(start) || Number.isNaN(t)) return true
  return Math.floor((t - start) / 86_400_000) >= BACKUP_FIRST_NAG_DAYS
}
