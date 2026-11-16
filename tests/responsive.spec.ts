import { test, expect } from '@playwright/test';

for (const width of [320, 1024]) {
  for (const route of ['index', 'about', 'lab', 'experiments', 'technologies', 'contact', 'ganadevice', 'form-study']) {
    test(`${route} fits a ${width}px screen in both themes`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(() => {
        localStorage.setItem('hka-background-paused', 'true');
        localStorage.setItem('harrison-theme-cinematic', 'dark');
      });
      await page.goto(`/${route}.html`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toHaveAttribute('data-background-state', 'paused');
      for (const theme of ['dark', 'light']) {
        await page.evaluate(mode => {
          document.documentElement.dataset.theme = mode;
          dispatchEvent(new CustomEvent('portfolio-theme-change', { detail: { theme: mode } }));
        }, theme);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const heading = await page.locator('h1').boundingBox();
        expect(heading!.x).toBeGreaterThanOrEqual(0);
        expect(heading!.x + heading!.width).toBeLessThanOrEqual(width + 1);
        await expect(page.locator('.site-background')).toBeVisible();
      }
    });
  }
}
