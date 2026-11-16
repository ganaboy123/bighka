import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: '.impeccable/review/test-results',
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4187',
    launchOptions: { args: ['--enable-unsafe-swiftshader'] }
  },
  projects: [
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } }
  ],
  webServer: {
    command: 'node server.js',
    url: 'http://127.0.0.1:4187',
    env: { PORT: '4187' },
    reuseExistingServer: false
  }
});
