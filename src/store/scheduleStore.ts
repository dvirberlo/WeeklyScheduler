import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Course, CourseEvent } from '../types'
import { eventOverlapsSlots, minMaxFromCourses } from '../utils/time'

type ScheduledMap = Record<string, Record<string, string>>

type TimeRange = { min: `${number}:${number}`; max: `${number}:${number}`; auto: boolean }

interface State {
  courses: Course[]
  selectedCourseIds: string[]
  scheduled: ScheduledMap
  timeRange: TimeRange
}

interface Actions {
  loadCourses: (courses: Course[]) => void
  clearCourses: () => void
  toggleCourse: (courseId: string) => void
  selectAll: () => void
  clearSelection: () => void
  scheduleEvent: (courseId: string, category: string, event: CourseEvent) => void
  unscheduleEvent: (courseId: string, category: string) => void
  resetAll: () => void
  setTimeRange: (partial: Partial<TimeRange>) => void
}

export const useScheduleStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      courses: [],
      selectedCourseIds: [],
      scheduled: {},
      timeRange: { min: '08:00', max: '20:00', auto: true },

      loadCourses: (courses) => {
        const { timeRange } = get()
        set({
          courses,
          selectedCourseIds: [],
          scheduled: {},
          timeRange,
        })
      },
      clearCourses: () => set({ courses: [], selectedCourseIds: [], scheduled: {} }),

      toggleCourse: (courseId) =>
        set((state) => {
          const selected = new Set(state.selectedCourseIds)
          if (selected.has(courseId)) {
            selected.delete(courseId)
            const scheduled = { ...state.scheduled }
            delete scheduled[courseId]
            return { selectedCourseIds: Array.from(selected), scheduled }
          } else {
            selected.add(courseId)
            return { selectedCourseIds: Array.from(selected) }
          }
        }),

      selectAll: () =>
        set((state) => ({ selectedCourseIds: state.courses.map((c) => c.id) })),

      clearSelection: () => set({ selectedCourseIds: [] }),

      scheduleEvent: (courseId, category, event) =>
        set((state) => {
          const next: ScheduledMap = { ...state.scheduled }
          next[courseId] = { ...(next[courseId] || {}), [category]: event.id }
          return { scheduled: next }
        }),

      unscheduleEvent: (courseId, category) =>
        set((state) => {
          const next: ScheduledMap = { ...state.scheduled }
          if (next[courseId]) {
            const { [category]: _, ...rest } = next[courseId]
            if (Object.keys(rest).length === 0) delete next[courseId]
            else next[courseId] = rest
          }
          return { scheduled: next }
        }),

      resetAll: () => set({ scheduled: {} }),

      setTimeRange: (partial) =>
        set((state) => ({
          timeRange: { ...state.timeRange, ...partial },
        })),
    }),
    {
      name: 'weekly-scheduler',
      partialize: (s) => ({
        courses: s.courses,
        selectedCourseIds: s.selectedCourseIds,
        scheduled: s.scheduled,
        timeRange: s.timeRange,
      }),
    }
  )
)

export function getSelectedCourses(state: State): Course[] {
  const set = new Set(state.selectedCourseIds)
  return state.courses.filter((c) => set.has(c.id))
}

export function getScheduledEventIdsMap(state: State): Set<string> {
  const set = new Set<string>()
  for (const courseId in state.scheduled) {
    for (const category in state.scheduled[courseId]) {
      set.add(state.scheduled[courseId][category])
    }
  }
  return set
}

export function findEventById(courses: Course[], eventId: string): CourseEvent | undefined {
  for (const c of courses) {
    for (const e of c.events) if (e.id === eventId) return e
  }
  return undefined
}

export function getScheduledEvents(state: State): { course: Course; event: CourseEvent }[] {
  const res: { course: Course; event: CourseEvent }[] = []
  for (const courseId in state.scheduled) {
    const course = state.courses.find((c) => c.id === courseId)
    if (!course) continue
    for (const category in state.scheduled[courseId]) {
      const evId = state.scheduled[courseId][category]
      const event = course.events.find((e) => e.id === evId)
      if (event) res.push({ course, event })
    }
  }
  return res
}

export function canScheduleEvent(
  candidate: CourseEvent,
  scheduled: ScheduledMap,
  courses: Course[],
  semester: 'A' | 'B'
): boolean {
  const course = courses.find((c) => c.events.some((e) => e.id === candidate.id))
  if (!course) return false
  const courseSched = scheduled[course.id]
  if (courseSched && courseSched[candidate.category]) {
    return false
  }
  const scheduledEvents: CourseEvent[] = []
  for (const cId in scheduled) {
    const c = courses.find((cx) => cx.id === cId)
    if (!c) continue
    for (const cat in scheduled[cId]) {
      const evId = scheduled[cId][cat]
      const ev = c.events.find((e) => e.id === evId)
      if (ev) scheduledEvents.push(ev)
    }
  }
  for (const ev of scheduledEvents) {
    if (eventOverlapsSlots(candidate.timeSlots, ev.timeSlots, semester)) return false
  }
  return true
}

export function courseScheduleStatus(course: Course, scheduled: ScheduledMap):
  | 'none'
  | 'partial'
  | 'full' {
  const eventCategories = Array.from(new Set(course.events.map((e) => e.category)))
  const mapped = scheduled[course.id] || {}
  const count = Object.keys(mapped).length
  if (count === 0) return 'none'
  if (count === eventCategories.length) return 'full'
  return 'partial'
}

export function categoriesForCourse(course: Course): string[] {
  return Array.from(new Set(course.events.map((e) => e.category))).sort()
}

export function computeDefaultTimeRangeIfAuto(state: State, semester: 'A' | 'B'): { min: string; max: string } {
  if (!state.timeRange.auto) return { min: state.timeRange.min, max: state.timeRange.max }
  const selected = getSelectedCourses(state)
  if (selected.length === 0) return { min: state.timeRange.min, max: state.timeRange.max }
  const mm = minMaxFromCourses(selected, semester, { min: '08:00', max: '20:00' })
  return mm
}