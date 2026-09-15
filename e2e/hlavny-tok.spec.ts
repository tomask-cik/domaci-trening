import { expect, test, type Page } from '@playwright/test'

/**
 * Hlavný tok podľa zadania: nastavenie → tréning → zápis sérií → návrh progresie → zápis hmotnosti.
 * Beží proti produkčnému buildu (`vite preview`), teda vrátane service workera.
 */

/** Zapne/vypne kettlebell bez ohľadu na predvolený stav. */
async function setKb(page: Page, weight: number, on: boolean) {
  const chip = page.getByTestId(`kb-${weight}`)
  const isOn = ((await chip.getAttribute('class')) ?? '').includes('border-accent')
  if (isOn !== on) await chip.click()
  await expect(chip).toHaveClass(on ? /border-accent/ : /border-line/)
}

// Každý test má vlastný kontext prehliadača, takže IndexedDB začína prázdna.
async function setup(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Domáci tréning' })).toBeVisible()

  await page.getByTestId('setup-age').fill('35')
  await page.getByTestId('setup-height').fill('180')
  await page.getByTestId('setup-weight').fill('105')
  await page.getByTestId('setup-target').fill('85')
  for (const w of [8, 10, 20, 28, 32]) await setKb(page, w, false)
  for (const w of [12, 16, 24]) await setKb(page, w, true)
  await page.getByTestId('days-3').click()
  await page.getByTestId('minutes-45').click()
  await page.getByTestId('setup-submit').click()
  await expect(page.getByTestId('start-workout')).toBeVisible()
}

test('nastavenie → tréning → zápis sérií → návrh progresie → zápis hmotnosti', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(e.message))

  await setup(page)

  // Dashboard ukazuje ciele z programu.
  await expect(page.getByText('2310 kcal')).toBeVisible()
  await expect(page.getByText('170 g')).toBeVisible()
  await expect(page.getByText('Tréning A – drep, zhyby, hinge, kliky')).toBeVisible()

  // Tréning A
  await page.getByTestId('start-workout').click()
  await expect(page.getByRole('heading', { name: /Tréning A/ })).toBeVisible()

  // Goblet drep: odporúčanie z programu = 16 kg × 6 op. (najťažší KB ≤ 16, dolná hranica rozpätia)
  const squat = page.locator('section', { hasText: 'Goblet drep' }).first()
  await expect(squat.getByText('16 kg × 6 op.')).toBeVisible()

  // Tri série presne na cieľ s RPE 8 → pravidlo 1 (+1 opakovanie)
  for (let i = 1; i <= 3; i++) {
    await squat.getByTestId('set-amount').fill('6')
    await squat.getByTestId('rpe-8').click()
    await squat.getByTestId('log-set').click()
    await expect(squat.getByText(`Séria ${i}: 16 kg × 6 op.`)).toBeVisible()
    if (i < 3) {
      await expect(page.getByTestId('timer-left')).toBeVisible()
      await page.getByTestId('timer-skip').click()
    }
  }
  await expect(squat.getByText('Hotovo ✓')).toBeVisible()

  // Zhyby: štádium 1 = pasívny vis 20 s
  const pullups = page.locator('section', { hasText: 'Progresia zhybu' }).first()
  await expect(pullups.getByText('20 s')).toBeVisible()
  await expect(pullups.getByText(/Štádium 1\/6/)).toBeVisible()
  await pullups.getByTestId('set-amount').fill('40')
  await pullups.getByTestId('rpe-7').click()
  await pullups.getByTestId('log-set').click()
  await page.getByTestId('timer-skip').click()

  // Výmena cviku počas tréningu: kliky → tlak z podlahy (kým nie je zapísaná séria)
  const pushups = page.locator('section', { hasText: 'Progresia kliku' }).first()
  await pushups.getByTestId('swap-open').click()
  await page.getByTestId('swap-kb_floor_press').click()
  const floorPress = page.locator('section', { hasText: 'Tlak z podlahy s KB' }).first()
  await expect(floorPress.getByText('náhrada za: Progresia kliku')).toBeVisible()
  await expect(floorPress.getByText('16 kg × 8 op. / strana')).toBeVisible()
  // Po zapísaní série sa už vymeniť nedá
  await floorPress.getByTestId('rpe-8').click()
  await floorPress.getByTestId('log-set').click()
  await page.getByTestId('timer-skip').click()
  await expect(floorPress.getByTestId('swap-open')).toHaveCount(0)

  // Ukončenie → návrh progresie
  await page.getByTestId('finish-workout').click()
  await expect(page.getByRole('heading', { name: 'Tréning hotový' })).toBeVisible()
  const list = page.getByTestId('progression-list')
  await expect(list).toContainText('Goblet drep')
  await expect(list).toContainText('nabudúce 7 op.')
  await expect(list).toContainText('Progresia zhybu')
  await expect(list).toContainText('Tlak z podlahy s KB')

  await page.getByTestId('back-home').click()

  // Zápis hmotnosti a krokov
  await page.getByTestId('weight-today').fill('104.6')
  await page.getByTestId('steps-today').fill('7000')
  await expect(page.getByText('Dnešný tréning je hotový. Zvyšok dňa: mobilita a kroky.')).toBeVisible()

  // Progresia je uložená: ďalší tréning ponúkne B, drep má cieľ 7 opakovaní
  await page.reload()
  await expect(page.getByTestId('weight-today')).toHaveValue('104.6')
  await page.getByRole('link', { name: 'Cviky' }).click()
  await page.getByRole('button', { name: /Goblet drep/ }).click()
  await expect(page.getByText('16 kg × 7 op.')).toBeVisible()

  expect(errors).toEqual([])
})

