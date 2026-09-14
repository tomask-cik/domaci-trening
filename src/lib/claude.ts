/**
 * Volanie Claude API priamo z prehliadača.
 *
 * Kľúč je uložený len v IndexedDB v tomto telefóne – nikdy nie v repozitári.
 * Hlavička `anthropic-dangerous-direct-browser-access` je nutná, inak prehliadač
 * požiadavku zablokuje na CORS. Volá sa „dangerous“ preto, že kľúč vidí každý,
 * kto má prístup k zariadeniu; pre vlastnú appku s vlastným kľúčom je to v poriadku,
 * pre appku s cudzími používateľmi by to bola chyba.
 */

import { parseNutrition, type Nutrition } from '../domain/food'

const ENDPOINT = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'
/** Sumáre potrebujú viac úsudku než vyhľadanie kalórií. */
const MODEL_SUMMARY = 'claude-sonnet-5'

const SYSTEM = `Si výživová databáza. Používateľ napíše názov jedla, nápoja, ovocia, sladkosti alebo hotového jedla po slovensky.
Vráť VÝHRADNE JSON objekt, bez sprievodného textu a bez markdown značiek, v tvare:
{"label": "presný názov jedla", "kcalPer100": číslo, "proteinPer100": číslo, "note": "krátka poznámka po slovensky"}

Pravidlá:
- kcalPer100 a proteinPer100 sú hodnoty na 100 g, pri nápojoch na 100 ml.
- Ak ide o hotové jedlo alebo recept (napr. vyprážaný rezeň, guláš, zapekané cestoviny), odhadni typickú domácu prípravu a do note napíš, z čoho si vychádzal.
- Ak je názov príliš vágny na odhad, vráť {"neznama": true, "note": "čo potrebuješ upresniť"}.
- note maximálne 15 slov.`

export interface LookupResult {
  ok: boolean
  value?: Nutrition
  error?: string
}

export function hasApiKey(key: string | undefined | null): key is string {
  return typeof key === 'string' && key.trim().length > 20
}

export async function lookupFood(apiKey: string, query: string, signal?: AbortSignal): Promise<LookupResult> {
  if (!query.trim()) return { ok: false, error: 'Zadaj názov jedla.' }

  let res: Response
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: signal ?? null,
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        system: SYSTEM,
        messages: [{ role: 'user', content: query.trim() }],
      }),
    })
  } catch {
    return { ok: false, error: 'Nepodarilo sa spojiť s API. Skontroluj internet.' }
  }

  if (!res.ok) {
    if (res.status === 401) return { ok: false, error: 'Neplatný API kľúč. Skontroluj ho v nastaveniach.' }
    if (res.status === 429) return { ok: false, error: 'Priveľa požiadaviek naraz. Skús o chvíľu.' }
    if (res.status === 400) return { ok: false, error: 'API odmietlo požiadavku (400).' }
    return { ok: false, error: `API vrátilo chybu ${res.status}.` }
  }

  let data: unknown
  try {
    data = await res.json()
  } catch {
    return { ok: false, error: 'Odpoveď API sa nedá prečítať.' }
  }

  const blocks = (data as { content?: { type?: string; text?: string }[] }).content ?? []
  const text = blocks
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('\n')
  if (!text.trim()) return { ok: false, error: 'API vrátilo prázdnu odpoveď.' }

  const parsed = parseNutrition(text)
  return parsed.ok ? { ok: true, value: parsed.value } : { ok: false, error: parsed.error }
}

interface CallOpts {
  model: string
  system: string
  user: string
  maxTokens: number
  signal?: AbortSignal
}

async function callClaude(apiKey: string, o: CallOpts): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  let res: Response
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: o.signal ?? null,
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: o.model,
        max_tokens: o.maxTokens,
        system: o.system,
        messages: [{ role: 'user', content: o.user }],
      }),
    })
  } catch {
    return { ok: false, error: 'Nepodarilo sa spojiť s API. Skontroluj internet.' }
  }
  if (!res.ok) {
    if (res.status === 401) return { ok: false, error: 'Neplatný API kľúč. Skontroluj ho v nastaveniach.' }
    if (res.status === 429) return { ok: false, error: 'Priveľa požiadaviek naraz. Skús o chvíľu.' }
    return { ok: false, error: `API vrátilo chybu ${res.status}.` }
  }
  let data: unknown
  try {
    data = await res.json()
  } catch {
    return { ok: false, error: 'Odpoveď API sa nedá prečítať.' }
  }
  const text = ((data as { content?: { type?: string; text?: string }[] }).content ?? [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('\n')
    .trim()
  return text ? { ok: true, text } : { ok: false, error: 'API vrátilo prázdnu odpoveď.' }
}

/** Sumár dňa alebo týždňa. `context` je malý JSON objekt zo `domain/summary`. */
export async function summarize(
  apiKey: string,
  system: string,
  context: unknown,
  signal?: AbortSignal,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  return callClaude(apiKey, { model: MODEL_SUMMARY, system, user: JSON.stringify(context), maxTokens: 700, signal })
}
