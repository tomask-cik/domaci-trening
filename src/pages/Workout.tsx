import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { TimerBar } from '../components/Timer'
import { WatchCard } from '../components/WatchCard'
import { useCountdown } from '../hooks/useCountdown'
import { useWakeLock } from '../hooks/useWakeLock'
import { Banner, Button, Card, CardTitle, Pill } from '../components/ui'
import { db } from '../db/db'
import { deleteSet, discardWorkout, finishWorkout, logSet, type ProgressionResult } from '../db/actions'
import { formatSk, todayISO } from '../domain/dates'
import { getExercise } from '../domain/exercises'
import { describeSet } from '../domain/history'
import { buildSession, TEMPLATE_NAMES, WARMUP } from '../domain/program'
import { nextHeavier, nextLighter, recommend } from '../domain/progression'
import type { ExerciseState, Settings, SetLog } from '../domain/types'

const RPE_OPTIONS = [6, 7, 8, 9, 10]

export default function Workout({ settings }: { settings: Settings }) {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const workoutId = Number(params.get('id') ?? 0)
  const today = todayISO()
  const timer = useCountdown()
  const [results, setResults] = useState<ProgressionResult[] | null>(null)
  const [finishing, setFinishing] = useState(false)

  const workout = useLiveQuery(async () => (workoutId ? ((await db.workouts.get(workoutId)) ?? null) : null), [workoutId])
  const sets = useLiveQuery(async () => (workoutId ? db.sets.where('workoutId').equals(workoutId).toArray() : []), [workoutId])
  const states = useLiveQuery(() => db.exerciseStates.toArray(), [])

  const stateMap = useMemo(() => new Map((states ?? []).map((s: ExerciseState) => [s.exerciseId, s])), [states])

  // Obrazovka nezhasne, kým tréning beží (telefón na zemi, pauzy 60–90 s).
  useWakeLock(Boolean(workout) && !workout?.finishedAt && !results)

  useEffect(() => {
    if (workoutId && workout === null) void navigate('/dnes', { replace: true })
  }, [workoutId, workout, navigate])

  if (!workoutId) return <Redirect />
  if (!workout || !sets || !states) return <div className="text-muted">Načítavam…</div>

  const session = buildSession(workout.template, workout.minutes, workout.isDeload)
  const setsByExercise = new Map<string, SetLog[]>()
  for (const s of sets) setsByExercise.set(s.exerciseId, [...(setsByExercise.get(s.exerciseId) ?? []), s])
  const totalPlanned = session.reduce((n, it) => n + it.sets, 0)
  const totalDone = sets.length

  async function finish() {
    setFinishing(true)
    const r = await finishWorkout(workoutId, settings, today)
    setResults(r)
    timer.stop()
    setFinishing(false)
  }

  async function discard() {
    if (!confirm('Zahodiť tento tréning aj so zapísanými sériami?')) return
    await discardWorkout(workoutId)
    navigate('/dnes', { replace: true })
  }

  if (results) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Tréning hotový</h1>
        <Banner tone="good">
          Zapísaných {totalDone} {totalDone === 1 ? 'séria' : totalDone < 5 ? 'série' : 'sérií'}. Návrh na ďalší tréning je uložený.
        </Banner>
        {workout.isDeload ? <Banner tone="warn">Deload týždeň – progresia sa zámerne nevyhodnocuje (PROGRAM.md 5).</Banner> : null}
        <Card>
          <CardTitle>Návrh progresie</CardTitle>
          <ul className="space-y-3" data-testid="progression-list">
            {results.map((r) => (
              <li key={r.exerciseId} className="rounded-xl border border-line bg-surface2 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{r.name}</span>
                  <Pill tone={r.change.startsWith('up') || r.change === 'stage_up' ? 'good' : r.change === 'down' || r.change === 'stage_down' ? 'warn' : 'muted'}>
                    {labelFor(r.change)}
                  </Pill>
                </div>
                <p className="mt-1 text-sm text-muted">{r.message}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>Hodinky</CardTitle>
          <WatchCard workout={workout} settings={settings} />
        </Card>
        <Button className="w-full" onClick={() => navigate('/dnes')} data-testid="back-home">
          Späť na dnešok
        </Button>
      </div>
    )
  }

  // Ukončený tréning otvorený znova (napr. zo starej záložky): progresia už bola vyhodnotená,
  // ďalšie série by sa do nej nedostali – preto len na čítanie.
  if (workout.finishedAt) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">{TEMPLATE_NAMES[workout.template]}</h1>
        <Banner tone="info">Tento tréning ({formatSk(workout.date)}) je už ukončený a vyhodnotený. Zapísané série nájdeš v Histórii.</Banner>
        <Card>
          <CardTitle right={<Pill>{totalDone} sérií</Pill>}>Zapísané série</CardTitle>
          <ul className="space-y-1 text-sm">
            {session.map((item) => {
              const logged = (setsByExercise.get(item.exerciseId) ?? []).sort((a, b) => a.setIndex - b.setIndex)
              if (!logged.length) return null
              return (
                <li key={`${item.exerciseId}-${item.order}`} className="flex justify-between gap-2 rounded-lg bg-surface2 px-3 py-2">
                  <span>{getExercise(item.exerciseId).name}</span>
                  <span className="text-muted">{logged.map(describeSet).join(', ')}</span>
                </li>
              )
            })}
          </ul>
        </Card>
        <Button className="w-full" onClick={() => navigate('/dnes')} data-testid="back-home">
          Späť na dnešok
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{TEMPLATE_NAMES[workout.template]}</h1>
          <p className="text-sm text-muted">
            {totalDone}/{totalPlanned} sérií {workout.isDeload ? '· deload' : ''}
          </p>
        </div>
        <Button variant="ghost" onClick={discard} className="px-3">
          Zahodiť
        </Button>
      </header>

      <details className="card p-4">
        <summary className="cursor-pointer text-base font-semibold">Rozcvička (5 min)</summary>
        <ul className="mt-2 space-y-1 text-sm text-muted">
          {WARMUP.map((w) => (
            <li key={w}>• {w}</li>
          ))}
        </ul>
      </details>

      {session.map((item) => {
        const ex = getExercise(item.exerciseId)
        const state = stateMap.get(ex.id)
        if (!state) return null
        const rec = recommend(ex, state, workout.isDeload)
        const logged = (setsByExercise.get(ex.id) ?? []).sort((a, b) => a.setIndex - b.setIndex)
        return (
          <ExerciseCard
            key={`${ex.id}-${item.order}`}
            exerciseName={ex.name}
            label={item.label}
            rec={rec}
            sets={item.sets}
            logged={logged}
            perSide={ex.perSide}
            kettlebells={settings.kettlebells}
            onLog={async (setIndex, values) => {
              await logSet({
                workoutId,
                date: today,
                exerciseId: ex.id,
                setIndex,
                weightKg: values.weightKg,
                reps: values.reps,
                seconds: values.seconds,
                rpe: values.rpe,
                pain: values.pain,
                note: values.note || undefined,
              })
              timer.start(item.restSec)
            }}
            onDelete={async (s) => {
              if (!confirm(`Zmazať sériu ${s.setIndex + 1} (${describeSet(s)})?`)) return
              await deleteSet(s.id as number)
            }}
          />
        )
      })}

      <Button className="w-full" onClick={finish} disabled={totalDone === 0 || finishing} data-testid="finish-workout">
        {finishing ? 'Počítam progresiu…' : 'Ukončiť tréning a vyhodnotiť'}
      </Button>
      {totalDone === 0 ? <p className="text-center text-xs text-muted">Zapíš aspoň jednu sériu.</p> : null}

      <TimerBar label="Pauza" left={timer.left} total={timer.total} running={timer.running} onStop={timer.stop} onAdd={timer.add} />
    </div>
  )
}

