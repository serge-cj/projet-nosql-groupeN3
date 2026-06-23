import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--color-accent)',
          pressed: 'var(--color-accent-pressed)',
          ink: 'var(--color-accent-ink)',
        },
        promo: 'var(--color-promo)',
        soft: 'var(--color-soft)',
        canvas: 'var(--color-canvas)',
        ink: {
          DEFAULT: 'var(--color-ink)',
          muted: 'var(--color-ink-2)',
        },
        surface: {
          1: 'var(--color-surface-1)',
          2: 'var(--color-surface-2)',
          light: 'var(--color-surface-1)',
          dark: 'var(--color-surface-1)',
        },
        divider: 'var(--color-divider)',
        error: 'var(--color-error)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        soft: 'var(--shadow-soft)',
      },
      fontFamily: {
        sans: ['var(--font-body)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        pill: 'var(--radius-pill)',
        card: 'var(--radius-card)',
        input: 'var(--radius-input)',
      },
    },
  },
  plugins: [],
};

export default config;
