import { useState } from 'react'
import { Link } from 'react-router-dom'
import { applyHealthImport } from '../db/actions'
import { describeImport, parseHealthText } from '../domain/healthImport'
import { appBaseUrl, hasShortcutName, workoutShortcutUrl, workoutWindowPayload } from '../domain/healthShortcut'
import type { Settings, Workout } from '../domain/types'
import { Banner, Button } from './ui'

/**
 * Tep a energia z hodiniek k jednému tréningu.
 *
 * Keď dáta sú, ukáže ich. Keď nie, spustí Skratku s oknom tréningu (`shortcuts://run-shortcut`).
 * Skratka sa vráti cez `?hk=workout&…` – ale na iPhone môže návratová adresa otvoriť Safari,
 * nie appku na ploche (majú oddelené úložisko). Preto je tu aj cesta cez schránku: Skratka
 * skopíruje výsledok, tu sa vloží.
 */
export function WatchCard({
  workout,
  settings,
  compact = false,
}: {
  workout: Pick<Workout, 'id' | 'startedAt' | 'finishedAt' | 'healthKcal' | 'healthAvgHr'>
  settings: Pick<Settings, 'healthShortcutName'>
  compact?: boolean
}) {
  const [message, setMessage] = useState<string | null>(null)
  const [manual, setManual] = useState('')
  const [showManual, setShowManual] = useState(false)

  const has = typeof workout.healthKcal === 'number' || typeof workout.healthAvgHr === 'number'
  const named = hasShortcutName(settings.healthShortcutName)

  async function applyText(text: string) {
    const found = parseHealthText(text, new Date().toISOString().slice(0, 10))
    if (!found) {
      setMessage('V texte nie sú dáta z Health (čakám hk=workout&id=…&kcal=…&hr=…).')
      return
    }
    if (found.kind === 'workout' && found.workoutId !== workout.id) {
      setMessage(`Dáta patria tréningu ${found.workoutId}, toto je tréning ${String(workout.id)}.`)
      return
    }
    const ok = await applyHealthImport(found)
    setMessage(ok ? describeImport(found) : 'Import sa netýkal žiadneho záznamu.')
    setManual('')
    setShowManual(false)
  }

  async function fromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      await applyText(text)
    } catch {
      setMessage('Schránku sa nepodarilo prečítať – vlož text ručne.')
      setShowManual(true)
    }
  }

  function runShortcut() {
    if (!named || !hasShortcutName(settings.healthShortcutName)) return
    const payload = workoutWindowPayload(workout, appBaseUrl(window.location.href), new Date().toISOString())
    if (!payload) return
    window.location.href = workoutShortcutUrl(settings.healthShortcutName, payload)
  }

  if (has) {
    return (
      <p className={`${compact ? 'text-xs' : 'text-sm'} text-muted`}>
        ⌚️ {typeof workout.healthKcal === 'number' ? `${workout.healthKcal} kcal aktívna energia` : ''}
        {typeof workout.healthKcal === 'number' && typeof workout.healthAvgHr === 'number' ? ' · ' : ''}
        {typeof workout.healthAvgHr === 'number' ? `priemerný tep ${workout.healthAvgHr}` : ''}
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {named ? (
        <Button variant="secondary" className="w-full" onClick={runShortcut} data-testid="run-shortcut">
          ⌚️ Doplniť tep a energiu z hodiniek
        </Button>
      ) : (
        <p className="text-xs text-muted">
          Tep a energiu z hodiniek doplní Skratka – názov nastavíš vo <Link to="/viac" className="underline">Viac → Apple Health</Link>.
        </p>
      )}
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1 text-xs" onClick={() => void fromClipboard()}>
          Vložiť zo schránky
        </Button>
        <Button variant="ghost" className="flex-1 text-xs" onClick={() => setShowManual((v) => !v)}>
          Vložiť ručne
        </Button>
      </div>
      {showManual ? (
        <div className="flex gap-2">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="hk=workout&id=…&kcal=…&hr=…"
            aria-label="Text zo Skratky"
            className="tap min-w-0 flex-1 rounded-xl border border-line bg-surface2 px-3 text-sm"
          />
          <Button variant="secondary" className="px-3" onClick={() => void applyText(manual)} disabled={!manual.trim()}>
            Načítať
          </Button>
        </div>
      ) : null}
      {message ? <Banner tone="info">{message}</Banner> : null}
    </div>
  )
}
