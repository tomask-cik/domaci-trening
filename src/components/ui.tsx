import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card p-4 ${className}`}>{children}</section>
}

export function CardTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-base font-semibold text-ink">{children}</h2>
      {right}
    </div>
  )
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variants: Record<BtnVariant, string> = {
  primary: 'bg-accent text-[#04121f] font-semibold active:brightness-90',
  secondary: 'bg-surface2 text-ink border border-line active:bg-line',
  ghost: 'bg-transparent text-muted border border-line active:bg-surface2',
  danger: 'bg-bad text-[#2a0505] font-semibold active:brightness-90',
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  className = '',
  type = 'button',
  'data-testid': testId,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: BtnVariant
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
  'data-testid'?: string
}) {
  return (
    <button
      type={type}
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
      className={`tap rounded-xl px-4 text-base ${variants[variant]} disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  )
}

export function Stat({ label, value, sub, tone = 'ink' }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'ink' | 'good' | 'warn' | 'bad' }) {
  const toneCls = tone === 'good' ? 'text-good' : tone === 'warn' ? 'text-warn' : tone === 'bad' ? 'text-bad' : 'text-ink'
  return (
    <div className="rounded-xl border border-line bg-surface2 p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className={`text-xl font-semibold ${toneCls}`}>{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-muted">{sub}</div> : null}
    </div>
  )
}

export function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = 100000,
  suffix,
  decimals = 0,
  testId,
}: {
  label: string
  value: number | null
  onChange: (v: number | null) => void
  step?: number
  min?: number
  max?: number
  suffix?: string
  decimals?: number
  testId?: string
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 10 ** decimals) / 10 ** decimals))
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          aria-label={`${label} menej`}
          className="tap w-14 shrink-0 rounded-xl border border-line bg-surface2 text-2xl active:bg-line"
          onClick={() => onChange(clamp((value ?? 0) - step))}
        >
          −
        </button>
        <input
          data-testid={testId}
          aria-label={label}
          inputMode="decimal"
          type="number"
          step={step}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : clamp(Number(e.target.value)))}
          className="tap min-w-0 flex-1 rounded-xl border border-line bg-surface2 px-3 text-center text-xl"
        />
        <button
          type="button"
          aria-label={`${label} viac`}
          className="tap w-14 shrink-0 rounded-xl border border-line bg-surface2 text-2xl active:bg-line"
          onClick={() => onChange(clamp((value ?? 0) + step))}
        >
          +
        </button>
      </div>
      {suffix ? <span className="mt-1 block text-xs text-muted">{suffix}</span> : null}
    </label>
  )
}

export function Banner({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'good'; children: ReactNode }) {
  const cls =
    tone === 'warn'
      ? 'border-warn/50 bg-warn/10 text-warn'
      : tone === 'good'
        ? 'border-good/50 bg-good/10 text-good'
        : 'border-accent/50 bg-accent/10 text-accent'
  return <div className={`rounded-xl border p-3 text-sm ${cls}`}>{children}</div>
}

export function Pill({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'good' | 'warn' | 'accent' }) {
  const cls =
    tone === 'good'
      ? 'bg-good/15 text-good'
      : tone === 'warn'
        ? 'bg-warn/15 text-warn'
        : tone === 'accent'
          ? 'bg-accent/15 text-accent'
          : 'bg-surface2 text-muted'
  return <span className={`rounded-full px-2 py-0.5 text-xs ${cls}`}>{children}</span>
}
