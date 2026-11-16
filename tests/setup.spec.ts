import { test, expect } from '@playwright/test';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const reviewDirectory = path.resolve('.impeccable/review');
mkdirSync(reviewDirectory, { recursive: true });

test('production serves compiled pages, static assets, and video range requests', async ({ request }) => {
  const staticFiles = readdirSync('.').filter(file =>
    (file.endsWith('.html') && file !== 'gradient-waves.html') || file.endsWith('.css') ||
    ['app.js', 'world.js', 'playground.js'].includes(file)
  );

  for (const file of staticFiles) {
    const response = await request.get(`/${file}`);
    expect(response.status(), file).toBe(200);
    if (file.endsWith('.html')) {
      const compiled = await response.text();
      expect(compiled).toContain('data-background=');
      expect(compiled).not.toContain('/src/site-backgrounds.tsx');
      expect(compiled).not.toContain('src="world.js"');
      expect(compiled).toContain(readFileSync(file, 'utf8').match(/<title>(.*?)<\/title>/)![0]);
    } else expect((await response.body()).equals(readFileSync(file)), file).toBe(true);
  }

  const video = await request.get('/assets/mind-in-motion.mp4', { headers: { Range: 'bytes=0-1023' } });
  expect(video.status()).toBe(206);
  expect(video.headers()['content-type']).toBe('video/mp4');
  expect((await video.body()).length).toBe(1024);
  expect((await request.get('/package.json')).status()).toBe(404);
});

test('portfolio loads with working theme controls', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('body')).not.toHaveClass(/is-loading/);
  await expect(page.locator('h1')).toContainText('Harrison');

  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
  }
  const themeButton = page.locator('.theme-toggle');
  await themeButton.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await themeButton.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Close navigation', exact: true }).click();
  }

  expect(errors).toEqual([]);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(reviewDirectory, `portfolio-${testInfo.project.name}.png`) });
});

test('GradientWaves renders at full size and pauses and resumes', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/gradient-waves.html');
  await expect(page.getByRole('heading', { name: 'Gradient waves.' })).toBeVisible();
  const canvas = page.locator('main canvas');
  await expect(canvas).toBeVisible();
  await expect.poll(() => canvas.evaluate(element => (element as HTMLCanvasElement).width), { timeout: 15_000 }).toBeGreaterThan(300);
  const rendered = await canvas.evaluate(element => {
    const canvas = element as HTMLCanvasElement;
    const gl = canvas.getContext('webgl2')!;
    const program = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram;
    return {
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      linked: Boolean(program && gl.getProgramParameter(program, gl.LINK_STATUS))
    };
  });
  expect(rendered.width).toBe(testInfo.project.use.viewport!.width);
  expect(rendered.height).toBeGreaterThan(500);
  expect(rendered.linked).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.getByRole('button', { name: 'Pause motion' }).click();
  await expect(page.getByRole('status')).toHaveText('Motion paused');
  await page.waitForTimeout(300);
  const stillFrame = await canvas.screenshot();
  await page.waitForTimeout(300);
  expect((await canvas.screenshot()).equals(stillFrame)).toBe(true);
  await page.getByRole('button', { name: 'Resume motion' }).click();
  await expect(page.getByRole('status')).toHaveText('Waves in motion');
  await page.waitForTimeout(300);
  expect((await canvas.screenshot()).equals(stillFrame)).toBe(false);
  await page.waitForTimeout(2700);
  expect(errors).toEqual([]);
  await page.screenshot({ path: path.join(reviewDirectory, `${testInfo.project.name}.png`) });
});

test('GradientWaves respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/gradient-waves.html');
  await expect(page.getByRole('button', { name: 'Reduced motion' })).toBeDisabled();
  await expect(page.getByRole('status')).toHaveText('Motion paused');
  await expect(page.locator('main canvas')).toBeVisible();
});
