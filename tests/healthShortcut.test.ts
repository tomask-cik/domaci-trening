import { describe, expect, it } from 'vitest'
import { appBaseUrl, hasShortcutName, shortcutRunUrl, workoutShortcutUrl, workoutWindowPayload } from '../src/domain/healthShortcut'
import { parseHealthText } from '../src/domain/healthImport'

describe('odovzdanie tréningu Skratke', () => {
  it('základ adresy je origin + cesta, bez hash a parametrov', () => {
    expect(appBaseUrl('https://tomask-cik.github.io/domaci-trening/?hk=steps#/dnes')).toBe('https://tomask-cik.github.io/domaci-trening/')
    expect(appBaseUrl('http://localhost:4173/#/trening?id=3')).toBe('http://localhost:4173/')
  })
  it('payload má id, okno a návratovú adresu s id', () => {
    const p = workoutWindowPayload({ id: 17, startedAt: '2026-09-15T16:00:00.000Z', finishedAt: '2026-09-15T16:45:00.000Z' }, 'https://x.y/app/', '2026-09-15T17:00:00.000Z')
    expect(p).toEqual({ id: 17, start: '2026-09-15T16:00:00.000Z', end: '2026-09-15T16:45:00.000Z', return: 'https://x.y/app/?hk=workout&id=17' })
  })
  it('nedokončený tréning končí „teraz“, bez id nie je payload', () => {
    expect(workoutWindowPayload({ id: 3, startedAt: 'a' }, 'u/', 'NOW')?.end).toBe('NOW')
    expect(workoutWindowPayload({ startedAt: 'a' }, 'u/', 'NOW')).toBeNull()
  })
  it('adresa skratky kóduje názov aj text', () => {
    const url = shortcutRunUrl('Tréning do appky', '{"id":1}')
    expect(url).toBe('shortcuts://run-shortcut?name=Tr%C3%A9ning%20do%20appky&input=text&text=%7B%22id%22%3A1%7D')
    const p = workoutWindowPayload({ id: 1, startedAt: 's', finishedAt: 'e' }, 'u/', 'n')!
    const full = workoutShortcutUrl(' X ', p)
    expect(full.startsWith('shortcuts://run-shortcut?name=X&input=text&text=')).toBe(true)
    expect(JSON.parse(decodeURIComponent(full.split('&text=')[1] as string))).toEqual(p)
  })
  it('hasShortcutName', () => {
    expect(hasShortcutName(undefined)).toBe(false)
    expect(hasShortcutName('  ')).toBe(false)
    expect(hasShortcutName('A')).toBe(true)
  })
})

describe('import z textu v schránke', () => {
  it('celá adresa aj holé parametre', () => {
    expect(parseHealthText('https://tomask-cik.github.io/domaci-trening/?hk=workout&id=17&kcal=380&hr=132', '2026-09-15')).toEqual({ kind: 'workout', workoutId: 17, kcal: 380, avgHr: 132 })
    expect(parseHealthText('hk=steps&steps=8432', '2026-09-15')).toEqual({ kind: 'steps', date: '2026-09-15', steps: 8432 })
    expect(parseHealthText('?hk=steps&steps=100', '2026-09-15')).toEqual({ kind: 'steps', date: '2026-09-15', steps: 100 })
  })
  it('prázdny alebo cudzí text nič nevráti', () => {
    expect(parseHealthText('', '2026-09-15')).toBeNull()
    expect(parseHealthText('ahoj', '2026-09-15')).toBeNull()
    expect(parseHealthText('https://[neplatna', '2026-09-15')).toBeNull()
  })
})
