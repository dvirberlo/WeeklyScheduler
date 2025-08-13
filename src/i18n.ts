import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      appTitle: 'Weekly Scheduler',
      uploadCourses: 'Upload Courses',
      loadSample: 'Load Sample',
      resetSchedule: 'Reset Schedule',
      clearCourses: 'Clear Courses',
      selectAll: 'Select All',
      clear: 'Clear',
      courses: 'Courses',
      showing: 'Showing',
      of: 'of',
      id: 'ID',
      fullyScheduled: 'Fully scheduled',
      partiallyScheduled: 'Partially scheduled',
      notScheduled: 'Not scheduled',
      blocked: 'Cannot complete with current schedule',
      tipColor: 'The color dot appears only for selected courses and matches the grid color.',
      semester: 'Semester',
      semA: 'A',
      semB: 'B',
      themeLight: 'Light',
      themeDark: 'Dark',
      language: 'Language',
      sidebarCollapse: 'Collapse sidebar',
      sidebarExpand: 'Expand sidebar',
      days: {
        Sunday: 'Sunday',
        Monday: 'Monday',
        Tuesday: 'Tuesday',
        Wednesday: 'Wednesday',
        Thursday: 'Thursday',
        Friday: 'Friday',
        Saturday: 'Saturday'
      }
    }
  },
  he: {
    translation: {
      appTitle: 'מתזמן שבועי',
      uploadCourses: 'העלה קורסים',
      loadSample: 'טען דוגמה',
      resetSchedule: 'איפוס מערכת',
      clearCourses: 'נקה קורסים',
      selectAll: 'בחר הכל',
      clear: 'נקה',
      courses: 'קורסים',
      showing: 'מוצגים',
      of: 'מתוך',
      id: 'מזהה',
      fullyScheduled: 'מתוזמן במלואו',
      partiallyScheduled: 'מתוזמן חלקית',
      notScheduled: 'לא מתוזמן',
      blocked: 'לא ניתן להשלים במצב הנוכחי',
      tipColor: 'נקודת הצבע מופיעה רק עבור קורסים שנבחרו, ותואמת לצבע בלוח.',
      semester: 'סמסטר',
      semA: "א'",
      semB: "ב'",
      themeLight: 'בהיר',
      themeDark: 'כהה',
      language: 'שפה',
      sidebarCollapse: 'כווץ סרגל צד',
      sidebarExpand: 'הרחב סרגל צד',
      days: {
        Sunday: "יום א'",
        Monday: "יום ב'",
        Tuesday: "יום ג'",
        Wednesday: "יום ד'",
        Thursday: "יום ה'",
        Friday: "יום ו'",
        Saturday: 'שבת'
      }
    }
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
})

export default i18n