/** Zvuk a vibrácia pre časovač – bez externých súborov, funguje offline (DECISIONS C8). */

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  ctx ??= new Ctor()
  return ctx
}

/** Odomkne zvuk po prvom dotyku (iOS to vyžaduje). */
export function primeAudio(): void {
  const a = audio()
  if (a && a.state === 'suspended') void a.resume()
}

export function beep(times = 1, freq = 880, durMs = 160): void {
  const a = audio()
  if (!a) return
  if (a.state === 'suspended') void a.resume()
  for (let i = 0; i < times; i++) {
    const start = a.currentTime + (i * (durMs + 90)) / 1000
    const osc = a.createOscillator()
    const gain = a.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + durMs / 1000)
    osc.connect(gain).connect(a.destination)
    osc.start(start)
    osc.stop(start + durMs / 1000 + 0.05)
  }
}

export function vibrate(pattern: number | number[] = [200, 100, 200]): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(pattern)
}

/** Koniec pauzy / výdrže: zvuk aj vibrácia (iOS vibrácie nepodporuje, zvuk zostáva). */
export function signalEnd(): void {
  beep(2)
  vibrate([300, 120, 300])
}

export function signalTick(): void {
  beep(1, 660, 90)
  vibrate(80)
}
