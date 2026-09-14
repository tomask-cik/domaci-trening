import { useState } from 'react'
import { Banner, Button, Card, CardTitle } from './ui'
import { hasApiKey, summarize } from '../lib/claude'

export function AiSummary({
  title,
  system,
  context,
  apiKey,
  hint,
}: {
  title: string
  system: string
  context: unknown
  apiKey: string | undefined
  hint?: string
}) {
  const [text, setText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const ready = hasApiKey(apiKey)

  async function run() {
    if (!ready) return
    setBusy(true)
    setError(null)
    const r = await summarize(apiKey, system, context)
    if (r.ok) setText(r.text)
    else setError(r.error)
    setBusy(false)
  }

  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      {!ready ? (
        <p className="text-sm text-muted">Potrebuje API kľúč – nastavíš ho vo Viac → Odhad kalórií cez AI.</p>
      ) : (
        <>
          <Button variant="secondary" className="w-full" onClick={() => void run()} disabled={busy}>
            {busy ? 'Píšem…' : text ? 'Prepísať nanovo' : 'Vygenerovať'}
          </Button>
          {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
          {error ? (
            <div className="mt-2">
              <Banner tone="warn">{error}</Banner>
            </div>
          ) : null}
          {text ? <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{text}</p> : null}
        </>
      )}
    </Card>
  )
}
