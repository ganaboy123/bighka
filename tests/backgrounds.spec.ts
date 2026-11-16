import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { backgroundProfiles } from '../src/background-profiles';

const directory = path.resolve('.impeccable/review/backgrounds');
mkdirSync(directory, { recursive: true });

for (const [route, profile] of Object.entries(backgroundProfiles)) {
  for (const theme of ['dark', 'light']) {
    test(`${route} renders its background and readable content in ${theme}`, async ({ page }, testInfo) => {
      test.setTimeout(75_000);
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(mode => {
        localStorage.setItem('harrison-theme-cinematic', mode);
        localStorage.setItem('hka-background-paused', 'true');
      }, theme);
      await page.goto(`/${route}.html`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).not.toHaveClass(/is-loading/);
      await expect(page.locator('.site-preloader')).toHaveCount(0);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('body')).toHaveAttribute('data-background-effect', profile.effect);
      await expect(page.locator('body')).toHaveAttribute('data-background-state', 'paused');
      await expect(page.locator('h1')).toBeVisible();
      const foregrounds = await page.evaluate(() => {
        const luminance = (rgb: number[]) => rgb.map(value => {
          const channel = value / 255;
          return channel <= .04045 ? channel / 12.92 : Math.pow((channel + .055) / 1.055, 2.4);
        }).reduce((total, channel, index) => total + channel * [.2126, .7152, .0722][index], 0);
        const paper = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim().slice(1);
        const background = luminance([0, 2, 4].map(offset => parseInt(paper.slice(offset, offset + 2), 16)));
        return [...document.querySelectorAll('h1, .page-lead, .hero-bottom p, .case-hero-summary, .hero-side-note, .home-cta h2, .home-cta h2 em, .form-submit-row > p')]
          .filter(element => (element as HTMLElement).offsetHeight > 0)
          .map(element => {
            const style = getComputedStyle(element);
            const foreground = luminance(style.color.match(/[\d.]+/g)!.slice(0, 3).map(Number));
            return { element: element.className || element.tagName, ratio: (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05), large: parseFloat(style.fontSize) >= 24 };
          });
      });
      for (const color of foregrounds) expect(color.ratio, `${color.element} contrast against the page surface`).toBeGreaterThanOrEqual(color.large ? 3 : 4.5);
      const canvases = page.locator('.site-background canvas');
      await expect(canvases).toHaveCount(profile.effect === 'grid' ? 1 : 2);
      await expect.poll(() => canvases.evaluateAll(elements => elements.every(element => {
        const canvas = element as HTMLCanvasElement;
        const gl = canvas.getContext('webgl2');
        const program = gl?.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram | null;
        return canvas.width > 200 && canvas.clientWidth === innerWidth && canvas.clientHeight === innerHeight && Boolean(program && gl!.getProgramParameter(program, gl!.LINK_STATUS));
      })), { timeout: 30_000 }).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.locator('.site-background').evaluate(element => getComputedStyle(element).position)).toBe('fixed');

      if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Open menu', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Resume background animation', exact: true })).toBeEnabled();
      if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Close navigation', exact: true }).click();
      await page.screenshot({ path: path.join(directory, `${route}-${theme}-${testInfo.project.name}.png`) });
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight * 0.55));
      await expect(page.locator('.site-background')).toBeVisible();
      expect(await page.locator('.site-background').evaluate(element => element.getBoundingClientRect().top)).toBe(0);
      expect(errors).toEqual([]);
    });
  }
}

test('theme changes recolor the active background without losing it', async ({ page }, testInfo) => {
  await page.goto('/index.html');
  await expect(page.locator('.site-background canvas')).toBeVisible();
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page.locator('.theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect.poll(() => page.locator('.site-background').evaluate(element => (element as HTMLElement).style.getPropertyValue('--scene-accent'))).toBe(backgroundProfiles.index.light);
  await page.locator('.theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect.poll(() => page.locator('.site-background').evaluate(element => (element as HTMLElement).style.getPropertyValue('--scene-accent'))).toBe(backgroundProfiles.index.dark);
});

test('the full-screen background actually animates and can be paused', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    localStorage.setItem('hka-background-paused', 'false');
    localStorage.setItem('harrison-theme-cinematic', 'dark');
  });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).not.toHaveClass(/is-loading/);
  await expect(page.locator('.site-preloader')).toHaveCount(0);
  const canvas = page.locator('.site-background-grid canvas');
  await expect(canvas).toBeVisible();
  // Isolate the background pixels from the portfolio's independent hero motion.
  const sceneFrame = async () => {
    const cover = await page.addStyleTag({ content: 'body > :not(#site-background-root) { visibility: hidden !important; }' });
    const frame = await canvas.screenshot();
    await cover.evaluate(element => element.remove());
    return frame;
  };
  const first = await sceneFrame();
  await page.waitForTimeout(800);
  expect((await sceneFrame()).equals(first)).toBe(false);
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await page.getByRole('button', { name: 'Pause background animation', exact: true }).click();
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Close navigation', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-background-state', 'paused');
  const frozen = await sceneFrame();
  await page.waitForTimeout(500);
  expect((await sceneFrame()).equals(frozen)).toBe(true);
});

test('reduced motion keeps the full-screen 3D background visible', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/index.html');
  await expect(page.locator('body')).toHaveAttribute('data-background-state', 'paused');
  await expect(page.locator('.site-background canvas')).toBeVisible();
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Resume background animation', exact: true })).toBeDisabled();
});
