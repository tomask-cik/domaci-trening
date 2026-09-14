import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Card, CardTitle, Pill, Stat } from '../components/ui'
import { db } from '../db/db'
import { buildHistory, personalBests, recentPrCount, type WorkoutSummary } from '../domain/history'
import { dayOfWeekSk, formatSk, todayISO } from '../domain/dates'
import { TEMPLATE_NAMES } from '../domain/program'
import { num } from '../lib/format'
import type { SetLog, Workout } from '../domain/types'

const PAGE = 15

export default function History() {
  const workouts = useLiveQuery(() => db.workouts.toArray(), [])
  const sets = useLiveQuery(() => db.sets.toArray(), [])
  const [limit, setLimit] = useState(PAGE)

  const history = useMemo(
    () => buildHistory((workouts ?? []) as Workout[], (sets ?? []) as SetLog[]),
    [workouts, sets],
  )
  const bests = useMemo(() => personalBests((sets ?? []) as SetLog[]), [sets])

  if (!workouts || !sets) return <div className="text-muted">Načítavam…</div>

  const today = todayISO()
  const prs28 = recentPrCount(history, today)
  const totalVolume = history.reduce((n, w) => n + w.volumeKg, 0)

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
              <li key={e.exerciseId} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate">
                  {e.isPr ? '🏆 ' : ''}
                  {e.name}
                </span>
                <span className={`shrink-0 ${e.isPr ? 'font-semibold text-good' : 'text-muted'}`}>
                  {e.setCount}× · {e.best}
                </span>
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
