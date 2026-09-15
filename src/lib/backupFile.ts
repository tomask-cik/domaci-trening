/**
 * Záloha na jedno klepnutie.
 *
 * Na iPhone ide súbor cez systémový share sheet (Web Share API s files) – z neho sa dá
 * uložiť rovno do iCloud Drive, poslať mailom alebo AirDropom. Kde share sheet so súbormi
 * nie je (starší Safari, desktop Chrome bez HTTPS), spadne to na obyčajné stiahnutie.
 */

import { backupFileName, exportAll } from '../db/backup'
import { db } from '../db/db'
import { updateSettings } from '../db/actions'
import { todayISO } from '../domain/dates'

export type BackupOutcome = 'shared' | 'downloaded' | 'cancelled'

function canShareFiles(file: File): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false
  try {
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })
  } catch {
    return false
  }
}

function download(file: File): void {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Vyexportuje dáta, ponúkne share sheet (alebo stiahne) a pri úspechu zapíše čas zálohy.
 * Zrušený share sheet sa ako záloha neráta – pripomienka ostáva.
 */
export async function runBackup(today = todayISO()): Promise<BackupOutcome> {
  const backup = await exportAll(db)
  const file = new File([JSON.stringify(backup, null, 2)], backupFileName(today), { type: 'application/json' })
  let outcome: BackupOutcome
  if (canShareFiles(file)) {
    try {
      await navigator.share({ files: [file], title: 'Záloha – Domáci tréning' })
      outcome = 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
      // Share zlyhal z iného dôvodu (napr. nepodporovaný typ) – radšej stiahnuť než nič.
      download(file)
      outcome = 'downloaded'
    }
  } else {
    download(file)
    outcome = 'downloaded'
  }
  await updateSettings({ lastBackupAt: new Date().toISOString() })
  return outcome
}

export const BACKUP_MESSAGE: Record<BackupOutcome, string> = {
  shared: 'Záloha odovzdaná – ulož ju do iCloud Drive alebo pošli mailom.',
  downloaded: 'Záloha stiahnutá. Ulož si ju do iCloud Drive alebo Google Drive – v Stiahnutých je len v tomto telefóne.',
  cancelled: 'Záloha zrušená – nič sa neuložilo.',
}
