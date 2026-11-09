import plugin from 'tailwindcss/plugin'

// Palettes "codées en dur" dans les composants (rose-50, peach-100, orange-700, red-50...) :
// chaque nuance pointe vers une variable CSS, redéfinie en mode sombre. Sans ça, un
// `hover:bg-rose-50` restait un rose très clair sur fond bordeaux (texte illisible au survol).
// Règle de bascule en sombre : nuances claires (50–200, fonds) → teintes sombres ;
// nuances foncées (600–900, textes) → teintes claires ; 300/400/500 ≈ inchangées (accents).
const PALETTES = {
  rose: {
    light: { 50: '#fbf3f0', 100: '#f5e4de', 200: '#ecd0c6', 300: '#e2baac', 400: '#cf9d8e', 500: '#9e5f66', 600: '#8f5159', 700: '#7a4049', 800: '#5e2c36', 900: '#451d26', 950: '#2e1017' },
    dark: { 50: '#4a1e2a', 100: '#5a2733', 200: '#6e3341', 300: '#e2baac', 400: '#cf9d8e', 500: '#dcaa9d', 600: '#ecc9bd', 700: '#f2d9d0', 800: '#f5e4de', 900: '#fbf3f0', 950: '#12050a' },
  },
  peach: {
    light: { 50: '#fff8f3', 100: '#ffe8d6', 200: '#ffd3b0', 300: '#ffb985', 400: '#ff9f5a', 500: '#ff8a3d' },
    dark: { 50: '#3d1d1c', 100: '#4f2a22', 200: '#63342a', 300: '#8a4a33', 400: '#e08a55', 500: '#ff8a3d' },
  },
  orange: {
    light: { 50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12' },
    dark: { 50: '#3a1a16', 100: '#4d2619', 200: '#6b3a22', 300: '#b8693a', 400: '#fb923c', 500: '#fb923c', 600: '#fdba74', 700: '#fdc896', 800: '#fed7aa', 900: '#ffedd5' },
  },
  red: {
    light: { 50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 500: '#ef4444', 600: '#dc2626', 900: '#7f1d1d' },
    dark: { 50: '#4a1518', 100: '#5c1b1f', 200: '#7f2a2e', 300: '#b33d42', 500: '#e5484d', 600: '#f87171', 900: '#fecaca' },
  },
  green: {
    light: { 50: '#f0fdf4', 100: '#dcfce7', 300: '#86efac', 600: '#16a34a', 800: '#166534', 900: '#14532d' },
    dark: { 50: '#14321f', 100: '#1a4029', 300: '#2f7a4a', 600: '#4ade80', 800: '#bbf7d0', 900: '#bbf7d0' },
  },
  amber: {
    light: { 100: '#fef3c7', 300: '#fcd34d', 800: '#92400e' },
    dark: { 100: '#4a3415', 300: '#fcd34d', 800: '#fde68a' },
  },
  fuchsia: {
    light: { 100: '#fae8ff', 300: '#f0abfc', 800: '#86198f' },
    dark: { 100: '#4a1e4f', 300: '#f0abfc', 800: '#f5d0fe' },
  },
  sky: {
    light: { 100: '#e0f2fe', 300: '#7dd3fc', 800: '#075985' },
    dark: { 100: '#16354a', 300: '#7dd3fc', 800: '#bae6fd' },
  },
  stone: {
    light: { 100: '#f5f5f4', 200: '#e7e5e4', 500: '#78716c' },
    dark: { 100: '#3b2a2f', 200: '#4d3a40', 500: '#b3a7aa' },
  },
}

const toChannels = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

const colorsFromPalettes = Object.fromEntries(
  Object.entries(PALETTES).map(([name, { light }]) => [
    name,
    Object.fromEntries(Object.keys(light).map((shade) => [shade, `rgb(var(--c-${name}-${shade}) / <alpha-value>)`])),
  ])
)

const cssVars = (mode) =>
  Object.fromEntries(
    Object.entries(PALETTES).flatMap(([name, palette]) =>
      Object.entries(palette[mode]).map(([shade, hex]) => [`--c-${name}-${shade}`, toChannels(hex)])
    )
  )

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ...colorsFromPalettes,
        // Tokens sémantiques → variables CSS (voir src/index.css), automatiquement clair/sombre
        // selon la classe `dark` sur <html> — aucun `dark:` à répéter dans les composants.
        app: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-muted': 'var(--surface-muted)',
        line: 'var(--border)',
        heading: 'var(--heading)',
        body: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        'on-accent': 'var(--on-accent)',
      },
      fontFamily: {
        heading: ['Quicksand', 'sans-serif'],
        sans: ['Nunito', 'sans-serif'],
        mono: ['"Source Code Pro"', 'monospace'],
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(42,15,23,.22)',
        glow: '0 0 30px -12px rgba(226,186,172,.55)',
        cozy: '0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 12px 32px -18px rgb(42 15 23 / 0.35)',
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({ ':root': cssVars('light'), ':root.dark': cssVars('dark') })
    }),
  ],
}