test('mobilitná rutina beží so sprievodcom a časovačom', async ({ page }) => {
  await setup(page)
  await page.getByRole('link', { name: 'Mobilita' }).click()
  await expect(page.getByText('9 cvikov, 11:55 min')).toBeVisible()
  await page.getByTestId('start-mobility').click()
  await expect(page.getByRole('heading', { name: 'Cat-camel' })).toBeVisible()
  await expect(page.getByTestId('mobility-timer')).toBeVisible()
  await page.getByTestId('mobility-next').click()
  await expect(page.getByRole('heading', { name: /Flexory bedier/ })).toBeVisible()
  await expect(page.getByText('Krok 2 z 69')).toBeVisible()
})

test('export a import zálohy', async ({ page }) => {
  await setup(page)
  await page.getByTestId('weight-today').fill('104.2')
  await page.getByTestId('steps-today').fill('8200')
  await page.getByRole('link', { name: 'Viac' }).click()

  const download = await Promise.all([page.waitForEvent('download'), page.getByTestId('export').click()]).then(([d]) => d)
  const path = await download.path()
  expect(download.suggestedFilename()).toMatch(/^domaci-trening-\d{4}-\d{2}-\d{2}\.json$/)

  // Zmažeme dáta a obnovíme zo zálohy
  page.on('dialog', (d) => void d.accept())
  await page.getByRole('button', { name: 'Zmazať všetky dáta' }).click()
  await expect(page.getByTestId('setup-submit')).toBeVisible()

  await page.evaluate(() => localStorage.clear())
  await page.goto('/')
  await page.getByTestId('setup-submit').click()
  await page.getByRole('link', { name: 'Viac' }).click()
  await page.getByTestId('import-file').setInputFiles(path!)
  await expect(page.getByText(/Obnovených \d+ záznamov/)).toBeVisible()
  await page.getByRole('link', { name: 'Dnes' }).click()
  await expect(page.getByTestId('weight-today')).toHaveValue('104.2')
  await expect(page.getByTestId('steps-today')).toHaveValue('8200')
})

test('appka funguje offline (service worker)', async ({ page, context }) => {
  await setup(page)
  // Service worker musí stránku skutočne ovládať, inak by test prešiel aj bez offline podpory.
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, { timeout: 20_000 })
  expect(await page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)

  await context.setOffline(true)
  // Overenie, že sieť je naozaj odpojená.
  const netFails = await page.evaluate(async () => {
    try {
      await fetch(`/nic-${Date.now()}.txt`, { cache: 'no-store' })
      return false
    } catch {
      return true
    }
  })
  expect(netFails).toBe(true)

  await page.reload()
  await expect(page.getByTestId('start-workout')).toBeVisible()
  await page.getByTestId('weight-today').fill('103.9')
  // Pole ukladá pri opustení (blur) alebo Enter; obnoviť až keď sa hodnota vráti z databázy.
  await page.getByTestId('weight-today').press('Enter')
  await page.getByTestId('steps-today').fill('5000')
  await page.getByTestId('steps-today').press('Enter')
  await expect(page.getByTestId('steps-today')).toHaveValue('5000')
  await page.reload()
  await expect(page.getByTestId('weight-today')).toHaveValue('103.9')
  await context.setOffline(false)
})
