import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button, Card, CardTitle, NumberField, Pill } from './ui'
import { db } from '../db/db'
import { addRun, deleteRun } from '../db/actions'
import { formatDuration, formatPace, netKcal, paceSecPerKm, toSeconds, validRun } from '../domain/running'
import { num } from '../lib/format'
import type { RunLog } from '../domain/types'

export function RunCard({ date, weightKg }: { date: string; weightKg: number | null }) {
  const runs = useLiveQuery(() => db.runs.where('date').equals(date).toArray(), [date])
  const [open, setOpen] = useState(false)
  const [meters, setMeters] = useState<number | null>(null)
  const [min, setMin] = useState<number | null>(null)
  const [sec, setSec] = useState<number | null>(null)
  const [pain, setPain] = useState<number | null>(null)

  const list = runs ?? []
  const totalKcal = list.reduce((n, r) => n + r.kcal, 0)
  const totalMeters = list.reduce((n, r) => n + r.meters, 0)

  const seconds = toSeconds(min, sec)
  const ready = validRun(meters, seconds) && weightKg !== null
  const preview =
    ready && meters !== null && weightKg !== null
      ? { kcal: netKcal({ meters, seconds, weightKg }), pace: paceSecPerKm(meters, seconds) }
      : null

  async function save() {
    if (!ready || meters === null || weightKg === null) return
    await addRun({ date, meters, seconds, kcal: netKcal({ meters, seconds, weightKg }), pain })
    setMeters(null)
    setMin(null)
    setSec(null)
    setPain(null)
    setOpen(false)
  }

  return (
    <Card>
      <CardTitle right={totalKcal > 0 ? <Pill tone="accent">{totalKcal} kcal</Pill> : <Pill>0</Pill>}>Beh</CardTitle>

      {list.length === 0 ? (
        <p className="text-sm text-muted">Dnes bez behu.</p>
      ) : (
        <ul className="mb-2 space-y-1">
          {list.map((r: RunLog) => (
            <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface2 px-3 py-2">
              <span className="min-w-0">
                <span className="block text-sm">
                  {num(r.meters / 1000, 2)} km · {formatDuration(r.seconds)}
                </span>
                <span className="block text-xs text-muted">
                  {formatPace(paceSecPerKm(r.meters, r.seconds))}
                  {typeof r.pain === 'number' && r.pain > 0 ? ` · bolesť ${r.pain}` : ''}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="font-semibold">{r.kcal}</span>
                <button
                  type="button"
                  aria-label="Zmazať beh"
                  onClick={() => void deleteRun(r.id as number)}
                  className="tap w-9 rounded-lg border border-line text-muted active:bg-line"
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {totalMeters > 0 ? (
        <p className="mb-2 text-xs text-muted">Dnes spolu {num(totalMeters / 1000, 2)} km.</p>
      ) : null}

      {!open ? (
        <Button variant="secondary" className="w-full" onClick={() => setOpen(true)} data-testid="run-open">
          Pridať beh
        </Button>
      ) : (
        <div className="space-y-2">
          <NumberField label="Vzdialenosť (m)" value={meters} onChange={setMeters} step={100} min={0} max={100000} testId="run-meters" />
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Minúty" value={min} onChange={setMin} step={1} min={0} max={720} testId="run-min" />
            <NumberField label="Sekundy" value={sec} onChange={setSec} step={5} min={0} max={59} testId="run-sec" />
          </div>
          <NumberField label="Bolesť (0–10, voliteľné)" value={pain} onChange={setPain} step={1} min={0} max={10} />

          {preview ? (
            <div className="rounded-xl border border-accent/40 bg-accent/10 p-3">
              <p className="text-lg font-bold">{preview.kcal} kcal</p>
              <p className="text-xs text-muted">
                Tempo {formatPace(preview.pace)} · {formatDuration(seconds)} · odhad podľa hmotnosti {num(weightKg ?? 0, 1)} kg
              </p>
            </div>
          ) : weightKg === null ? (
            <p className="text-xs text-warn">Na výpočet kalórií treba zapísanú hmotnosť.</p>
          ) : null}

          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => void save()} disabled={!ready} data-testid="run-save">
              Zapísať
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => setOpen(false)}>
              Zrušiť
            </Button>
          </div>
          <p className="text-xs text-muted">
            Tempo sa dopočíta zo vzdialenosti a času, nezadáva sa zvlášť. Kalórie sú čistý výdaj navyše oproti pokoju.
          </p>
        </div>
      )}
    </Card>
  )
}
