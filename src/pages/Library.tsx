import { useMemo, useState } from 'react'
import { Card, Pill } from '../components/ui'
import { EXERCISES, type Exercise } from '../domain/exercises'
import { useExerciseStates } from '../hooks/useAppData'
import type { Settings } from '../domain/types'
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
                </div>
              ) : null}
            </Card>
          )
        })}
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