function Redirect() {
  const navigate = useNavigate()
  useEffect(() => {
    void navigate('/dnes', { replace: true })
  }, [navigate])
  return null
}

function labelFor(change: ProgressionResult['change']): string {
  switch (change) {
    case 'up_reps':
      return '+1 opakovanie'
    case 'up_time':
      return '+5 s'
    case 'up_weight':
      return 'ťažšia váha'
    case 'up_variant':
      return 'ťažší variant'
    case 'stage_up':
      return 'ďalšie štádium'
    case 'down':
      return 'ľahšie'
    case 'stage_down':
      return 'späť o štádium'
    case 'deload':
      return 'deload'
    default:
      return 'drž'
  }
}

interface LogValues {
  weightKg: number | null
  reps: number | null
  seconds: number | null
  rpe: number
  pain: number | null
  note: string
}

/**
 * Pole s −/+ po bokoch: počas tréningu je klávesnica najhoršia možnosť (spotené ruky,
 * jedna ruka, telefón na zemi). Písať sa dá stále, ale bežná zmena je jedno klepnutie.
 */
function Stepper({
  label,
  value,
  onChange,
  onDec,
  onInc,
  testId,
  inputMode,
}: {
  label: string
  value: number | null
  onChange: (v: number | null) => void
  onDec: () => void
  onInc: () => void
  testId: string
  inputMode: 'decimal' | 'numeric'
}) {
  const btn = 'tap w-11 shrink-0 rounded-xl border border-line bg-bg text-xl active:bg-line'
  return (
    <label className="min-w-0 flex-1">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      <div className="flex items-stretch gap-1">
        <button type="button" aria-label={`${label} menej`} className={btn} onClick={onDec}>
          −
        </button>
        <input
          data-testid={testId}
          type="number"
          inputMode={inputMode}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          className="tap w-full min-w-0 rounded-xl border border-line bg-bg px-1 text-center text-lg"
        />
        <button type="button" aria-label={`${label} viac`} className={btn} onClick={onInc}>
          +
        </button>
      </div>
    </label>
  )
}

