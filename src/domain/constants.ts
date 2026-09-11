/**
 * Všetky čísla programu na jednom mieste. Každá konštanta odkazuje na PROGRAM.md / RESEARCH.md.
 */

// --- Progresia (PROGRAM.md 1.3, RESEARCH R4) ---
export const RPE_PROGRESS_MAX = 8.5 // priemerné RPE ≤ 8,5 (≥1,5 RIR) => môžeš pridať
export const RPE_FAILURE = 9.5 // RPE ≥ 9,5 = zlyhanie => drž
export const FAIL_STREAK_TO_REGRESS = 2 // 2 tréningy pod `lo` => ustúp
export const TOP_STREAK_TO_STAGE_UP = 2 // 2 tréningy na `hi` => ďalšie štádium
export const REGRESS_REPS_BELOW_HI = 3 // po ústupe cieľ = hi − 3
export const STAGE_DOWN_BELOW_HI = 2 // po ústupe štádia cieľ = hi − 2
export const TIMED_INCREMENT_SEC = 5 // výdrže: +5 s
export const PAIN_REGRESS_ABOVE = 3 // bolesť > 3/10 => regresia (RESEARCH R12)
export const PAIN_SKIP_ABOVE = 5 // bolesť > 5/10 => vynechať cvik

// --- Deload (PROGRAM.md 5, RESEARCH R11) ---
export const DELOAD_EVERY_WEEKS = 7 // 6 týždňov práce + 1 ľahký
export const DELOAD_SET_REDUCTION = 1 // 3 → 2 série
export const DELOAD_MIN_SETS = 2
export const DELOAD_REP_REDUCTION = 2 // cieľ −2 opakovania
export const EARLY_DELOAD_SIGNALS_NEEDED = 2 // 2 zo 4 znakov

// --- Tréning (PROGRAM.md 1.1–1.2, RESEARCH R3) ---
export const DEFAULT_SETS = 3
export const LONG_SESSION_SETS = 4 // pri 60 min na dvojice 1–2
export const LONG_SESSION_MINUTES = 60
export const SHORT_SESSION_MINUTES = 30 // pri ≤30 min vypadne dvojica 3 a 4
export const REST_MAIN_SEC = 90
export const REST_SMALL_SEC = 60
export const WARMUP_MINUTES = 5

// --- Chudnutie a kalórie (PROGRAM.md 7, RESEARCH R1, R10) ---
export const DEFICIT_KCAL = 500
export const ACTIVITY_FACTOR = 1.4
export const RATE_MIN_PCT = 0.005 // 0,5 % hmotnosti/týždeň
export const RATE_MAX_PCT = 0.007 // 0,7 % hmotnosti/týždeň
export const KCAL_PER_KG = 7700
export const MAX_WEEKLY_ADJUST_KCAL = 150
export const CALORIE_FLOOR_ABS = 1500
export const CALORIE_FLOOR_BMR_FACTOR = 1.1
export const MIN_DAYS_BEFORE_ADAPT = 14
export const MIN_WEIGHINS_PER_WEEK = 3
export const MAINTENANCE_AFTER_WEEKS = 8 // po ~8 týždňoch deficitu udržiavací týždeň
export const SLEEP_SHORT_HOURS = 6
export const SLEEP_SHORT_NIGHTS = 3
export const SLEEP_KCAL_BONUS = 150

// --- Bielkoviny (PROGRAM.md 7, RESEARCH R2) ---
export const PROTEIN_PER_KG_TARGET = 2.0
export const PROTEIN_PER_KG_FFM = 2.3
export const PROTEIN_MIN_PER_KG_TARGET = 1.6
export const PROTEIN_MAX_PER_KG_TARGET = 2.4
export const DEFAULT_BODY_FAT_PCT = 30
export const PROTEIN_MEALS = 4

// --- Hmotnosť (RESEARCH R10) ---
export const MA_WINDOW_DAYS = 7
export const MA_MIN_POINTS = 3

// --- Fázy programu (PROGRAM.md 6, DECISIONS B10) ---
export const PHASE_THRESHOLDS = [0.4, 0.75] as const // podiel cesty 105→85

// --- Kroky (PROGRAM.md 4, RESEARCH R6) ---
export const STEPS_START = 6000
export const STEPS_GOAL = 9000
export const STEPS_INCREMENT_PER_WEEK = 500

// --- Sedenie (PROGRAM.md 3, RESEARCH R7) ---
export const BREAK_INTERVAL_MIN = 40

// --- Predvolené hodnoty úvodného nastavenia (DECISIONS A1–A5) ---
export const DEFAULTS = {
  age: 35,
  heightCm: 180,
  startWeightKg: 105,
  targetWeightKg: 85,
  kettlebells: [12, 16, 24],
  hasBand: true,
  hasMat: true,
  daysPerWeek: 3 as 2 | 3 | 4,
  minutesPerSession: 45 as 30 | 45 | 60,
}
