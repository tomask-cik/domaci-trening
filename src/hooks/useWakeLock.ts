import { useEffect } from 'react'

/**
 * Drží obrazovku zapnutú, kým je `active` (tréning, mobilitná rutina). Telefón leží na zemi
 * a bez toho by zhasol uprostred pauzy. Safari 16.4+ to v PWA podporuje; kde nie, nič sa nestane.
 * Po návrate z pozadia (visibilitychange) si zámok vypýta znova – systém ho pri skrytí uvoľní.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    const request = async () => {
      try {
        const l = await navigator.wakeLock.request('screen')
        if (cancelled) await l.release()
        else lock = l
      } catch {
        // zamietnuté (nízka batéria, nastavenie systému) – appka funguje ďalej
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void request()
    }
    void request()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      void lock?.release()
    }
  }, [active])
}
