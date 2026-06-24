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
        mango: {
          50: 'var(--color-mango-50)',
          100: 'var(--color-mango-100)',
          200: 'var(--color-mango-200)',
          300: 'var(--color-mango-300)',
          400: 'var(--color-mango-400)',
          500: 'var(--color-mango-500)',
          600: 'var(--color-mango-600)',
          700: 'var(--color-mango-700)',
          800: 'var(--color-mango-800)',
          900: 'var(--color-mango-900)',
        },
        forest: {
          100: 'var(--color-forest-100)',
          500: 'var(--color-forest-500)',
          600: 'var(--color-forest-600)',
          900: 'var(--color-forest-900)',
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
      fontSize: {
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)',
        base: 'var(--text-md)',
        lg: 'var(--text-lg)',
        xl: 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
        display: 'var(--text-display)',
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
