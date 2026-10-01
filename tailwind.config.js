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
        peach: {
          50: '#FFF8F3',
          100: '#FFE8D6',
          200: '#FFD3B0',
          300: '#FFB985',
          400: '#FF9F5A',
          500: '#FF8A3D',
        },
        // Rose nude — accent de la DA (identique en clair/sombre, voir CLAUDE.md pour le contexte).
        rose: {
          50: '#fbf3f0',
          100: '#f5e4de',
          200: '#ecd0c6',
          300: '#e2baac',
          400: '#cf9d8e',
          500: '#9e5f66',
          600: '#8f5159',
          700: '#7a4049',
          800: '#5e2c36',
          900: '#451d26',
          950: '#2e1017',
        },
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
        heading: ['Montserrat', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"Source Code Pro"', 'monospace'],
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(42,15,23,.22)',
        glow: '0 0 30px -12px rgba(226,186,172,.55)',
      },
    },
  },
  plugins: [],
}
