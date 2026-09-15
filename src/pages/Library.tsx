import { useMemo, useState } from 'react'
import { Button, Card, NumberField, Pill } from '../components/ui'
import { overrideExerciseState } from '../db/actions'
import { EXERCISES, type Exercise } from '../domain/exercises'
import { useExerciseStates } from '../hooks/useAppData'
import type { ExerciseState, Settings } from '../domain/types'
import { recommend } from '../domain/progression'

const CATEGORIES = [
  { id: 'all', label: 'Všetko' },
  { id: 'sila', label: 'Sila' },
  { id: 'stred', label: 'Stred tela' },
  { id: 'mobilita', label: 'Mobilita' },
] as const

export default function Library({ settings }: { settings: Settings }) {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]['id']>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const states = useExerciseStates()
  const stateMap = useMemo(() => new Map((states ?? []).map((s) => [s.exerciseId, s])), [states])

  const list = EXERCISES.filter((e) => {
    if (cat !== 'all' && e.category !== cat) return false
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return e.name.toLowerCase().includes(q) || e.muscles.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Knižnica cvikov</h1>
        <p className="text-sm text-muted">Technika, najčastejšie chyby, regresia, progresia a náhrada pri bolesti.</p>
      </header>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Hľadať cvik alebo partiu…"
        aria-label="Hľadať cvik"
        className="tap w-full rounded-xl border border-line bg-surface2 px-4 text-base"
      />
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCat(c.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm ${cat === c.id ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-surface2 text-muted'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? <p className="text-muted">Nič sa nenašlo.</p> : null}

      <div className="space-y-3">
        {list.map((ex) => {
          const open = openId === ex.id
          const state = stateMap.get(ex.id)
          const rec = state ? recommend(ex, state, false) : null
          return (
            <Card key={ex.id}>
              <button type="button" className="flex w-full items-start justify-between gap-3 text-left" onClick={() => setOpenId(open ? null : ex.id)}>
                <span>
                  <span className="block text-base font-semibold">{ex.name}</span>
                  <span className="block text-xs text-muted">{ex.muscles}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {ex.key ? <Pill tone="accent">kľúčový</Pill> : null}
                  <span className="text-muted">{open ? '▲' : '▼'}</span>
                </span>
              </button>
              {open ? (
                <div className="mt-3 space-y-3 text-sm">
                  {rec ? (
                    <div className="rounded-lg bg-surface2 p-3">
                      <span className="text-xs text-muted">Aktuálne v tvojom pláne</span>
                      <div className="font-semibold text-accent">{rec.title}</div>
                      {rec.detail ? <div className="text-xs text-muted">{rec.detail}</div> : null}
                    </div>
                  ) : null}
                  <Row label="Technika" text={ex.technique} />
                  <Row label="Časté chyby" text={ex.mistakes} />
                  <Row label="Regresia (ľahšie)" text={ex.regression} />
                  <Row label="Progresia (ťažšie)" text={ex.progression} />
                  <Row label="Náhrada pri bolesti" text={ex.painSub} />
                  {ex.stages ? <Stages ex={ex} currentStage={state?.stage ?? 0} /> : null}
                  {ex.variants && ex.variants.length > 1 ? (
                    <div>
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Varianty</div>
                      <ol className="space-y-1">
                        {ex.variants.map((v, i) => (
                          <li key={v} className={i === (state?.variant ?? 0) ? 'text-accent' : 'text-muted'}>
                            {i + 1}. {v}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : null}
                  {ex.startWeightKg && settings.kettlebells.length ? (
                    <p className="text-xs text-muted">Dostupné kettlebelly: {settings.kettlebells.join(', ')} kg.</p>
                  ) : null}
                  {state ? <StateEditor ex={ex} state={state} settings={settings} /> : null}
                </div>
              ) : null}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Ručná úprava plánu – keď vieš viac než algoritmus (zvládneš štádium 4, chceš začať s ťažším KB).
 * Uloží sa až tlačidlom, streaky sa vynulujú (domain/progression.applyOverride).
 */
function StateEditor({ ex, state, settings }: { ex: Exercise; state: ExerciseState; settings: Settings }) {
  const [open, setOpen] = useState(false)
  const [weight, setWeight] = useState<number | null>(state.weightKg)
  const [reps, setReps] = useState<number | null>(state.targetReps)
  const [variant, setVariant] = useState(state.variant)
  const [stage, setStage] = useState(state.stage)
  const [target, setTarget] = useState<number | null>(state.target)
  const [saved, setSaved] = useState(false)
  const kbs = settings.kettlebells
  const stages = ex.stages ?? []
  const currentStage = stages[stage]

  async function save() {
    await overrideExerciseState(ex.id, { weightKg: weight, targetReps: reps, variant, stage, target }, settings)
    setSaved(true)
    setOpen(false)
  }

  if (!open) {
    return (
      <div>
        <Button variant="ghost" className="w-full" onClick={() => setOpen(true)} data-testid={`edit-state-${ex.id}`}>
          Upraviť plán cviku ručne
        </Button>
        {saved ? <p className="mt-1 text-center text-xs text-good">Uložené – ďalší tréning ide podľa toho.</p> : null}
      </div>
    )
  }

  const kbSelect = (value: number | null, onChange: (v: number | null) => void) => (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">Kettlebell</span>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} className="tap w-full rounded-xl border border-line bg-surface2 px-3 text-base">
        <option value="" className="bg-surface">bez záťaže</option>
        {kbs.map((k) => (
          <option key={k} value={k} className="bg-surface">
            {k} kg
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <div className="space-y-3 rounded-xl border border-warn/40 bg-warn/5 p-3">
      <p className="text-xs text-muted">Ručná úprava vynuluje počítadlá progresie. Ďalší tréning začne odtiaľto.</p>
      {ex.kind === 'load' ? (
        <>
          {kbSelect(weight, setWeight)}
          <NumberField label={`Cieľ opakovaní (${ex.range?.[0] ?? 8}–${ex.range?.[1] ?? 12})`} value={reps} onChange={setReps} min={ex.range?.[0] ?? 1} max={ex.range?.[1] ?? 30} />
          {ex.variants && ex.variants.length > 1 ? (
            <label className="block">
              <span className="mb-1 block text-sm text-muted">Variant</span>
              <select value={variant} onChange={(e) => setVariant(Number(e.target.value))} className="tap w-full rounded-xl border border-line bg-surface2 px-3 text-base">
                {ex.variants.map((v, i) => (
                  <option key={v} value={i} className="bg-surface">
                    {i + 1}. {v}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </>
      ) : ex.kind === 'timed' ? (
        <>
          {ex.startWeightKg ? kbSelect(weight, setWeight) : null}
          <NumberField label={`Cieľ sekúnd (${ex.timedRange?.[0] ?? 20}–${ex.timedRange?.[1] ?? 40})`} value={target} onChange={setTarget} step={5} min={ex.timedRange?.[0] ?? 5} max={ex.timedRange?.[1] ?? 120} />
        </>
      ) : (
        <>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">Štádium</span>
            <select
              value={stage}
              onChange={(e) => {
                const s = Number(e.target.value)
                setStage(s)
                setTarget(stages[s]?.lo ?? null)
              }}
              className="tap w-full rounded-xl border border-line bg-surface2 px-3 text-base"
            >
              {stages.map((s, i) => (
                <option key={s.name} value={i} className="bg-surface">
                  {i + 1}. {s.name}
                </option>
              ))}
            </select>
          </label>
          {currentStage ? (
            <NumberField
              label={`Cieľ (${currentStage.lo}–${currentStage.hi} ${currentStage.unit === 'sec' ? 's' : 'op.'})`}
              value={target}
              onChange={setTarget}
              step={currentStage.unit === 'sec' ? 5 : 1}
              min={currentStage.lo}
              max={currentStage.hi}
            />
          ) : null}
        </>
      )}
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => void save()} data-testid={`save-state-${ex.id}`}>
          Uložiť
        </Button>
        <Button variant="ghost" className="flex-1" onClick={() => setOpen(false)}>
          Zrušiť
        </Button>
      </div>
    </div>
  )
}

function Row({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{label}</div>
      <p>{text}</p>
    </div>
  )
}

function Stages({ ex, currentStage }: { ex: Exercise; currentStage: number }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Štádiá</div>
      <ol className="space-y-1">
        {ex.stages?.map((s, i) => (
          <li key={s.name} className={i === currentStage ? 'font-semibold text-accent' : 'text-muted'}>
            {i + 1}. {s.name} — {s.lo}–{s.hi} {s.unit === 'sec' ? 's' : 'op.'}
            {s.note ? ` (${s.note})` : ''}
          </li>
        ))}
      </ol>
    </div>
  )
}
