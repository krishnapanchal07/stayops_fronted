/**
 * StayOps design tokens mirrored from Tailwind @theme in index.css.
 * Use these when a JS/TS value is required (charts, inline styles).
 * Prefer Tailwind token classes in components whenever possible.
 */
export const colorTokens = {
  primary: '#6C5DD3',
  primaryDark: '#5746B3',
  primarySoft: '#EEEAFB',
  primaryMuted: '#C4B5FD',
  sidebar: '#0F182E',
  sidebarHover: '#1A2744',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  muted: '#64748B',
  text: '#1E293B',
  border: '#E2E8F0',
} as const;

export const typographyScale = {
  pageTitle: { size: 32, weight: 700 },
  section: { size: 24, weight: 600 },
  cardTitle: { size: 20, weight: 600 },
  subtitle: { size: 16, weight: 600 },
  body: { size: 14, weight: 400 },
  small: { size: 12, weight: 400 },
  muted: { size: 12, weight: 500 },
} as const;

export const layoutTokens = {
  sidebarExpanded: 260,
  sidebarCollapsed: 80,
  topbarHeight: 72,
} as const;
