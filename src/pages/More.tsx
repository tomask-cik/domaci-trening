import { useEffect, useRef, useState } from 'react'
import { Banner, Button, Card, CardTitle, NumberField, Pill } from '../components/ui'
import { resetAll, triggerDeload, updateSettings } from '../db/actions'
import { importAll } from '../db/backup'
import { db } from '../db/db'
import { calorieFloor, mifflinStJeor, tdeeEstimate } from '../domain/calories'
import { KB_OPTIONS, SLEEP_SHORT_HOURS, SLEEP_SHORT_NIGHTS } from '../domain/constants'
import { addDays, formatSk, todayISO } from '../domain/dates'
import { shouldSuggestEarlyDeload, weekCalendar } from '../domain/deload'
import { proteinFor } from '../domain/protein'
import type { Settings } from '../domain/types'
import { currentWeightKg } from '../domain/weight'
import { useDays, useWeekReviews } from '../hooks/useAppData'
import { kcal, kg, signed } from '../lib/format'
import { BACKUP_MESSAGE, runBackup } from '../lib/backupFile'
import { backupOverdue, daysSinceBackup, isStoragePersisted } from '../lib/storage'
import { hasApiKey } from '../lib/claude'
import { DEFAULT_SHORTCUT_NAME, hasShortcutName } from '../domain/healthShortcut'

