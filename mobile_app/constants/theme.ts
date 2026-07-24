/**
 * Design tokens – dark & light theme palettes.
 * Oklch values from web_app CSS converted to hex equivalents for React Native.
 */

export const DarkTheme = {
  background:    '#0f1219',
  surface:       '#161b26',
  surface2:      '#1e2433',
  surface3:      '#2a3145',

  foreground:    '#ebedf2',
  mutedFg:       '#7a8199',
  subtleFg:      '#505772',

  border:        '#2d3549',
  borderSubtle:  '#1f2636',

  primary:       '#6366f1',
  primaryFg:     '#ffffff',
  primaryMuted:  'rgba(99,102,241,0.15)',
  primaryHover:  '#818cf8',

  accentEmerald:      '#34d399',
  accentEmeraldMuted: 'rgba(52,211,153,0.12)',
  accentAmber:        '#fbbf24',
  accentAmberMuted:   'rgba(251,191,36,0.12)',
  accentRed:          '#ef4444',
  accentRedMuted:     'rgba(239,68,68,0.12)',

  inputBg:      '#161b26',
  ring:         'rgba(99,102,241,0.5)',
};

export const LightTheme = {
  background:    '#f5f5f7',
  surface:       '#ffffff',
  surface2:      '#f0f0f3',
  surface3:      '#e5e5ea',

  foreground:    '#1c1c1e',
  mutedFg:       '#6b6b73',
  subtleFg:      '#a0a0a8',

  border:        '#d5d5dc',
  borderSubtle:  '#ebebef',

  primary:       '#4f46e5',
  primaryFg:     '#ffffff',
  primaryMuted:  'rgba(79,70,229,0.10)',
  primaryHover:  '#4338ca',

  accentEmerald:      '#059669',
  accentEmeraldMuted: 'rgba(5,150,105,0.10)',
  accentAmber:        '#d97706',
  accentAmberMuted:   'rgba(217,119,6,0.10)',
  accentRed:          '#dc2626',
  accentRedMuted:     'rgba(220,38,38,0.10)',

  inputBg:      '#ffffff',
  ring:         'rgba(79,70,229,0.4)',
};

export type ThemeColors = typeof DarkTheme;
