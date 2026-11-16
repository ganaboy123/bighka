export type BackgroundEffect = 'grid' | 'waves' | 'galaxy' | 'prism' | 'orb';

export interface BackgroundProfile {
  effect: BackgroundEffect;
  dark: string;
  light: string;
  secondary: string;
  secondaryLight: string;
  cells: number;
  depth: number;
  duration: number;
  direction: 'forward' | 'backward' | 'pingpong';
  variant: number;
}

// Every route has its own palette, room proportions, scan, and accent motion.
export const backgroundProfiles: Record<string, BackgroundProfile> = {
  index: { effect: 'grid', dark: '#b696ff', light: '#6239b2', secondary: '#58dcff', secondaryLight: '#087ca3', cells: 8, depth: 3.8, duration: 4.4, direction: 'pingpong', variant: 0 },
  about: { effect: 'waves', dark: '#a18cff', light: '#6842b5', secondary: '#5fcde7', secondaryLight: '#197fa0', cells: 7, depth: 3.3, duration: 5.1, direction: 'forward', variant: 1 },
  projects: { effect: 'galaxy', dark: '#69c9ff', light: '#286ab4', secondary: '#c7a3ff', secondaryLight: '#7941b7', cells: 9, depth: 4.2, duration: 4.8, direction: 'backward', variant: 2 },
  lab: { effect: 'prism', dark: '#dc99ff', light: '#8f37aa', secondary: '#75e4ef', secondaryLight: '#0b8195', cells: 6, depth: 2.8, duration: 4.1, direction: 'pingpong', variant: 3 },
  experiments: { effect: 'prism', dark: '#8aabff', light: '#3959ad', secondary: '#ea92da', secondaryLight: '#a14082', cells: 10, depth: 4.8, duration: 3.8, direction: 'backward', variant: 4 },
  journey: { effect: 'waves', dark: '#efb69f', light: '#aa514c', secondary: '#bc98ff', secondaryLight: '#8050b8', cells: 7, depth: 4.1, duration: 5.6, direction: 'forward', variant: 5 },
  services: { effect: 'orb', dark: '#81d8f5', light: '#186f9e', secondary: '#ada6ff', secondaryLight: '#6250b9', cells: 8, depth: 3.2, duration: 4.9, direction: 'pingpong', variant: 6 },
  technologies: { effect: 'grid', dark: '#74e1c1', light: '#17765f', secondary: '#97bbff', secondaryLight: '#3d64b0', cells: 11, depth: 4.7, duration: 4.0, direction: 'backward', variant: 7 },
  contact: { effect: 'orb', dark: '#c3a0ff', light: '#7347b3', secondary: '#a5dfc8', secondaryLight: '#277a65', cells: 6, depth: 2.7, duration: 5.3, direction: 'pingpong', variant: 8 },
  ganadevice: { effect: 'prism', dark: '#83b7ff', light: '#325fac', secondary: '#9de6cc', secondaryLight: '#247e69', cells: 9, depth: 4.0, duration: 4.7, direction: 'forward', variant: 9 },
  anansego: { effect: 'galaxy', dark: '#62d7ff', light: '#08799f', secondary: '#ffa7c2', secondaryLight: '#a34470', cells: 8, depth: 5.1, duration: 3.9, direction: 'backward', variant: 10 },
  techserect: { effect: 'galaxy', dark: '#bb9cff', light: '#7245b4', secondary: '#70c6ff', secondaryLight: '#216eaa', cells: 10, depth: 5.6, duration: 4.6, direction: 'pingpong', variant: 11 },
  echoes: { effect: 'waves', dark: '#99dfca', light: '#28796b', secondary: '#b5bdff', secondaryLight: '#585bb0', cells: 5, depth: 3.5, duration: 6.1, direction: 'forward', variant: 12 },
  'signal-study': { effect: 'grid', dark: '#8dc6ff', light: '#336ba8', secondary: '#93e5db', secondaryLight: '#167f7a', cells: 12, depth: 4.3, duration: 4.2, direction: 'pingpong', variant: 13 },
  'orbital-study': { effect: 'orb', dark: '#9eacff', light: '#555da8', secondary: '#84d4ff', secondaryLight: '#24789e', cells: 7, depth: 5.3, duration: 5.2, direction: 'backward', variant: 14 },
  'form-study': { effect: 'prism', dark: '#f3a3ce', light: '#a73f77', secondary: '#b6a9ff', secondaryLight: '#6950b3', cells: 6, depth: 3.1, duration: 5.0, direction: 'forward', variant: 15 }
};
