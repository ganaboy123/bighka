import { lazy, Suspense, useEffect, useState, useSyncExternalStore, type ComponentType, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { Pause, Play } from 'lucide-react';
import GridScanSource from '@/components/GridScan.jsx';
import { backgroundProfiles, type BackgroundProfile } from './background-profiles';
import './styles/background-utilities.css';
import themeStylesheet from '../site-themes.css?url';

const GradientWaves = lazy(() => import('./components/GradientWaves'));
const Galaxy = lazy(() => import('./components/Galaxy'));
const Prism = lazy(() => import('./components/Prism'));
const Orb = lazy(() => import('./components/Orb'));

interface GridProps {
  linesColor: string; scanColor: string; cells: number; depth: number;
  depthFade: number; lineThickness: number; scanDuration: number; scanDelay: number;
  scanDirection: string; scanWidth: number; trail: number; glow: number;
  shading: number; reflection: number; parallax: number; dpr: number;
  lightMode: boolean; autoScan: boolean; interactive: boolean;
  intro: boolean; paused: boolean; enableWebcam: boolean; enableGyro: boolean;
  clickEffect: string; points: boolean;
}
const GridScan = GridScanSource as unknown as ComponentType<GridProps>;
const motionQuery = '(prefers-reduced-motion: reduce)';
const mobileQuery = '(max-width: 680px)';

function mediaSubscription(query: string, callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}
const subscribeMotion = (callback: () => void) => mediaSubscription(motionQuery, callback);
const subscribeMobile = (callback: () => void) => mediaSubscription(mobileQuery, callback);
function subscribeTheme(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

function Accent({ profile, light, still, mobile }: { profile: BackgroundProfile; light: boolean; still: boolean; mobile: boolean }) {
  const colors = light ? [profile.light, profile.secondaryLight] : [profile.dark, profile.secondary];
  const dpr = mobile ? 1 : 0.8;
  const variant = profile.variant;

  switch (profile.effect) {
    case 'waves': return <GradientWaves horizonColor={colors[0]} waveColor={colors[1]} crestColor={light ? profile.light : '#ece9ff'} lightMode={light} backgroundColor="transparent" paused={still} intro={false} mouseInteraction={!still} swellOnClick={!still} quality="low" dpr={dpr} speed={0.2 + (variant % 4) * 0.035} tilt={58 + variant % 10} amplitude={2.1} grain={0.03} opacity={0.85} />;
    case 'galaxy': return <Galaxy starColors={colors} lightMode={light} transparent disableAnimation={still} intro={false} mouseInteraction={!still} clickWarp={!still} dpr={dpr} density={0.65 + variant % 4 * 0.13} layers={3} starSpeed={0.18} speed={0.5} rotationSpeed={0.035 + variant % 3 * 0.01} starSize={1.1} flareIntensity={0.3} glowIntensity={0.28} />;
    case 'prism': return <Prism colors={colors} lightMode={light} animationType={still ? 'static' : '3drotate'} timeScale={still ? 0 : 0.22 + variant % 4 * 0.035} intro={false} interactive={!still} dpr={dpr} resolution={0.8} glow={0.8} noise={0.015} height={3 + variant % 3 * 0.4} baseWidth={4.3} scale={2.0} />;
    case 'orb': return <Orb colors={colors} backgroundColor="transparent" size={0.95} speed={0.28 + variant % 3 * 0.03} paused={still} intro={false} followCursor={!still} clickPulse={!still} dpr={dpr} glow={0.3} bleed={0.22} wobble={0.45} tiltX={variant % 4 * 0.14} tiltY={0.3} opacity={0.78} />;
    default: return null;
  }
}

function SiteBackground({ profile }: { profile: BackgroundProfile }) {
  const light = useSyncExternalStore(subscribeTheme, () => document.documentElement.dataset.theme === 'light', () => false);
  const reduced = useSyncExternalStore(subscribeMotion, () => window.matchMedia(motionQuery).matches, () => false);
  const mobile = useSyncExternalStore(subscribeMobile, () => window.matchMedia(mobileQuery).matches, () => false);
  const [paused, setPaused] = useState(() => {
    try { return localStorage.getItem('hka-background-paused') === 'true'; } catch { return false; }
  });
  const [navTarget, setNavTarget] = useState<HTMLElement | null>(null);
  const still = paused || reduced;
  const accent = light ? profile.light : profile.dark;
  const secondary = light ? profile.secondaryLight : profile.secondary;

  useEffect(() => {
    setNavTarget(document.querySelector<HTMLElement>('.main-nav'));
    document.documentElement.style.setProperty('--scene-accent', accent);
    document.documentElement.style.setProperty('--scene-secondary', secondary);
    document.documentElement.style.setProperty('--case-accent', accent);
    document.body.dataset.backgroundState = still ? 'paused' : 'animated';
    document.body.dataset.backgroundEffect = profile.effect;
    try { localStorage.setItem('hka-background-paused', String(paused)); } catch { /* Private browsing remains usable. */ }
  }, [accent, secondary, still, paused, profile.effect]);

  const Icon = still ? Play : Pause;
  return <>
    <div className="site-background" aria-hidden="true" data-effect={profile.effect} style={{ '--scene-accent': accent, '--scene-secondary': secondary } as CSSProperties}>
      <div className="site-background-base" />
      <div className="site-background-grid site-background-layer">
        <GridScan key={String(reduced)} linesColor={accent} scanColor={secondary}
          cells={mobile ? Math.max(4, Math.round(profile.cells * 0.7)) : profile.cells}
          depth={profile.depth} depthFade={0.48} lineThickness={mobile ? 1.3 : 1.15}
          scanDuration={profile.duration} scanDelay={1.25} scanDirection={profile.direction}
          scanWidth={1.7} trail={0.6} glow={mobile ? 0.35 : 0.45}
          shading={0.6} reflection={0.22} parallax={still ? 0 : 0.45}
          dpr={mobile ? 0.85 : 0.7} lightMode={light} autoScan={!still}
          interactive={!still} paused={still} intro={false} points
          clickEffect={still ? 'none' : 'ping'} enableWebcam={false} enableGyro={false} />
      </div>
      {profile.effect !== 'grid' && <div className="site-background-accent site-background-layer"><Suspense fallback={null}><Accent profile={profile} light={light} still={still} mobile={mobile} /></Suspense></div>}
      <div className="site-background-readability" />
    </div>
    {navTarget && createPortal(<button className="motion-toggle" type="button" aria-label={still ? 'Resume background animation' : 'Pause background animation'} aria-pressed={paused} title={reduced ? 'Reduced motion is enabled on this device' : still ? 'Resume background animation' : 'Pause background animation'} disabled={reduced} onClick={() => setPaused(value => !value)}><Icon size={17} aria-hidden="true" /></button>, navTarget)}
  </>;
}

const route = document.body.dataset.background || 'index';
// Apply the final theme after shared multi-page CSS, regardless of chunk order.
const themeLink = document.createElement('link');
themeLink.rel = 'stylesheet';
themeLink.href = themeStylesheet;
themeLink.dataset.hkaTheme = 'true';
document.head.append(themeLink);
const profile = backgroundProfiles[route] || backgroundProfiles.index;
const root = document.createElement('div');
root.id = 'site-background-root';
document.body.prepend(root);
createRoot(root).render(<SiteBackground profile={profile} />);
