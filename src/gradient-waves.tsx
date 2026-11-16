import { StrictMode, useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { Pause, Play } from 'lucide-react';
import GradientWaves from '@/components/GradientWaves';
import './styles/globals.css';

const motionQuery = '(prefers-reduced-motion: reduce)';

function subscribeToMotion(callback: () => void) {
  const preference = window.matchMedia(motionQuery);
  preference.addEventListener('change', callback);
  return () => preference.removeEventListener('change', callback);
}

function supportsWebGL2() {
  const context = document.createElement('canvas').getContext('webgl2');
  context?.getExtension('WEBGL_lose_context')?.loseContext();
  return Boolean(context);
}

function GradientWavesPreview() {
  const [paused, setPaused] = useState(false);
  const [hasWebGL] = useState(supportsWebGL2);
  const reducedMotion = useSyncExternalStore(
    subscribeToMotion,
    () => window.matchMedia(motionQuery).matches,
    () => false
  );
  const still = paused || reducedMotion;
  const Icon = paused ? Play : Pause;

  return (
    <div className="flex min-h-svh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:bg-background focus:p-4">
        Skip to the waves
      </a>
      <header className="flex min-h-20 items-center justify-between gap-4 px-6 sm:px-12">
        <a href="index.html" className="text-sm font-semibold hover:text-primary">
          Harrison Appiah
        </a>
        <button
          type="button"
          aria-pressed={paused}
          disabled={reducedMotion || !hasWebGL}
          onClick={() => setPaused(value => !value)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-secondary px-4 text-sm text-secondary-foreground hover:bg-accent disabled:cursor-default disabled:opacity-60"
        >
          <Icon aria-hidden="true" size={16} />
          {reducedMotion ? 'Reduced motion' : !hasWebGL ? 'Still preview' : paused ? 'Resume motion' : 'Pause motion'}
        </button>
      </header>
      <main id="main" className="relative isolate flex flex-1 items-end overflow-hidden">
        <div aria-hidden="true" className="wave-backdrop absolute inset-0 -z-10">
          <GradientWaves
            backgroundColor="#08080c"
            horizonColor="#5227ff"
            waveColor="#ff9ffc"
            crestColor="#f5f3ee"
            speed={0.4}
            quality="medium"
            dpr={1.5}
            paused={still}
            intro={!still}
            mouseInteraction={!still}
            swellOnClick={!still}
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-background via-background/20 to-transparent" />
        </div>
        <div className="pointer-events-none flex w-full flex-col gap-5 px-6 pb-12 pt-64 sm:px-12 sm:pb-16">
          <h1 className="max-w-3xl text-5xl font-medium tracking-tight sm:text-7xl">Gradient waves.</h1>
          <p className="max-w-md text-base leading-relaxed text-foreground/90">
            {reducedMotion
              ? 'A quiet view of the waves, following your motion preference.'
              : !hasWebGL
                ? 'Your browser is showing a still preview.'
                : <><span className="hidden sm:inline">Move your cursor to shift the light. Click the waves to create a swell.</span><span className="sm:hidden">Tap the waves to create a swell.</span></>}
          </p>
          <p className="text-sm text-muted-foreground" role="status">
            {still || !hasWebGL ? 'Motion paused' : 'Waves in motion'}
          </p>
        </div>
      </main>
    </div>
  );
}

const container = document.getElementById('gradient-waves-root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <GradientWavesPreview />
    </StrictMode>
  );
}
