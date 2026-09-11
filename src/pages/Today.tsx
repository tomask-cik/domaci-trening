import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Banner, Button, Card, CardTitle, NumberField, Pill, Stat } from '../components/ui'
import { saveDay, sessionFor, startWorkout } from '../db/actions'
import { BREAK_INTERVAL_MIN } from '../domain/constants'
import { dayOfWeekSk, formatSk, weekIndex } from '../domain/dates'
import { getExercise } from '../domain/exercises'
import { MICRO_BREAKS } from '../domain/mobility'
import { planForToday } from '../domain/plan'
import { estimateMinutes, TEMPLATE_NAMES } from '../domain/program'
import { proteinTarget } from '../domain/protein'
import { stepGoalForWeek } from '../domain/steps'
import type { Settings } from '../domain/types'
import { movingAverage, PHASE_NAMES, phaseFor } from '../domain/weight'
import { useDay, useDays, useThisWeek, useToday, useWeekReviews, useWorkouts } from '../hooks/useAppData'
import { kcal, kg, num, signed, steps as fmtSteps } from '../lib/format'

export default function Today({ settings }: { settings: Settings }) {
  const today = useToday()
  const week = useThisWeek()
  const navigate = useNavigate()
  const days = useDays()
  const day = useDay(today)
  const workouts = useWorkouts()
  const reviews = useWeekReviews()
  const [showBreaks, setShowBreaks] = useState(false)

  if (!days || !workouts || !reviews || day === undefined) return <div className="text-muted">Načítavam…</div>

  const points = days.filter((d): d is typeof d & { weightKg: number } => typeof d.weightKg === 'number').map((d) => ({ date: d.date, weightKg: d.weightKg }))
  const avg = movingAverage(points, today)
  const current = avg ?? points[points.length - 1]?.weightKg ?? settings.startWeightKg
  const phase = phaseFor(current, settings.startWeightKg, settings.targetWeightKg)
  const protein = proteinTarget({ targetWeightKg: settings.targetWeightKg, currentWeightKg: current, bodyFatPct: settings.bodyFatPct })
  const plan = planForToday(settings, workouts, today)
  const session = sessionFor(settings, plan.template, plan.isDeload)
  const stepGoal = stepGoalForWeek(weekIndex(today, settings.programStartDate), settings.stepsStart, settings.stepsGoal)
  const lastReview = reviews[reviews.length - 1]
  const toGo = Math.max(0, Math.round((current - settings.targetWeightKg) * 10) / 10)

  async function begin() {
    const id = await startWorkout(settings, plan.template, today)
    void navigate(`/trening?id=${id}`)
  }

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">{dayOfWeekSk(today)}, {formatSk(today)}</h1>
          <p className="text-sm text-muted">{PHASE_NAMES[phase]} · do cieľa {kg(toGo)}</p>
        </div>
        {plan.isDeload ? <Pill tone="warn">Deload</Pill> : <Pill tone="accent">{plan.doneThisWeek}/{settings.daysPerWeek} tréningy</Pill>}
      </header>

      {plan.isDeload ? <Banner tone="warn">Deload týždeň: o sériu menej, rovnaké váhy, RPE do 7, príjem na udržiavacej úrovni. Progresia sa tento týždeň nevyhodnocuje.</Banner> : null}

      <Card>
        <CardTitle right={<Pill>{plan.kind === 'rest' ? 'voľno' : `~${estimateMinutes(session)} min`}</Pill>}>Dnešný tréning</CardTitle>
        {plan.kind === 'done' ? (
          <p className="text-sm text-good">Hotovo. {plan.note}</p>
        ) : (
          <>
            <p className="text-lg font-semibold">{TEMPLATE_NAMES[plan.template]}</p>
            <p className="mt-1 text-sm text-muted">{plan.note}</p>
            <ul className="mt-3 space-y-1 text-sm text-muted">
              {session.map((it) => (
                <li key={`${it.exerciseId}-${it.order}`}>
                  • {getExercise(it.exerciseId).name} — {it.sets} {it.sets >= 5 ? 'sérií' : 'série'}
                </li>
              ))}
            </ul>
            <Button className="mt-4 w-full" onClick={begin} data-testid="start-workout">
              {plan.kind === 'continue' ? 'Pokračovať v tréningu' : plan.kind === 'rest' ? 'Aj tak trénovať' : `Začať tréning ${plan.template}`}
            </Button>
          </>
        )}
      </Card>

      <Card>
        <CardTitle right={avg !== null ? <Pill tone="accent">7-dňový priemer {kg(avg)}</Pill> : undefined}>Ranná hmotnosť</CardTitle>
        <NumberField
          label="Dnes (kg)"
          value={day?.weightKg ?? null}
          onChange={(v) => void saveDay(today, { weightKg: v ?? undefined })}
          step={0.1}
          decimals={1}
          min={35}
          max={300}
          testId="weight-today"
          suffix="Váž sa ráno po WC, pred jedlom. Denné výkyvy ±1 kg sú voda."
        />
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Kalorický cieľ" value={kcal(settings.calorieTarget)} sub={lastReview ? `${signed(lastReview.newTarget - lastReview.oldTarget, 0)} kcal po poslednom týždni` : 'prvý odhad'} />
        <Stat label="Bielkoviny" value={`${protein.gramsPerDay} g`} sub={`${protein.perMeal} g × 4 jedlá`} />
      </div>

      {lastReview ? (
        <Card>
          <CardTitle>Týždenné vyhodnotenie</CardTitle>
          <p className="text-sm text-muted">
            {lastReview.rateKgPerWeek === null ? 'Zatiaľ bez tempa.' : <>Tempo {signed(lastReview.rateKgPerWeek)} kg/týždeň. </>}
            {lastReview.reason}
          </p>
        </Card>
      ) : null}

      <Card>
        <CardTitle right={<Pill tone={(day?.steps ?? 0) >= stepGoal ? 'good' : 'muted'}>cieľ {fmtSteps(stepGoal)}</Pill>}>Kroky</CardTitle>
        <NumberField label="Dnes" value={day?.steps ?? null} onChange={(v) => void saveDay(today, { steps: v ?? undefined })} step={500} min={0} max={60000} testId="steps-today" />
      </Card>

      <Card>
        <CardTitle right={<Pill tone={day?.mobilityDone ? 'good' : 'muted'}>{day?.mobilityDone ? 'hotovo' : 'chýba'}</Pill>}>Mobilita a sedenie</CardTitle>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => void navigate('/mobilita')}>
            Spustiť rutinu
          </Button>
          <Button variant="ghost" className="flex-1" onClick={() => setShowBreaks((s) => !s)}>
            Mikropauzy
          </Button>
        </div>
        {showBreaks ? (
          <div className="mt-3 rounded-xl border border-line bg-surface2 p-3 text-sm">
            <p className="mb-2 text-muted">Každých {BREAK_INTERVAL_MIN} minút sedenia, 1–3 minúty:</p>
            <ul className="space-y-1">
              {MICRO_BREAKS.map((b) => (
                <li key={b}>• {b}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">Appka nemá pripomienky na pozadí – nastav si budík v telefóne.</p>
          </div>
        ) : null}
      </Card>

      <Card>
        <CardTitle>Doplnkové (voliteľné)</CardTitle>
        <div className="space-y-4">
          <NumberField label="Spánok (h)" value={day?.sleepH ?? null} onChange={(v) => void saveDay(today, { sleepH: v ?? undefined })} step={0.5} decimals={1} min={0} max={14} />
          <NumberField
            label="Kalórie dnes (ak počítaš)"
            value={day?.kcal ?? null}
            onChange={(v) => void saveDay(today, { kcal: v ?? undefined })}
            step={50}
            min={0}
            max={8000}
            suffix="Ak zapíšeš aspoň 4 dni v týždni, cieľ sa prepočíta presnejšie (z príjmu a zmeny hmotnosti)."
          />
        </div>
      </Card>

      <p className="text-center text-xs text-muted">
        Priemer za 7 dní: {avg !== null ? kg(avg) : 'treba aspoň 3 váženia'} · štart {kg(settings.startWeightKg)} · cieľ {kg(settings.targetWeightKg)} ·{' '}
        {points.length} {points.length === 1 ? 'záznam' : 'záznamov'} hmotnosti · týždeň {num(weekIndex(today, settings.programStartDate) + 1)} od štartu ({week})
      </p>
    </div>
  )
}
