import { expect, test } from '@playwright/test'

test('service worker sa zaregistruje bez chyby v konzole', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, { timeout: 20_000 })
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.scope ?? null)
  expect(scope).toContain('localhost:4173')
  expect(errors).toEqual([])
})
