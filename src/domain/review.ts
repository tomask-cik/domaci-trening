import { adaptCalorieTarget, mifflinStJeor, tdeeEstimate } from './calories'
import { MIN_DAYS_BEFORE_ADAPT, MIN_WEIGHINS_PER_WEEK, SLEEP_KCAL_BONUS, SLEEP_SHORT_HOURS, SLEEP_SHORT_NIGHTS } from './constants'
import { addDays, diffDays, weekStart } from './dates'
import { isDeloadWeek } from './deload'
import type { DayLog, Settings, WeekReview } from './types'
import { weeklyRate, weightPoints } from './weight'

export { weightPoints }

/** Týždne (pondelky), ktoré sú už celé za nami a ešte nemajú vyhodnotenie. */
export function pendingReviewWeeks(settings: Settings, existing: WeekReview[], today: string): string[] {
  const done = new Set(existing.map((r) => r.weekStart))
  const out: string[] = []
  let ws = weekStart(settings.programStartDate)
  const thisWeek = weekStart(today)
  while (ws < thisWeek) {
    if (!done.has(ws)) out.push(ws)
    ws = addDays(ws, 7)
  }
  return out
}

/**
 * Vyhodnotenie jedného uzavretého týždňa (PROGRAM.md 7, RESEARCH R10).
 * Vracia záznam aj nový cieľ; cieľ sa nemení, ak chýbajú dáta alebo je príliš skoro (< 14 dní).
 */
export function computeWeeklyReview(settings: Settings, days: DayLog[], weekStartISO: string, now: string): WeekReview {
  const points = weightPoints(days)
  const rate = weeklyRate(points, weekStartISO, MIN_WEIGHINS_PER_WEEK)
  const weekEnd = addDays(weekStartISO, 6)
  const base: WeekReview = {
    weekStart: weekStartISO,
    avgThis: rate.avgThis,
    avgPrev: rate.avgPrev,
    rateKgPerWeek: rate.rateKgPerWeek,
    oldTarget: settings.calorieTarget,
    newTarget: settings.calorieTarget,
    reason: '',
    createdAt: now,
  }
  if (diffDays(settings.programStartDate, weekEnd) + 1 < MIN_DAYS_BEFORE_ADAPT) {
    return { ...base, reason: `Prvé ${MIN_DAYS_BEFORE_ADAPT} dní sa cieľ nemení – zbierame dáta.` }
  }
  // V deloade sa je na udržiavacej úrovni (PROGRAM.md 5), takže hmotnosť zámerne nejde dole.
  // Keby sme z toho počítali, cieľ by sme znížili za správne dodržaný plán.
  if (isDeloadWeek(weekStartISO, settings)) {
    return { ...base, reason: 'Deload / udržiavací týždeň – hmotnosť zámerne nejde dole, cieľ sa nemení.' }
  }
  if (rate.avgThis === null || rate.avgPrev === null || rate.rateKgPerWeek === null) {
    return { ...base, reason: `Málo vážení (treba aspoň ${MIN_WEIGHINS_PER_WEEK} v každom z dvoch týždňov) – cieľ bez zmeny.` }
  }
  const weightNow = rate.avgThis
  const bmr = mifflinStJeor(settings.sex, weightNow, settings.heightCm, settings.age)
  const tdee = tdeeEstimate(bmr, settings.activityFactor)
  const weekDays = days.filter((d) => d.date >= weekStartISO && d.date <= weekEnd)
  const kcals = weekDays.map((d) => d.kcal).filter((k): k is number => typeof k === 'number' && k > 0)
  const avgIntake = kcals.length >= 4 ? kcals.reduce((a, b) => a + b, 0) / kcals.length : null
  const res = adaptCalorieTarget({ currentTarget: settings.calorieTarget, weightKg: weightNow, rateKgPerWeek: rate.rateKgPerWeek, bmr, tdee, avgIntakeKcal: avgIntake })

  let newTarget = res.newTarget
  let reason = res.reason
  const shortNights = weekDays.filter((d) => typeof d.sleepH === 'number' && d.sleepH < SLEEP_SHORT_HOURS).length
  if (shortNights >= SLEEP_SHORT_NIGHTS) {
    newTarget = Math.min(tdee, newTarget + SLEEP_KCAL_BONUS)
    reason += ` Spánok < ${SLEEP_SHORT_HOURS} h v ${shortNights} nociach → +${SLEEP_KCAL_BONUS} kcal a menší objem, nie záťaž (RESEARCH R11).`
  }
  return { ...base, newTarget, reason: reason.trim() }
}
