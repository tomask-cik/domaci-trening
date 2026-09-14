import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Banner, Button, Card, CardTitle, NumberField, Pill, Stat } from '../components/ui'
import { db } from '../db/db'
import { addFood, deleteFood } from '../db/actions'
import { dayTotals, proteinProgress, scaleToGrams, validGrams, type Nutrition } from '../domain/food'
import { proteinTarget } from '../domain/protein'
import { todayISO } from '../domain/dates'
import { hasApiKey, lookupFood } from '../lib/claude'
import { kcal as fmtKcal, num } from '../lib/format'
import type { FoodEntry, Settings } from '../domain/types'

export default function Food({ settings }: { settings: Settings }) {
  const navigate = useNavigate()
  const today = todayISO()
  const entries = useLiveQuery(() => db.foods.where('date').equals(today).toArray(), [today])

  const [name, setName] = useState('')
  const [grams, setGrams] = useState<number | null>(100)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [found, setFound] = useState<Nutrition | null>(null)
  const [manualKcal, setManualKcal] = useState<number | null>(null)

  if (!entries) return <div className="text-muted">Načítavam…</div>

  const totals = dayTotals(entries)
  const protein = proteinTarget({
    targetWeightKg: settings.targetWeightKg,
    referenceWeightKg: settings.startWeightKg,
    bodyFatPct: settings.bodyFatPct,
  })
  const keyReady = hasApiKey(settings.anthropicApiKey)
  const preview = found && validGrams(grams) ? scaleToGrams(found, grams as number) : null

  async function ask() {
    if (!keyReady || !name.trim()) return
    setBusy(true)
    setError(null)
    setFound(null)
    const r = await lookupFood(settings.anthropicApiKey as string, name)
    if (r.ok && r.value) setFound(r.value)
    else setError(r.error ?? 'Nepodarilo sa.')
    setBusy(false)
  }

  async function saveFromAi() {
    if (!found || !preview || !validGrams(grams)) return
    await addFood({
      date: today,
      name: found.label || name.trim(),
      grams: grams as number,
      kcal: preview.kcal,
      proteinG: preview.proteinG,
      source: 'ai',
      note: found.note || undefined,
    })
    reset()
  }

  async function saveManual() {
    if (!name.trim() || manualKcal === null || manualKcal <= 0) return
    await addFood({
      date: today,
      name: name.trim(),
      grams: validGrams(grams) ? (grams as number) : 0,
      kcal: Math.round(manualKcal),
      proteinG: 0,
      source: 'manual',
    })
    reset()
  }

  function reset() {
    setName('')
    setGrams(100)
    setFound(null)
    setManualKcal(null)
    setError(null)
  }

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <h1 className="text-2xl font-bold">Jedlo dnes</h1>
        <Button variant="ghost" className="px-3" onClick={() => void navigate('/dnes')}>
          Späť
        </Button>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Kalórie" value={totals.kcal} sub={`cieľ ${settings.calorieTarget}`} tone={totals.kcal > settings.calorieTarget ? 'warn' : 'ink'} />
        <Stat label="Bielkoviny" value={`${num(totals.proteinG)} g`} sub={`cieľ ${protein.gramsPerDay} g`} />
        <Stat label="Položiek" value={totals.count} sub={`${proteinProgress(totals, protein.gramsPerDay)} % bielkovín`} />
      </div>

      {!keyReady ? (
        <Banner tone="warn">
          Odhad cez AI potrebuje tvoj Claude API kľúč. Zadáš ho vo <b>Viac → Odhad kalórií cez AI</b>. Bez neho môžeš zapisovať kalórie ručne.
        </Banner>
      ) : null}

      <Card>
        <CardTitle>Pridať jedlo</CardTitle>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm text-muted">Čo si jedol</span>
            <input
              data-testid="food-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setFound(null)
                setError(null)
              }}
              placeholder="napr. vyprážaný rezeň, banán, kofola"
              className="tap w-full rounded-xl border border-line bg-surface2 px-3 text-base"
            />
          </label>

          <NumberField label="Množstvo (g / ml)" value={grams} onChange={setGrams} step={10} min={1} max={5000} testId="food-grams" />

          {keyReady ? (
            <Button className="w-full" onClick={() => void ask()} disabled={busy || !name.trim()} data-testid="food-ask">
              {busy ? 'Zisťujem…' : 'Zistiť kalórie cez AI'}
            </Button>
          ) : null}

          {error ? <Banner tone="warn">{error}</Banner> : null}

          {found && preview ? (
            <div className="rounded-xl border border-accent/40 bg-accent/10 p-3">
              <p className="text-sm font-semibold text-accent">{found.label || name}</p>
              <p className="mt-1 text-lg font-bold">
                {fmtKcal(preview.kcal)} · {num(preview.proteinG, 1)} g bielkovín
              </p>
              <p className="mt-1 text-xs text-muted">
                {num(found.kcalPer100, 1)} kcal a {num(found.proteinPer100, 1)} g bielkovín na 100 g × {num(grams)} g
              </p>
              {found.note ? <p className="mt-1 text-xs text-muted">{found.note}</p> : null}
              <Button className="mt-3 w-full" onClick={() => void saveFromAi()} data-testid="food-save-ai">
                Zapísať
              </Button>
              <p className="mt-2 text-xs text-muted">Je to odhad, nie údaj z obalu. Keď máš obal po ruke, prepíš to ručne.</p>
            </div>
          ) : null}

          <details>
            <summary className="cursor-pointer text-xs text-muted">Zapísať kalórie ručne</summary>
            <div className="mt-2 space-y-2">
              <NumberField label="Kalórie" value={manualKcal} onChange={setManualKcal} step={10} min={0} max={5000} testId="food-manual-kcal" />
              <Button variant="secondary" className="w-full" onClick={() => void saveManual()} disabled={!name.trim() || !manualKcal} data-testid="food-save-manual">
                Zapísať ručne
              </Button>
            </div>
          </details>
        </div>
      </Card>

      <Card>
        <CardTitle right={<Pill>{fmtKcal(totals.kcal)}</Pill>}>Dnešný zoznam</CardTitle>
        {entries.length === 0 ? (
          <p className="text-sm text-muted">Zatiaľ nič. Prvá položka sa hneď premietne do kalórií na Dnes.</p>
        ) : (
          <ul className="space-y-1">
            {entries.map((e: FoodEntry) => (
              <li key={e.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface2 px-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm">
                    {e.name}
                    {e.source === 'ai' ? ' ✨' : ''}
                  </span>
                  <span className="block text-xs text-muted">
                    {e.grams > 0 ? `${num(e.grams)} g · ` : ''}
                    {num(e.proteinG, 1)} g B
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-semibold">{e.kcal}</span>
                  <button
                    type="button"
                    aria-label={`Zmazať ${e.name}`}
                    onClick={() => void deleteFood(e.id as number, today)}
                    className="tap w-9 rounded-lg border border-line text-muted active:bg-line"
                  >
                    ×
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
