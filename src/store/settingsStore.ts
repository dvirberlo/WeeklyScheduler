import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Semester } from '../types'

type Language = 'en' | 'he'
type Dir = 'ltr' | 'rtl'

function detectLang(): Language {
  if (typeof navigator === 'undefined') return 'en'
  const lang = navigator.language?.toLowerCase() || 'en'
  if (lang.startsWith('he')) return 'he'
  return 'en'
}
function langToDir(lang: Language): Dir {
  return lang === 'he' ? 'rtl' : 'ltr'
}

interface SettingsState {
  language: Language
  dir: Dir
  semester: Semester
  sidebarCollapsed: boolean
  setLanguage: (lang: Language) => void
  setSemester: (s: Semester) => void
  toggleSidebar: () => void
  setSidebar: (v: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: detectLang(),
      dir: langToDir(detectLang()),
      semester: 'A',
      sidebarCollapsed: false,
      setLanguage: (lang) => set({ language: lang, dir: langToDir(lang) }),
      setSemester: (s) => set({ semester: s }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setSidebar: (v) => set({ sidebarCollapsed: v }),
    }),
    { name: 'weekly-scheduler-settings' }
  )
)