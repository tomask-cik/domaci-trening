import { lazy, Suspense, useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { applyHealthImport, applyPendingReviews, ensureExerciseStates } from './db/actions'
import { useSettings } from './hooks/useAppData'
import { primeAudio } from './lib/sound'
import { requestPersistentStorage } from './lib/storage'
import { describeImport, parseHealthParams } from './domain/healthImport'
import { todayISO } from './domain/dates'
// Grafy (Recharts) sú najväčšia časť bundle – načítajú sa až pri otvorení záložky Telo.
const Body = lazy(() => import('./pages/Body'))
import Food from './pages/Food'
import History from './pages/History'
import Library from './pages/Library'
import Mobility from './pages/Mobility'
import More from './pages/More'
import Setup from './pages/Setup'
import Today from './pages/Today'
import Workout from './pages/Workout'

const NAV = [
  { to: '/dnes', label: 'Dnes', icon: '📅' },
  { to: '/mobilita', label: 'Mobilita', icon: '🧘' },
  { to: '/telo', label: 'Telo', icon: '📈' },
  { to: '/historia', label: 'História', icon: '🏆' },
  { to: '/cviky', label: 'Cviky', icon: '📚' },
  { to: '/viac', label: 'Viac', icon: '⚙️' },
]

export default function App() {
  const settings = useSettings()
  const location = useLocation()

  const [imported, setImported] = useState<string | null>(null)

  useEffect(() => {
    // Požiada prehliadač, aby IndexedDB nemazal (Safari inak vie úložisko vyhodiť).
    void requestPersistentStorage()
  }, [])

  useEffect(() => {
    // Dáta z Apple Health prichádzajú od Skratky v adrese. Po zápise adresu vyčistíme,
    // aby sa import nezopakoval pri obnovení stránky.
    const found = parseHealthParams(window.location.search, todayISO())
    if (!found) return
    void applyHealthImport(found).then((ok) => {
      setImported(ok ? describeImport(found) : 'Import sa netýkal žiadneho záznamu.')
      const url = new URL(window.location.href)
      url.search = ''
      window.history.replaceState({}, '', url.toString())
      setTimeout(() => setImported(null), 6000)
    })
  }, [])

  useEffect(() => {
    const unlock = () => primeAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  useEffect(() => {
    if (!settings) return
    void ensureExerciseStates(settings)
    void applyPendingReviews()
  }, [settings])

  if (settings === undefined) {
    return <div className="p-6 text-muted">Načítavam…</div>
  }
  if (settings === null) {
    return (
      <main className="safe-top safe-x mx-auto max-w-lg pb-10">
        <Setup />
      </main>
    )
  }

  const hideNav = location.pathname.startsWith('/trening')

  return (
    <div className="min-h-dvh">
      <main className={`safe-top safe-x mx-auto max-w-lg ${hideNav ? 'pb-6' : 'pb-32'}`}>
        {imported ? (
          <div className="mb-3 rounded-xl border border-good/50 bg-good/10 px-3 py-2 text-sm text-good">{imported}</div>
        ) : null}
        <Routes>
          <Route path="/" element={<Navigate to="/dnes" replace />} />
          <Route path="/dnes" element={<Today settings={settings} />} />
          <Route path="/trening" element={<Workout settings={settings} />} />
          <Route path="/mobilita" element={<Mobility />} />
          <Route
            path="/telo"
            element={
              <Suspense fallback={<div className="text-muted">Načítavam grafy…</div>}>
                <Body settings={settings} />
              </Suspense>
            }
          />
          <Route path="/historia" element={<History settings={settings} />} />
          <Route path="/jedlo" element={<Food settings={settings} />} />
          <Route path="/cviky" element={<Library settings={settings} />} />
          <Route path="/viac" element={<More settings={settings} />} />
          <Route path="*" element={<Navigate to="/dnes" replace />} />
        </Routes>
      </main>
      {!hideNav && (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur">
          <ul className="mx-auto flex max-w-lg">
            {NAV.map((n) => (
              <li key={n.to} className="flex-1">
                <NavLink
                  to={n.to}
                  className={({ isActive }) =>
                    `flex h-[4.25rem] flex-col items-center justify-center gap-0.5 text-xs ${isActive ? 'text-accent' : 'text-muted'}`
                  }
                >
                  <span aria-hidden className="text-xl leading-none">
                    {n.icon}
                  </span>
                  {n.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}