function ExerciseCard({
  exerciseName,
  label,
  rec,
  sets,
  logged,
  perSide,
  kettlebells,
  onLog,
  onDelete,
}: {
  exerciseName: string
  label?: string
  rec: ReturnType<typeof recommend>
  sets: number
  logged: SetLog[]
  perSide: boolean
  kettlebells: number[]
  onLog: (setIndex: number, values: LogValues) => Promise<void>
  onDelete: (s: SetLog) => Promise<void>
}) {
  const doneCount = logged.length
  const nextIndex = doneCount
  const [weight, setWeight] = useState<number | null>(rec.weightKg)
  const [amount, setAmount] = useState<number | null>(rec.unit === 'sec' ? rec.targetSeconds : rec.targetReps)
  const [rpe, setRpe] = useState(8)
  const [pain, setPain] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const complete = doneCount >= sets
  const amountStep = rec.unit === 'sec' ? 5 : 1

  // Váha skáče po kettlebelloch, ktoré naozaj máš – medzi 16 a 24 nič iné neexistuje.
  const stepWeight = (dir: -1 | 1) => {
    const cur = weight ?? rec.weightKg ?? 0
    const next = dir > 0 ? nextHeavier(kettlebells, cur) : nextLighter(kettlebells, cur)
    if (next !== null) setWeight(next)
  }
  const stepAmount = (dir: -1 | 1) => setAmount(Math.max(0, (amount ?? 0) + dir * amountStep))

  return (
    <Card>
      <CardTitle right={<Pill tone={complete ? 'good' : 'muted'}>{doneCount}/{sets}</Pill>}>{exerciseName}</CardTitle>
      <p className="text-lg font-semibold text-accent" data-testid={`rec-${exerciseName}`}>
        {rec.title}
      </p>
      {rec.detail ? <p className="mt-1 text-sm text-muted">{rec.detail}</p> : null}
      {label ? <p className="mt-1 text-sm text-warn">{label}</p> : null}
      {perSide ? <p className="mt-1 text-xs text-muted">Zapíš horšiu stranu.</p> : null}

      {logged.length ? (
        <ul className="mt-3 space-y-1 text-sm">
          {logged.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface2 py-1 pl-3 pr-1">
              <span className="min-w-0">
                <span className="block">
                  Séria {s.setIndex + 1}: {s.weightKg !== null ? `${s.weightKg} kg × ` : ''}
                  {s.seconds !== null ? `${s.seconds} s` : `${s.reps ?? 0} op.`}
                </span>
                {s.note ? <span className="block text-xs text-muted">✎ {s.note}</span> : null}
              </span>
              <span className="flex shrink-0 items-center gap-2 text-muted">
                <span>
                  RPE {s.rpe}
                  {s.pain ? ` · bolesť ${s.pain}` : ''}
                </span>
                <button
                  type="button"
                  aria-label={`Zmazať sériu ${s.setIndex + 1}`}
                  onClick={() => void onDelete(s)}
                  className="tap w-10 rounded-lg border border-line text-muted active:bg-line"
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {!complete ? (
        <div className="mt-4 space-y-3 rounded-xl border border-line bg-surface2 p-3">
          <div className="flex gap-2">
            {rec.weightKg !== null ? (
              <Stepper label="Váha (kg)" value={weight} onChange={setWeight} onDec={() => stepWeight(-1)} onInc={() => stepWeight(1)} testId="set-weight" inputMode="decimal" />
            ) : null}
            <Stepper
              label={rec.unit === 'sec' ? 'Sekundy' : 'Opakovania'}
              value={amount}
              onChange={setAmount}
              onDec={() => stepAmount(-1)}
              onInc={() => stepAmount(1)}
              testId="set-amount"
              inputMode="numeric"
            />
          </div>
          <div>
            <span className="mb-1 block text-xs text-muted">RPE (10 = zlyhanie; cieľ 7–9)</span>
            <div className="flex gap-1.5">
              {RPE_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  data-testid={`rpe-${r}`}
                  onClick={() => setRpe(r)}
                  className={`tap flex-1 rounded-xl border text-base ${rpe === r ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-bg text-muted'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <details>
            <summary className="cursor-pointer text-xs text-muted">Bolesť a poznámka (voliteľné)</summary>
            <div className="mt-2 flex gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPain(p === 0 ? null : p)}
                  className={`tap flex-1 rounded-xl border text-sm ${(pain ?? 0) === p ? 'border-warn bg-warn/15 text-warn' : 'border-line bg-bg text-muted'}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">Nad 3/10 appka automaticky ustúpi o krok.</p>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Poznámka k sérii, napr. ľavá strana slabšia"
              aria-label="Poznámka k sérii"
              data-testid="set-note"
              className="tap mt-2 w-full rounded-xl border border-line bg-bg px-3 text-sm"
            />
          </details>
          <Button
            className="w-full"
            data-testid="log-set"
            onClick={() => {
              void onLog(nextIndex, {
                weightKg: rec.weightKg !== null ? weight : null,
                reps: rec.unit === 'reps' ? amount : null,
                seconds: rec.unit === 'sec' ? amount : null,
                rpe,
                pain,
                note: note.trim(),
              })
              setNote('')
            }}
          >
            Zapísať sériu {nextIndex + 1}
          </Button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-good">Hotovo ✓</p>
      )}
    </Card>
  )
}
