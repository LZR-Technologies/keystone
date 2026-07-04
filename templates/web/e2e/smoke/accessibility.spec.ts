import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Layer C — accessibility as a hard gate, in a real browser.
 *
 * Static lint (jsx-a11y) catches structural mistakes at build time; axe here catches what only a
 * rendered DOM reveals — most importantly color contrast measured against the actual computed
 * design tokens. A violation fails the E2E suite, so a page below the AA readability floor cannot
 * merge. Scoped to WCAG 2.x level A and AA, the professional baseline.
 *
 * As the app grows, run this on each public route (add one test per route), the same way the smoke
 * suite grows.
 */
test.describe('Accessibility (axe)', () => {
  test('landing page (/) has no WCAG A/AA violations', async ({ page }) => {
    await page.goto('/')

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(results.violations).toEqual([])
  })

  test('declares a mobile viewport, so the app is usable on a phone', async ({ page }) => {
    await page.goto('/')

    // Mobile-readiness floor: a real device viewport must be declared, or the page renders at
    // desktop width on a phone and the user is forced to pinch-zoom. Asserted in the rendered DOM.
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
      'content',
      /width=device-width/,
    )
  })
})
