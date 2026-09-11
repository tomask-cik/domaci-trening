import { useState } from 'react'
import { saveSetup } from '../db/actions'
import { initialCalorieTarget, mifflinStJeor } from '../domain/calories'
import { DEFAULTS, STEPS_START } from '../domain/constants'
import { proteinTarget } from '../domain/protein'
import { Banner, Button, Card, CardTitle, NumberField } from '../components/ui'
import { kcal } from '../lib/format'

const KB_OPTIONS = [8, 10, 12, 16, 20, 24, 28, 32]

export default function Setup() {
  const [age, setAge] = useState<number | null>(DEFAULTS.age)
  const [heightCm, setHeight] = useState<number | null>(DEFAULTS.heightCm)
  const [weight, setWeight] = useState<number | null>(DEFAULTS.startWeightKg)
  const [target, setTarget] = useState<number | null>(DEFAULTS.targetWeightKg)
  const [bodyFat, setBodyFat] = useState<number | null>(null)
  const [kbs, setKbs] = useState<number[]>(DEFAULTS.kettlebells)
  const [hasBand, setHasBand] = useState(true)
  const [hasMat, setHasMat] = useState(true)
  const [days, setDays] = useState<2 | 3 | 4>(DEFAULTS.daysPerWeek)
  const [minutes, setMinutes] = useState<30 | 45 | 60>(DEFAULTS.minutesPerSession)
  const [steps, setSteps] = useState<number | null>(STEPS_START)
  const [saving, setSaving] = useState(false)

  const valid =
    age !== null && age >= 14 && heightCm !== null && heightCm >= 120 && weight !== null && weight >= 35 && target !== null && target >= 35 && kbs.length > 0

  const bmr = valid ? mifflinStJeor('m', weight, heightCm, age) : 0
  const startTarget = valid ? initialCalorieTarget(bmr) : 0
  const protein = valid ? proteinTarget({ targetWeightKg: target, referenceWeightKg: weight, bodyFatPct: bodyFat }) : null

  async function submit() {
    if (!valid || saving) return
    setSaving(true)
    await saveSetup({
      sex: 'm',
      age,
      heightCm,
      startWeightKg: weight,
      targetWeightKg: target,
      bodyFatPct: bodyFat,
      kettlebells: kbs,
      hasBand,
      hasMat,
      daysPerWeek: days,
      minutesPerSession: minutes,
      stepsStart: steps ?? STEPS_START,
    })
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Domáci tréning</h1>
        <p className="mt-1 text-sm text-muted">Nastav pár údajov. Všetko sa dá neskôr zmeniť v časti Viac.</p>
      </header>

      <Card>
        <CardTitle>O tebe</CardTitle>
        <div className="space-y-4">
          <NumberField label="Vek" value={age} onChange={setAge} min={14} max={99} testId="setup-age" />
          <NumberField label="Výška (cm)" value={heightCm} onChange={setHeight} min={120} max={230} testId="setup-height" />
          <NumberField label="Hmotnosť teraz (kg)" value={weight} onChange={setWeight} step={0.5} decimals={1} min={35} max={300} testId="setup-weight" />
          <NumberField label="Cieľová hmotnosť (kg)" value={target} onChange={setTarget} step={0.5} decimals={1} min={35} max={300} testId="setup-target" />
          <NumberField
            label="Telesný tuk (%) – voliteľné"
            value={bodyFat}
            onChange={setBodyFat}
            min={0}
            max={70}
            suffix="Ak ho nevieš, nechaj prázdne. Bielkoviny sa potom počítajú z cieľovej hmotnosti."
          />
        </div>
      </Card>

      <Card>
        <CardTitle>Vybavenie</CardTitle>
        <p className="mb-2 text-sm text-muted">Vyber kettlebelly, ktoré máš doma.</p>
        <div className="flex flex-wrap gap-2">
          {KB_OPTIONS.map((k) => {
            const on = kbs.includes(k)
            return (
              <button
                key={k}
                type="button"
                data-testid={`kb-${k}`}
                onClick={() => setKbs((cur) => (on ? cur.filter((x) => x !== k) : [...cur, k].sort((a, b) => a - b)))}
                className={`tap min-w-[4.5rem] rounded-xl border px-3 text-base ${on ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-surface2 text-muted'}`}
              >
                {k} kg
              </button>
            )
          })}
        </div>
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={hasBand} onChange={(e) => setHasBand(e.target.checked)} className="size-5 accent-[#38bdf8]" />
            Mám odporovú gumu (pomáha pri zhyboch a dipoch)
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={hasMat} onChange={(e) => setHasMat(e.target.checked)} className="size-5 accent-[#38bdf8]" />
            Mám podložku
          </label>
          <p className="text-xs text-muted">Hrazda a bradlá sa predpokladajú. Ak niečo chýba, v knižnici cvikov je pri každom cviku náhrada.</p>
        </div>
      </Card>

      <Card>
        <CardTitle>Čas</CardTitle>
        <div className="space-y-4">
          <div>
            <span className="mb-1 block text-sm text-muted">Silových tréningov za týždeň</span>
            <div className="flex gap-2">
              {([2, 3, 4] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  data-testid={`days-${d}`}
                  onClick={() => setDays(d)}
                  className={`tap flex-1 rounded-xl border text-base ${days === d ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-surface2 text-muted'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1 block text-sm text-muted">Minút na jeden tréning</span>
            <div className="flex gap-2">
              {([30, 45, 60] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  data-testid={`minutes-${m}`}
                  onClick={() => setMinutes(m)}
                  className={`tap flex-1 rounded-xl border text-base ${minutes === m ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-surface2 text-muted'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <NumberField label="Kroky denne teraz (odhad)" value={steps} onChange={setSteps} step={500} min={0} max={40000} suffix="Cieľ rastie o 500 každý týždeň až po 9 000." />
        </div>
      </Card>

      {valid && protein ? (
        <Banner tone="info">
          Štart: <b>{kcal(startTarget)}</b> denne a <b>{protein.gramsPerDay} g bielkovín</b>. Cieľ sa každý týždeň upraví podľa skutočného trendu hmotnosti – prvé číslo je len odhad.
        </Banner>
      ) : (
        <Banner tone="warn">Vyplň vek, výšku, hmotnosti a vyber aspoň jeden kettlebell.</Banner>
      )}

      <Button className="w-full" onClick={submit} disabled={!valid || saving} data-testid="setup-submit">
        {saving ? 'Ukladám…' : 'Uložiť a začať'}
      </Button>
      <p className="pb-4 text-center text-xs text-muted">Dáta zostávajú v telefóne. Zálohu si vyexportuješ v časti Viac.</p>
    </div>
  )
}
