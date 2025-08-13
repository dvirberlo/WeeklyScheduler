import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      gridTemplateRows: {
        days: 'repeat(7, minmax(56px, 1fr))'
      }
    }
  },
  plugins: []
} satisfies Config