import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart, ReferenceLine } from 'recharts'
import { Card, CardTitle, NumberField, Pill, Stat } from '../components/ui'
import { saveDay } from '../db/actions'
import { db } from '../db/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { addDays, todayISO, weekIndex, weekStart } from '../domain/dates'
import { getExercise, KEY_EXERCISE_IDS } from '../domain/exercises'
import { estimated1RM } from '../domain/progression'
import { stepGoalForWeek, weeklySteps } from '../domain/steps'
import type { Settings, SetLog } from '../domain/types'
import { movingAverage, phaseBoundaries, PHASE_NAMES, phaseFor, trendSeries } from '../domain/weight'
import { useDay, useDays } from '../hooks/useAppData'
import { kg, num, steps as fmtSteps } from '../lib/format'

const AXIS = { stroke: '#93a3c4', fontSize: 11 }
const GRID = '#2b3a5c'

export default function Body({ settings }: { settings: Settings }) {
  const today = todayISO()
  const days = useDays()
  const day = useDay(today)
  const sets = useLiveQuery(() => db.sets.toArray(), [])
  const [strengthId, setStrengthId] = useState<string>('goblet_squat')

  const points = useMemo(
    () => (days ?? []).filter((d): d is typeof d & { weightKg: number } => typeof d.weightKg === 'number').map((d) => ({ date: d.date, weightKg: d.weightKg })),
    [days],
  )

  if (!days || day === undefined || !sets) return <div className="text-muted">Načítavam…</div>

  const series = trendSeries(points).map((p) => ({ ...p, label: p.date.slice(5).replace('-', '.') }))
  const avg = movingAverage(points, today)
  const current = avg ?? points[points.length - 1]?.weightKg ?? settings.startWeightKg
  const phase = phaseFor(current, settings.startWeightKg, settings.targetWeightKg)
  const [b1, b2] = phaseBoundaries(settings.startWeightKg, settings.targetWeightKg)
  const lost = Math.round((settings.startWeightKg - current) * 10) / 10

  const thisWeek = weekStart(today)
  const stepGoal = stepGoalForWeek(weekIndex(today, settings.programStartDate), settings.stepsStart, settings.stepsGoal)
  const weeks = Array.from({ length: 8 }, (_, i) => addDays(thisWeek, -7 * (7 - i)))
  const stepWeeks = weeks.map((w) => {
    const summary = weeklySteps(days, w, stepGoal)
    return { label: w.slice(5).replace('-', '.'), priemer: summary.avgLogged ?? 0, dni: summary.daysLogged }
  })
  const weekSummary = weeklySteps(days, thisWeek, stepGoal)

  const strengthEx = getExercise(strengthId)
  const strengthSets = sets.filter((s: SetLog) => s.exerciseId === strengthId)
  const strengthSeries = buildStrengthSeries(strengthSets, strengthEx.kind)
  const pullupSeries = buildStrengthSeries(
    sets.filter((s: SetLog) => s.exerciseId === 'pullup_prog'),
    'stage',
  )

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Telo a progres</h1>
        <p className="text-sm text-muted">{PHASE_NAMES[phase]} · hranice fáz {kg(b1, 0)} a {kg(b2, 0)}</p>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Priemer 7 dní" value={avg !== null ? kg(avg) : '—'} />
        <Stat label="Schudnuté" value={kg(lost)} tone={lost > 0 ? 'good' : 'ink'} />
        <Stat label="Do cieľa" value={kg(Math.max(0, current - settings.targetWeightKg))} />
      </div>

      <Card>
        <CardTitle>Dnešný zápis</CardTitle>
        <div className="space-y-4">
          <NumberField label="Hmotnosť (kg)" value={day?.weightKg ?? null} onChange={(v) => void saveDay(today, { weightKg: v ?? undefined })} step={0.1} decimals={1} min={35} max={300} />
          <NumberField label="Kroky" value={day?.steps ?? null} onChange={(v) => void saveDay(today, { steps: v ?? undefined })} step={500} min={0} max={60000} />
        </div>
      </Card>

      <Card>
        <CardTitle right={<Pill>{points.length} vážení</Pill>}>Hmotnosť a trend</CardTitle>
        {series.length < 2 ? (
          <p className="text-sm text-muted">Zapíš aspoň dve váženia a objaví sa graf.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={AXIS} minTickGap={24} />
                <YAxis tick={AXIS} domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip
                  contentStyle={{ background: '#131c31', border: '1px solid #2b3a5c', borderRadius: 12, color: '#e8eefc' }}
                  formatter={(v: unknown, name: unknown) => [`${num(Number(v), 1)} kg`, name === 'kg' ? 'denne' : '7-dňový priemer'] as [string, string]}
                />
                <ReferenceLine y={settings.targetWeightKg} stroke="#34d399" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="kg" stroke="#93a3c4" dot={false} strokeWidth={1} />
                <Line type="monotone" dataKey="avg" stroke="#38bdf8" dot={false} strokeWidth={2.5} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="mt-2 text-xs text-muted">Modrá je 7-dňový priemer – podľa neho sa raz týždenne upravuje kalorický cieľ. Zelená čiara je cieľ.</p>
      </Card>

      <Card>
        <CardTitle right={<Pill tone={weekSummary.daysAtGoal >= 4 ? 'good' : 'muted'}>{weekSummary.daysAtGoal}/7 dní na cieli</Pill>}>Kroky po týždňoch</CardTitle>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stepWeeks} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={AXIS} />
              <YAxis tick={AXIS} />
              <Tooltip contentStyle={{ background: '#131c31', border: '1px solid #2b3a5c', borderRadius: 12, color: '#e8eefc' }} formatter={(v: unknown) => [fmtSteps(Number(v)), 'priemer/deň'] as [string, string]} />
              <ReferenceLine y={stepGoal} stroke="#34d399" strokeDasharray="4 4" />
              <Bar dataKey="priemer" fill="#38bdf8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-muted">Tento týždeň priemer {fmtSteps(weekSummary.avgLogged)} pri cieli {fmtSteps(stepGoal)}.</p>
      </Card>

      <Card>
        <CardTitle>Sila v kľúčových cvikoch</CardTitle>
        <select
          value={strengthId}
          onChange={(e) => setStrengthId(e.target.value)}
          aria-label="Cvik"
          className="tap mb-3 w-full rounded-xl border border-line bg-surface2 px-3 text-base"
        >
          {KEY_EXERCISE_IDS.map((id) => (
            <option key={id} value={id} className="bg-surface">
              {getExercise(id).name}
            </option>
          ))}
        </select>
        {strengthSeries.length < 2 ? (
          <p className="text-sm text-muted">Zapíš aspoň dva tréningy s týmto cvikom.</p>
        ) : (
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={strengthSeries} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={AXIS} minTickGap={20} />
                <YAxis tick={AXIS} />
                <Tooltip
                  contentStyle={{ background: '#131c31', border: '1px solid #2b3a5c', borderRadius: 12, color: '#e8eefc' }}
                  formatter={(v: unknown) => [num(Number(v), 1), strengthEx.kind === 'load' ? 'odhad 1RM (kg)' : 'najlepšia séria'] as [string, string]}
                />
                <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="mt-2 text-xs text-muted">
          {strengthEx.kind === 'load' ? 'Odhad 1RM (Epley) z najlepšej série tréningu – porovnáva rôzne kombinácie váhy a opakovaní.' : 'Najlepšia séria tréningu (opakovania alebo sekundy podľa štádia).'}
        </p>
      </Card>

      <Card>
        <CardTitle>Zhyby</CardTitle>
        {pullupSeries.length < 2 ? (
          <p className="text-sm text-muted">Zatiaľ málo dát.</p>
        ) : (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pullupSeries} margin={{ top: 5, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={AXIS} minTickGap={20} />
                <YAxis tick={AXIS} />
                <Tooltip contentStyle={{ background: '#131c31', border: '1px solid #2b3a5c', borderRadius: 12, color: '#e8eefc' }} formatter={(v: unknown) => [num(Number(v), 0), 'najlepšia séria'] as [string, string]} />
                <Line type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="mt-2 text-xs text-muted">
          Pri 105 kg je zhyb zdvíhanie 105 kg. Každý schudnutý kilogram je progres aj bez zmeny sily – preto tento graf čítaj spolu s hmotnosťou.
        </p>
      </Card>
    </div>
  )
}

function buildStrengthSeries(sets: SetLog[], kind: 'load' | 'stage' | 'timed'): { label: string; value: number }[] {
  const byDate = new Map<string, number>()
  for (const s of sets) {
    const value =
      kind === 'load' && s.weightKg !== null && s.reps !== null
        ? estimated1RM(s.weightKg, s.reps)
        : s.seconds !== null
          ? s.seconds
          : (s.reps ?? 0)
    const cur = byDate.get(s.date) ?? 0
    if (value > cur) byDate.set(s.date, value)
  }
  return [...byDate.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, value]) => ({ label: date.slice(5).replace('-', '.'), value }))
}
