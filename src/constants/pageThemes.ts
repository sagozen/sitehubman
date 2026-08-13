export type PageThemeId =
  | 'home'
  | 'studio'
  | 'leads'
  | 'nfc'
  | 'share'
  | 'profile'
  | 'analytics'
  | 'scan'
  | 'settings'
  | 'sales'
  | 'admin';

export type PageTheme = {
  canvas: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
};

const darkBase = {
  surface: '#111114',
  surfaceRaised: '#18181C',
  border: 'rgba(255,255,255,0.09)',
  text: '#F5F5F7',
  muted: '#9A9AA0',
} as const;

/**
 * Page personalities share structure and contrast while keeping one clear accent.
 * Solid colors keep the system cheap to render on older mobile GPUs.
 */
export const pageThemes: Record<PageThemeId, PageTheme> = {
  home: {
    ...darkBase,
    canvas: '#000000',
    accent: '#FFFFFF',
    accentSoft: 'rgba(255,255,255,0.08)',
    onAccent: '#000000',
  },
  studio: {
    ...darkBase,
    canvas: '#000000',
    accent: '#FFFFFF',
    accentSoft: 'rgba(255,255,255,0.08)',
    onAccent: '#000000',
  },
  leads: {
    ...darkBase,
    canvas: '#000000',
    accent: '#FFFFFF',
    accentSoft: 'rgba(255,255,255,0.08)',
    onAccent: '#000000',
  },
  nfc: {
    ...darkBase,
    canvas: '#000000',
    accent: '#FFFFFF',
    accentSoft: 'rgba(255,255,255,0.08)',
    onAccent: '#000000',
  },
  share: {
    ...darkBase,
    canvas: '#000000',
    accent: '#FFFFFF',
    accentSoft: 'rgba(255,255,255,0.08)',
    onAccent: '#000000',
  },
  profile: {
    ...darkBase,
    canvas: '#000000',
    accent: '#FFFFFF',
    accentSoft: 'rgba(255,255,255,0.08)',
    onAccent: '#000000',
  },
  analytics: {
    ...darkBase,
    canvas: '#000000',
    accent: '#FFFFFF',
    accentSoft: 'rgba(255,255,255,0.08)',
    onAccent: '#000000',
  },
  scan: {
    ...darkBase,
    canvas: '#000000',
    accent: '#FFFFFF',
    accentSoft: 'rgba(255,255,255,0.08)',
    onAccent: '#000000',
  },
  settings: {
    ...darkBase,
    canvas: '#000000',
    accent: '#FFFFFF',
    accentSoft: 'rgba(255,255,255,0.08)',
    onAccent: '#000000',
  },
  sales: {
    ...darkBase,
    canvas: '#000000',
    accent: '#FFFFFF',
    accentSoft: 'rgba(255,255,255,0.08)',
    onAccent: '#000000',
  },
  admin: {
    ...darkBase,
    canvas: '#000000',
    accent: '#FFFFFF',
    accentSoft: 'rgba(255,255,255,0.08)',
    onAccent: '#000000',
  },
};

export function getPageTheme(id: PageThemeId): PageTheme {
  return pageThemes[id];
}
