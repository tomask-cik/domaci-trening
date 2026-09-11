export function kg(x: number | null | undefined, digits = 1): string {
  return x === null || x === undefined ? '—' : `${x.toFixed(digits).replace('.', ',')} kg`
}

export function num(x: number | null | undefined, digits = 0): string {
  return x === null || x === undefined ? '—' : x.toFixed(digits).replace('.', ',')
}

export function kcal(x: number | null | undefined): string {
  return x === null || x === undefined ? '—' : `${Math.round(x)} kcal`
}

export function signed(x: number, digits = 1): string {
  const s = x.toFixed(digits).replace('.', ',')
  return x > 0 ? `+${s}` : s
}

export function mmss(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function steps(x: number | null | undefined): string {
  return x === null || x === undefined ? '—' : x.toLocaleString('sk-SK')
}
