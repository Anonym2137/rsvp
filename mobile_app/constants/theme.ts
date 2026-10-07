/**
 * Design tokens – dark & light theme palettes.
 * Oklch values from web_app CSS converted to hex equivalents for React Native.
 */

export const DarkTheme = {
  background:    '#151020',
  surface:       '#211a30',
  surface2:      '#2c2240',
  surface3:      '#3a2e50',

  foreground:    '#faf7ff',
  mutedFg:       '#b8adc9',
  subtleFg:      '#9789ac',

  border:        '#473759',
  borderSubtle:  '#30253e',

  primary:       '#a78bfa',
  primaryFg:     '#211238',
  primaryMuted:  'rgba(167,139,250,0.16)',
  primaryHover:  '#c4b5fd',

  accentEmerald:      '#34d399',
  accentEmeraldMuted: 'rgba(52,211,153,0.12)',
  accentAmber:        '#fbbf24',
  accentAmberMuted:   'rgba(251,191,36,0.12)',
  accentRed:          '#ef4444',
  accentRedMuted:     'rgba(239,68,68,0.12)',

  inputBg:      '#211a30',
  ring:         'rgba(99,102,241,0.5)',
};

export const LightTheme = {
  background:    '#faf7ff',
  surface:       '#ffffff',
  surface2:      '#f0eafa',
  surface3:      '#e4daf4',

  foreground:    '#271b3a',
  mutedFg:       '#70627f',
  subtleFg:      '#81728f',

  border:        '#ded2ef',
  borderSubtle:  '#ede5f5',

  primary:       '#7c3aed',
  primaryFg:     '#ffffff',
  primaryMuted:  'rgba(124,58,237,0.10)',
  primaryHover:  '#6d28d9',

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

export const Design = {
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { control: 16, card: 28, sheet: 32 },
  type: { title: 30, heading: 20, body: 15, caption: 12 },
} as const;
