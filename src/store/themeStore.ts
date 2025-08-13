import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

function detectPreferred(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  } catch {
    return 'light'
  }
}

type ThemeState = {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: detectPreferred(),
      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
    }),
    { name: 'weekly-scheduler-theme' }
  )
)