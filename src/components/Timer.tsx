import { mmss } from '../lib/format'
import { Button } from './ui'

export function TimerBar({
  label,
  left,
  total,
  running,
  onStop,
  onAdd,
}: {
  label: string
  left: number
  total: number
  running: boolean
  onStop: () => void
  onAdd: (s: number) => void
}) {
  if (!running) return null
  const pct = total > 0 ? Math.max(0, Math.min(100, (left / total) * 100)) : 0
  return (
    <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] z-20 mx-auto max-w-lg px-3">
      <div className="card overflow-hidden p-3 shadow-lg shadow-black/40">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-muted">{label}</span>
          <span className="font-mono text-2xl font-semibold text-accent" data-testid="timer-left">
            {mmss(left)}
          </span>
        </div>
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface2">
          <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => onAdd(30)}>
            +30 s
          </Button>
          <Button variant="ghost" className="flex-1" onClick={onStop} data-testid="timer-skip">
            Preskočiť
          </Button>
        </div>
      </div>
    </div>
  )
}
