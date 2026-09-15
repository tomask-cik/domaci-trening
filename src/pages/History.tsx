import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Card, CardTitle, Pill, Stat } from '../components/ui'
import { db } from '../db/db'
import { actualWeeklyVolume, adherence, plannedWeeklyVolume, volumeLines } from '../domain/analytics'
import { buildHistory, personalBests, recentPrCount, type WorkoutSummary } from '../domain/history'
import { addDays, dayOfWeekSk, formatSk, todayISO, weekStart } from '../domain/dates'
import { MUSCLE_GROUP_LABEL } from '../domain/exercises'
import { TEMPLATE_NAMES } from '../domain/program'
import { num } from '../lib/format'
import { buildWeekContext, WEEK_SYSTEM } from '../domain/summary'
import { proteinFor } from '../domain/protein'
import { AiSummary } from '../components/AiSummary'
import type { DayLog, FoodEntry, RunLog, Settings, SetLog, Workout } from '../domain/types'

const PAGE = 15

export default function History({ settings }: { settings: Settings }) {
  const workouts = useLiveQuery(() => db.workouts.toArray(), [])
  const sets = useLiveQuery(() => db.sets.toArray(), [])
  const days = useLiveQuery(() => db.days.toArray(), [])
  const foods = useLiveQuery(() => db.foods.toArray(), [])
  const runs = useLiveQuery(() => db.runs.toArray(), [])
  const [limit, setLimit] = useState(PAGE)

  const history = useMemo(
    () => buildHistory((workouts ?? []) as Workout[], (sets ?? []) as SetLog[]),
    [workouts, sets],
  )
  const bests = useMemo(() => personalBests((sets ?? []) as SetLog[]), [sets])

  if (!workouts || !sets || !days || !foods || !runs) return <div className="text-muted">Načítavam…</div>

  const today = todayISO()
  const prs28 = recentPrCount(history, today)
  const totalVolume = history.reduce((n, w) => n + w.volumeKg, 0)
  const thisWeek = weekStart(today)
  const volume = volumeLines(actualWeeklyVolume(sets as SetLog[], thisWeek), plannedWeeklyVolume(settings, workouts as Workout[], thisWeek))
  const adh = adherence(settings, workouts as Workout[], today)

  if (history.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">História</h1>
        <Card>
          <p className="text-sm text-muted">
            Zatiaľ žiadny dokončený tréning. Keď nejaký ukončíš cez „Ukončiť tréning a vyhodnotiť“, objaví sa tu aj s rekordmi.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">História</h1>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Tréningov" value={history.length} />
        <Stat label="Rekordy 28 dní" value={prs28} tone={prs28 > 0 ? 'good' : 'ink'} />
        <Stat label="Nazdvíhané" value={`${num(Math.round(totalVolume / 1000), 1)} t`} sub="váha × opakovania" />
      </div>

      <Card>
        <CardTitle right={<Pill tone={adh.thisWeek.done >= adh.thisWeek.planned ? 'good' : 'muted'}>{adh.thisWeek.done}/{adh.thisWeek.planned} tréningov</Pill>}>
          Objem tento týždeň
        </CardTitle>
        <ul className="space-y-2" data-testid="volume-lines">
          {volume.map((l) => {
            const pct = l.planned > 0 ? Math.min(100, Math.round((l.done / l.planned) * 100)) : 0
            return (
              <li key={l.group} className="text-sm">
                <div className="flex justify-between">
                  <span>{MUSCLE_GROUP_LABEL[l.group]}</span>
                  <span className={l.done >= l.planned && l.planned > 0 ? 'text-good' : 'text-muted'}>
                    {l.done}/{l.planned} sérií
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface2">
                  <div className={`h-full rounded-full ${pct >= 100 ? 'bg-good' : 'bg-accent'}`} style={{ width: `${pct}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-xs text-muted">
          Odcvičené pracovné série na partiu oproti plánu šablón (pondelok–nedeľa). Pri chudnutí je toto hlavný znak, že objem na udržanie svalov nie je len na papieri (RESEARCH R3).
        </p>
      </Card>

      <Card>
        <CardTitle right={adh.pct !== null ? <Pill tone={adh.pct >= 80 ? 'good' : adh.pct >= 60 ? 'warn' : 'muted'}>{adh.pct} %</Pill> : undefined}>Dodržiavanie plánu</CardTitle>
        {adh.weeks.length === 0 ? (
          <p className="text-sm text-muted">Prvý uzavretý týždeň príde v pondelok. Zatiaľ tento týždeň {adh.thisWeek.done}/{adh.thisWeek.planned}.</p>
        ) : (
          <>
            <p className="text-sm text-muted">
              {adh.doneTotal} z {adh.plannedTotal} plánovaných tréningov za {adh.weeks.length} {adh.weeks.length === 1 ? 'týždeň' : adh.weeks.length < 5 ? 'týždne' : 'týždňov'}.
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {adh.weeks.slice(-12).map((w) => (
                <li
                  key={w.weekStart}
                  title={`Týždeň od ${formatSk(w.weekStart)}`}
                  className={`rounded-lg px-2 py-1 text-xs ${w.done >= w.planned ? 'bg-good/15 text-good' : w.done > 0 ? 'bg-warn/15 text-warn' : 'bg-surface2 text-muted'}`}
                >
                  {w.weekStart.slice(5).replace('-', '.')} · {w.done}/{w.planned}
                  {w.deload ? ' D' : ''}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">Ukončené silové tréningy z plánovaného počtu dní za týždeň (D = deload). Bežiaci týždeň sa do percenta neráta.</p>
          </>
        )}
      </Card>

      <Card>
        <CardTitle right={<Pill>{bests.length} cvikov</Pill>}>Osobné rekordy</CardTitle>
        {bests.length === 0 ? (
          <p className="text-sm text-muted">Zatiaľ nič s číslami.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {bests.map((b) => (
              <li key={b.exerciseId} className="flex items-center justify-between gap-2 rounded-lg bg-surface2 px-3 py-2">
                <span className="min-w-0 truncate">{b.name}</span>
                <span className="shrink-0 font-semibold text-accent">{b.detail}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-muted">
          Cviky so záťažou sa porovnávajú cez odhad 1RM, takže 24 kg × 8 op. porazí 20 kg × 10 op. aj pri menej opakovaniach.
        </p>
      </Card>

      <AiSummary
        title="Sumár týždňa"
        system={WEEK_SYSTEM}
        apiKey={settings.anthropicApiKey}
        hint="Posiela súhrnné čísla za posledných 7 dní, nie celú históriu."
        context={buildWeekContext(
          addDays(today, -6),
          today,
          days as DayLog[],
          foods as FoodEntry[],
          workouts as Workout[],
          { kcal: settings.calorieTarget, proteinG: proteinFor(settings).gramsPerDay },
          recentPrCount(history, today, 6),
          runs as RunLog[],
        )}
      />

      <Card>
        <CardTitle right={<Pill>{history.length}</Pill>}>Odcvičené tréningy</CardTitle>
        <ul className="space-y-2">
          {history.slice(0, limit).map((w) => (
            <WorkoutRow key={w.workoutId} w={w} />
          ))}
        </ul>
        {limit < history.length ? (
          <button
            type="button"
            onClick={() => setLimit((n) => n + PAGE)}
            className="tap mt-3 w-full rounded-xl border border-line bg-surface2 text-sm text-muted active:bg-line"
            data-testid="history-more"
          >
            Zobraziť staršie
          </button>
        ) : null}
      </Card>
    </div>
  )
}

function WorkoutRow({ w }: { w: WorkoutSummary }) {
  return (
    <li className="rounded-xl border border-line bg-surface2">
      <details>
        <summary className="tap flex cursor-pointer items-center justify-between gap-2 px-3">
          <span className="min-w-0">
            <span className="block text-sm font-semibold">
              {dayOfWeekSk(w.date)} {formatSk(w.date)}
            </span>
            <span className="block text-xs text-muted">
              Tréning {w.template} · {w.setCount} sérií
              {w.volumeKg > 0 ? ` · ${num(w.volumeKg)} kg` : ''}
              {w.avgRpe !== null ? ` · RPE ${num(w.avgRpe, 1)}` : ''}
            </span>
          </span>
          <span className="flex shrink-0 gap-1">
            {w.isDeload ? <Pill tone="warn">deload</Pill> : null}
            {w.maxPain > 3 ? <Pill tone="warn">bolesť {w.maxPain}</Pill> : null}
            {w.prs.length ? <Pill tone="good">🏆 {w.prs.length}</Pill> : null}
          </span>
        </summary>

        <div className="border-t border-line px-3 py-2">
          <p className="mb-2 text-xs text-muted">{TEMPLATE_NAMES[w.template]}</p>
          <ul className="space-y-1 text-sm">
            {w.exercises.map((e) => (
              <li key={e.exerciseId} className="flex flex-wrap items-center justify-between gap-x-2">
                <span className="min-w-0 truncate">
                  {e.isPr ? '🏆 ' : ''}
                  {e.name}
                </span>
                <span className={`shrink-0 ${e.isPr ? 'font-semibold text-good' : 'text-muted'}`}>
                  {e.setCount}× · {e.best}
                </span>
                {e.notes.length ? <span className="basis-full text-xs text-muted">✎ {e.notes.join(' · ')}</span> : null}
              </li>
            ))}
          </ul>
          {w.prs.length ? (
            <p className="mt-2 text-xs text-good">
              Nový rekord: {w.prs.map((p) => `${p.name} ${p.detail}`).join(', ')}
            </p>
          ) : null}
        </div>
      </details>
    </li>
  )
}
