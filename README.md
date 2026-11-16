# HKA portfolio

HKA retains its static HTML pages and uses React 19, TypeScript, Tailwind CSS 4,
and Vite for new React components. shadcn registry installs are configured in
`components.json`; imports starting with `@/` resolve to `src/`.

## Local development

Use Node.js 22.12 or newer. In PowerShell, use the `.cmd` executables:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open `http://localhost:5173/` for the portfolio and
`http://localhost:5173/gradient-waves.html` for the GradientWaves preview.

## Build and serve

```powershell
npm.cmd run build
npm.cmd start
```

The build typechecks `src/` and `vite.config.ts`, compiles every HTML page's React
entry and Tailwind utilities, and preserves static styles, scripts, and media
URLs in `dist/`.
The Node server serves only `dist/`, supports video range requests, and uses
Render's `PORT` environment variable (5173 locally). Rebuild after edits when
using `npm.cmd start`, or use `npm.cmd run dev` for live updates.

Render runs `npm ci --include=dev && npm run build` before `npm start`.

After building, `npm.cmd test` checks the production portfolio and preview at
desktop and mobile sizes. Install its browser once with
`npx.cmd playwright install chromium` if Chromium is not already cached.

## Add components

```powershell
npx.cmd shadcn@latest add @react-bits/GradientWaves-TS-TW
```

GradientWaves is installed in `src/components/GradientWaves.tsx`. Import it into
a React component with `import GradientWaves from '@/components/GradientWaves'`.
Its parent needs an explicit height, for example `h-96`; the effect fills it.
The preview in `src/gradient-waves.tsx` demonstrates pause/resume and reduced
motion support. Animated rendering requires WebGL 2.

## Site backgrounds and themes

Every portfolio page loads `src/site-backgrounds.tsx`. The supplied React Bits
GridScan creates a fixed, full-screen 3D room; `src/background-profiles.ts`
assigns each page its own palette, room depth, scan timing, and optional
GradientWaves, Galaxy, Prism, or Orb accent. The scenes also render on mobile.

`site-themes.css` controls text contrast and reading surfaces in both themes.
It loads last to preserve priority over older page styles. Canvas utilities
are built without Tailwind's reset, so existing controls retain their layout.

The navigation contains background pause/resume and theme controls. Theme and
pause preferences persist across pages. Reduced motion keeps the 3D scene
visible with its motion paused; hidden tabs suspend rendering. GridScan's
webcam and gyroscope features are disabled.

Additional root HTML files are discovered automatically by Vite. Give a new
page a `data-background` route on its body and a profile in
`src/background-profiles.ts`, then include the background module script.

`npm.cmd test` checks every portfolio page in both themes at desktop and phone
sizes, plus actual animation/pause behavior, theme changes, and reduced motion.
