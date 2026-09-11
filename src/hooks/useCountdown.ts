import { useCallback, useEffect, useRef, useState } from 'react'
import { signalEnd, signalTick } from '../lib/sound'

/**
 * Odpočet, ktorý počíta z reálneho času (nie z tickov), takže prežije uspatie obrazovky.
 * Posledné 3 sekundy pípne, na konci zvuk + vibrácia.
 */
export function useCountdown(onDone?: () => void) {
  const [endAt, setEndAt] = useState<number | null>(null)
  const [left, setLeft] = useState(0)
  const [total, setTotal] = useState(0)
  const doneRef = useRef(onDone)

  useEffect(() => {
    doneRef.current = onDone
  })

  useEffect(() => {
    if (endAt === null) return
    let lastWhole = Math.ceil((endAt - Date.now()) / 1000)
    const id = window.setInterval(() => {
      const ms = endAt - Date.now()
      const secs = Math.max(0, ms / 1000)
      setLeft(secs)
      const whole = Math.ceil(secs)
      if (whole !== lastWhole && whole > 0 && whole <= 3) signalTick()
      lastWhole = whole
      if (ms <= 0) {
        window.clearInterval(id)
        setEndAt(null)
        setLeft(0)
        signalEnd()
        doneRef.current?.()
      }
    }, 100)
    return () => window.clearInterval(id)
  }, [endAt])

  const start = useCallback((seconds: number) => {
    setTotal(seconds)
    setLeft(seconds)
    setEndAt(Date.now() + seconds * 1000)
  }, [])

  const stop = useCallback(() => {
    setEndAt(null)
    setLeft(0)
  }, [])

  const add = useCallback((seconds: number) => {
    setEndAt((e) => (e === null ? e : e + seconds * 1000))
    setTotal((t) => t + seconds)
  }, [])

  return { running: endAt !== null, left, total, start, stop, add }
}