export default function More({ settings }: { settings: Settings }) {
  const today = todayISO()
  const days = useDays()
  const reviews = useWeekReviews()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [keyDraft, setKeyDraft] = useState('')
  const [shortcutDraft, setShortcutDraft] = useState<string | null>(null)

  useEffect(() => {
    void isStoragePersisted().then(setPersisted)
  }, [])

  if (!days || !reviews) return <div className="text-muted">Načítavam…</div>

  const current = currentWeightKg(days, today, settings.startWeightKg)
  const bmr = mifflinStJeor(settings.sex, current, settings.heightCm, settings.age)
  const tdee = tdeeEstimate(bmr, settings.activityFactor)
  const protein = proteinFor(settings)
  const calendar = weekCalendar(today, 10, settings)
  // Posledných 7 nocí (pôvodne sa filtrovalo `date >= dnes`, čiže vždy len dnešok a znak sa nikdy nespustil).
  const weekAgo = addDays(today, -6)
  const shortSleep = days.filter((d) => d.date >= weekAgo && d.date <= today && typeof d.sleepH === 'number' && d.sleepH < SLEEP_SHORT_HOURS).length
  const earlyDeload = shouldSuggestEarlyDeload({ repsDroppedTwice: false, jointPain: false, shortSleepNights: shortSleep >= SLEEP_SHORT_NIGHTS, highRpe: false })

  async function doExport() {
    const outcome = await runBackup(today)
    setMessage(BACKUP_MESSAGE[outcome])
    setError(null)
  }

  async function doImport(file: File) {
    try {
      const text = await file.text()
      const res = await importAll(db, JSON.parse(text))
      const total = Object.values(res.counts).reduce((a, b) => a + b, 0)
      setMessage(`Obnovených ${total} záznamov (${res.counts.days ?? 0} dní, ${res.counts.sets ?? 0} sérií).`)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import zlyhal.')
      setMessage(null)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Nastavenia a zálohy</h1>

      {message ? <Banner tone="good">{message}</Banner> : null}
      {error ? <Banner tone="warn">{error}</Banner> : null}

      <Card>
        <CardTitle>Ciele</CardTitle>
        <div className="space-y-3 text-sm">
          <Line label="Kalorický cieľ" value={kcal(settings.calorieTarget)} />
          <Line label={`Odhad výdaja (BMR × ${settings.activityFactor})`} value={kcal(tdee)} />
          <Line label="Podlaha (BMR × 1,1)" value={kcal(calorieFloor(bmr))} />
          <Line label="Bielkoviny" value={`${protein.gramsPerDay} g`} />
          <p className="text-xs text-muted">Základ: {protein.basis}. Cieľ sa upravuje raz týždenne podľa 7-dňového priemeru hmotnosti.</p>
        </div>
      </Card>

      <Card>
        <CardTitle right={earlyDeload ? <Pill tone="warn">zvážiť skôr</Pill> : undefined}>Deload kalendár</CardTitle>
        <ul className="space-y-1 text-sm">
          {calendar.map((w) => (
            <li key={w.weekStart} className={`flex justify-between rounded-lg px-3 py-2 ${w.deload ? 'bg-warn/10 text-warn' : 'bg-surface2'}`}>
              <span>
                Týždeň {w.index + 1} · {formatSk(w.weekStart)}
              </span>
              <span>{w.deload ? 'deload' : 'normálny'}</span>
            </li>
          ))}
        </ul>
        <Button
          variant="secondary"
          className="mt-3 w-full"
          onClick={() => {
            if (confirm('Spustiť deload v tomto týždni? Cyklus sa prepočíta od budúceho pondelka.')) void triggerDeload(today)
          }}
        >
          Spustiť deload teraz
        </Button>
        <p className="mt-2 text-xs text-muted">
          Deload je automaticky každý {settings.deloadEveryWeeks}. týždeň. Skôr ho spusti, ak platia aspoň dva znaky: pokles opakovaní v dvoch tréningoch, bolesť kĺbov, spánok pod 6 h viac než 3 noci, RPE 9–10 pri bežných sériách.
        </p>
      </Card>

      <Card>
        <CardTitle>Tréning</CardTitle>
        <div className="space-y-4">
          <div>
            <span className="mb-1 block text-sm text-muted">Dní za týždeň</span>
            <div className="flex gap-2">
              {([2, 3, 4] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => void updateSettings({ daysPerWeek: d })}
                  className={`tap flex-1 rounded-xl border text-base ${settings.daysPerWeek === d ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-surface2 text-muted'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1 block text-sm text-muted">Minút na tréning</span>
            <div className="flex gap-2">
              {([30, 45, 60] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => void updateSettings({ minutesPerSession: m })}
                  className={`tap flex-1 rounded-xl border text-base ${settings.minutesPerSession === m ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-surface2 text-muted'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1 block text-sm text-muted">Kettlebelly</span>
            <div className="flex flex-wrap gap-2">
              {KB_OPTIONS.map((k) => {
                const on = settings.kettlebells.includes(k)
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() =>
                      void updateSettings({
                        kettlebells: on ? settings.kettlebells.filter((x) => x !== k) : [...settings.kettlebells, k].sort((a, b) => a - b),
                      })
                    }
                    className={`tap min-w-[4.5rem] rounded-xl border px-3 ${on ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-surface2 text-muted'}`}
                  >
                    {k} kg
                  </button>
                )
              })}
            </div>
          </div>
          <NumberField label="Cieľ krokov" value={settings.stepsGoal} onChange={(v) => void updateSettings({ stepsGoal: v ?? 9000 })} step={500} min={2000} max={25000} />
          <NumberField label="Cieľová hmotnosť (kg)" value={settings.targetWeightKg} onChange={(v) => void updateSettings({ targetWeightKg: v ?? 85 })} step={0.5} decimals={1} min={40} max={200} />
          <NumberField
            label="Telesný tuk (%) – ak si ho premeral"
            value={settings.bodyFatPct}
            onChange={(v) => void updateSettings({ bodyFatPct: v ?? null, bodyFatRefKg: v === null ? undefined : current })}
            min={0}
            max={70}
            suffix={
              settings.bodyFatPct !== null
                ? `Meranie pri ${kg(settings.bodyFatRefKg ?? settings.startWeightKg)} – bielkoviny sa počítajú z čistej hmoty pri tejto hmotnosti.`
                : 'Prázdne = bielkoviny 2,0 g/kg cieľovej hmotnosti. Po zadaní sa uloží aj aktuálna hmotnosť ako referencia.'
            }
          />
        </div>
      </Card>

      <Card>
        <CardTitle>História vyhodnotení</CardTitle>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted">Prvé vyhodnotenie príde po uzavretí týždňa.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {[...reviews].reverse().slice(0, 8).map((r) => (
              <li key={r.weekStart} className="rounded-lg bg-surface2 p-3">
                <div className="flex justify-between">
                  <span>Týždeň od {formatSk(r.weekStart)}</span>
                  <span className={r.newTarget === r.oldTarget ? 'text-muted' : r.newTarget > r.oldTarget ? 'text-good' : 'text-warn'}>
                    {r.newTarget === r.oldTarget ? 'bez zmeny' : `${signed(r.newTarget - r.oldTarget, 0)} kcal`}
                  </span>
                </div>
                <div className="mt-1 text-xs text-muted">
                  {r.avgPrev !== null && r.avgThis !== null ? `${kg(r.avgPrev)} → ${kg(r.avgThis)}. ` : ''}
                  {r.reason}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle
          right={
            backupOverdue(settings.lastBackupAt) ? <Pill tone="warn">treba zálohu</Pill> : <Pill tone="good">zálohované</Pill>
          }
        >
          Záloha
        </CardTitle>
        {backupOverdue(settings.lastBackupAt) ? (
          <Banner tone="warn">
            {settings.lastBackupAt
              ? `Posledná záloha pred ${String(daysSinceBackup(settings.lastBackupAt))} dňami. Sťahuj si ju aspoň raz za dva týždne.`
              : 'Ešte si nikdy nezálohoval. Všetky dáta sú len v tomto telefóne – ak ho stratíš, stratíš aj históriu.'}
          </Banner>
        ) : (
          <p className="mb-2 text-xs text-muted">Posledná záloha pred {String(daysSinceBackup(settings.lastBackupAt))} dňami.</p>
        )}
        {persisted === false ? (
          <Banner tone="warn">
            Prehliadač zatiaľ nesľúbil, že dáta nezmaže. Pomôže pridať appku na plochu a chvíľu ju používať – potom sa to zvyčajne prepne samo.
          </Banner>
        ) : null}
        <div className="mt-2 space-y-2">
          <Button variant="secondary" className="w-full" onClick={() => void doExport()} data-testid="export">
            Zálohovať (JSON do iCloud / stiahnuť)
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            data-testid="import-file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void doImport(f)
              e.target.value = ''
            }}
          />
          <Button variant="secondary" className="w-full" onClick={() => fileRef.current?.click()}>
            Importovať zálohu
          </Button>
          <p className="text-xs text-muted">
            Na iPhone sa otvorí zdieľanie – vyber „Uložiť do Súborov“ a iCloud Drive. Import prepíše všetky dáta v telefóne. API kľúč sa do zálohy nedáva, po obnove ho zadaj znova.
          </p>
        </div>
      </Card>

      <Card>
        <CardTitle right={hasApiKey(settings.anthropicApiKey) ? <Pill tone="good">nastavený</Pill> : <Pill>chýba</Pill>}>
          Odhad kalórií cez AI
        </CardTitle>
        <p className="mb-2 text-sm text-muted">
          Napíšeš názov jedla a gramáž, Claude odhadne kalórie a bielkoviny. Potrebuje tvoj vlastný API kľúč z console.anthropic.com. Kľúč sa uloží len do tohto telefónu,
          nikdy nejde do repozitára – nikam ho nekopíruj do kódu.
        </p>
        <input
          type="password"
          value={keyDraft}
          onChange={(e) => setKeyDraft(e.target.value)}
          placeholder={hasApiKey(settings.anthropicApiKey) ? 'kľúč je uložený – sem vlož nový' : 'sk-ant-...'}
          autoComplete="off"
          data-testid="api-key"
          className="tap w-full rounded-xl border border-line bg-surface2 px-3 text-base"
        />
        <div className="mt-2 flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={keyDraft.trim().length < 20}
            onClick={() => {
              void updateSettings({ anthropicApiKey: keyDraft.trim() })
              setKeyDraft('')
              setMessage('Kľúč uložený.')
            }}
          >
            Uložiť kľúč
          </Button>
          {hasApiKey(settings.anthropicApiKey) ? (
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => {
                void updateSettings({ anthropicApiKey: undefined })
                setMessage('Kľúč zmazaný.')
              }}
            >
              Zmazať kľúč
            </Button>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-muted">
          Odhady sú orientačné – vychádzajú z typických hodnôt, nie z obalu tvojho konkrétneho výrobku. Pri baleniach je presnejšie opísať údaj z etikety.
        </p>
      </Card>

      <Card>
        <CardTitle right={hasShortcutName(settings.healthShortcutName) ? <Pill tone="good">nastavené</Pill> : <Pill>chýba</Pill>}>Apple Health (Skratky)</CardTitle>
        <p className="mb-2 text-sm text-muted">
          Po tréningu appka spustí Skratku s ID tréningu a oknom štart–koniec; Skratka prečíta z Health aktívnu energiu a priemerný tep a vráti ich
          do appky. Návod na vytvorenie Skratky je v README (sekcia Apple Health). Sem napíš jej presný názov.
        </p>
        <div className="flex gap-2">
          <input
            value={shortcutDraft ?? settings.healthShortcutName ?? ''}
            onChange={(e) => setShortcutDraft(e.target.value)}
            placeholder={DEFAULT_SHORTCUT_NAME}
            aria-label="Názov Skratky"
            data-testid="shortcut-name"
            className="tap min-w-0 flex-1 rounded-xl border border-line bg-surface2 px-3 text-base"
          />
          <Button
            variant="secondary"
            className="px-3"
            disabled={shortcutDraft === null}
            onClick={() => {
              const v = (shortcutDraft ?? '').trim()
              void updateSettings({ healthShortcutName: v || undefined })
              setShortcutDraft(null)
              setMessage(v ? `Skratka „${v}“ uložená.` : 'Názov Skratky zmazaný.')
            }}
          >
            Uložiť
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted">
          Kroky a aktivity (beh, chôdza) vie Skratka posielať aj sama cez adresu `?hk=steps&steps=…` alebo `?hk=activity&…`. Keď návrat zo Skratky otvorí
          Safari namiesto appky na ploche, použi „Vložiť zo schránky“ pri tréningu.
        </p>
      </Card>

      <Card>
        <CardTitle>Program</CardTitle>
        <p className="text-sm text-muted">
          Pravidlá tejto appky vychádzajú z dokumentov <b>RESEARCH.md</b> (dôkazy) a <b>PROGRAM.md</b> (program) v repozitári. Hlavné čísla: deficit ~500 kcal, tempo 0,5–0,7 %
          hmotnosti za týždeň, bielkoviny {protein.gramsPerDay} g, 10–14 sérií na partiu za týždeň, 1–3 opakovania v rezerve, kroky {settings.stepsGoal}, deload každý{' '}
          {settings.deloadEveryWeeks}. týždeň.
        </p>
        <p className="mt-2 text-xs text-muted">Štart programu: {formatSk(settings.programStartDate)} pri {kg(settings.startWeightKg)}.</p>
      </Card>

      <Button
        variant="danger"
        className="w-full"
        onClick={() => {
          if (confirm('Naozaj zmazať všetky dáta a začať odznova? Najprv si sprav export.')) void resetAll()
        }}
      >
        Zmazať všetky dáta
      </Button>
      <div className="h-2" />
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-line pb-2 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
