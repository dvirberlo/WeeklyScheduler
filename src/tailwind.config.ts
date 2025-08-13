import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      gridTemplateRows: {
        // 7 rows for days (legacy; grid now uses columns for days)
        days: 'repeat(7, minmax(56px, 1fr))'
      }
    }
  },
  plugins: []
} satisfies Config