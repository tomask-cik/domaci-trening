import { useEffect, useMemo, useState } from 'react'
import { Button, Card, CardTitle, Pill } from '../components/ui'
import { useCountdown } from '../hooks/useCountdown'
import { useWakeLock } from '../hooks/useWakeLock'
import { saveDay } from '../db/actions'
import { todayISO } from '../domain/dates'
import { expandRoutine, MOBILITY_ROUTINE, routineTotalSeconds } from '../domain/mobility'
import { useDay } from '../hooks/useAppData'
import { mmss } from '../lib/format'

export default function Mobility() {
  const today = todayISO()
  const day = useDay(today)
  const steps = useMemo(() => expandRoutine(), [])
  const [index, setIndex] = useState<number | null>(null)
  const timer = useCountdown(() => setIndex((i) => (i === null ? null : i + 1)))

  const current = index === null ? null : (steps[index] ?? null)
  const finished = index !== null && index >= steps.length
  useWakeLock(current !== null)

  useEffect(() => {
    if (current) timer.start(current.seconds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  useEffect(() => {
    if (finished) void saveDay(today, { mobilityDone: true })
  }, [finished, today])

  if (index === null) {
    return (
      <div className="space-y-4">
        <header>
          <h1 className="text-2xl font-bold">Mobilita</h1>
          <p className="text-sm text-muted">
            {MOBILITY_ROUTINE.length} cvikov, {mmss(routineTotalSeconds())} min. Denne, aj v deň voľna.
          </p>
        </header>
        {day?.mobilityDone ? <Pill tone="good">Dnes už hotovo</Pill> : null}
        <Card>
          <CardTitle>Čo ťa čaká</CardTitle>
          <ol className="space-y-2 text-sm">
            {MOBILITY_ROUTINE.map((it, i) => (
              <li key={it.id} className="flex gap-2">
                <span className="text-muted">{i + 1}.</span>
                <span>
                  <b>{it.title}</b>
                  {it.perSide ? ' (obe strany)' : ''}
                  <br />
                  <span className="text-muted">{it.cue}</span>
                </span>
              </li>
            ))}
          </ol>
        </Card>
        <Button className="w-full" onClick={() => setIndex(0)} data-testid="start-mobility">
          Spustiť sprievodcu
        </Button>
        <p className="pb-2 text-center text-xs text-muted">
          Posledné tri cviky sú McGill Big 3 – výdrž trupu, nie „naprávanie“ chrbtice. Pri bolesti cvik vynechaj.
        </p>
      </div>
    )
  }

  if (finished || !current) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Hotovo 🎉</h1>
        <p className="text-muted">Rutina zapísaná na dnešok.</p>
        <Button className="w-full" onClick={() => setIndex(null)} data-testid="mobility-done">
          Späť
        </Button>
      </div>
    )
  }

  const pct = timer.total > 0 ? Math.max(0, Math.min(100, (timer.left / timer.total) * 100)) : 0
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          Krok {index + 1} z {steps.length}
        </span>
        <button type="button" className="underline" onClick={() => { timer.stop(); setIndex(null) }}>
          Ukončiť
        </button>
      </div>
      <Card className="text-center">
        <h2 className="text-2xl font-bold">{current.title}</h2>
        <p className="mt-2 text-sm text-muted">{current.detail}</p>
        <div className="my-6 font-mono text-6xl font-bold text-accent" data-testid="mobility-timer">
          {mmss(timer.left)}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface2">
          <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${pct}%` }} />
        </div>
      </Card>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setIndex((i) => Math.max(0, (i ?? 0) - 1))}>
          Späť
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => timer.add(15)}>
          +15 s
        </Button>
        <Button className="flex-1" onClick={() => setIndex((i) => (i ?? 0) + 1)} data-testid="mobility-next">
          Ďalej
        </Button>
      </div>
    </div>
  )
}
