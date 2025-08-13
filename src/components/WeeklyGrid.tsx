import React, { useMemo, useState } from 'react'
import type { Course, CourseEvent, Day } from '../types'
import { Days, parseHM } from '../utils/time'
import {
  useScheduleStore,
  canScheduleEvent,
  getScheduledEvents,
} from '../store/scheduleStore'
import { useSettingsStore } from '../store/settingsStore'
import { useTranslation } from 'react-i18next'
import { DayColumn, type GridEvent } from './grid/DayColumn'
import { indexToLetters } from '../utils/label'
import { COLORS } from '../ui/theme'

function computeDayList(selectedCourses: Course[], semester: 'A' | 'B'): Day[] {
  const indices: number[] = []
  const dayToIndex = new Map<Day, number>(Days.map((d, i) => [d, i]))
  for (const c of selectedCourses) {
    for (const e of c.events) {
      for (const t of e.timeSlots) {
        if (t.semester !== semester) continue
        const idx = dayToIndex.get(t.day as Day)
        if (idx !== undefined) indices.push(idx)
      }
    }
  }
  if (indices.length === 0) return Days
  const min = Math.min(...indices)
  const max = Math.max(...indices)
  return Days.slice(min, max + 1)
}

export function WeeklyGrid(props: {
  selectedCourses: Course[]
  scheduledEventIds: Set<string>
  scheduledMap: Record<string, Record<string, string>>
  timeRange: { min: string; max: string }
}) {
  const { selectedCourses, scheduledMap, timeRange } = props
  const store = useScheduleStore()
  const { t } = useTranslation()
  const { semester } = useSettingsStore()
  const indexOfCourse = (id: string) => store.selectedCourseIds.indexOf(id)

  // Keep week days LTR order always
  const dayList = useMemo(() => computeDayList(selectedCourses, semester), [selectedCourses, semester])

  const minMin = parseHM(timeRange.min)
  const maxMin = parseHM(timeRange.max)
  const totalMins = Math.max(1, maxMin - minMin)

  const [hoverEventId, setHoverEventId] = useState<string | null>(null)

  const scheduledPairs = getScheduledEvents(store)

  const perDay = useMemo(() => {
    const map: Record<Day, { scheduled: GridEvent[]; unscheduled: GridEvent[] }> = {} as any
    for (const d of Days) map[d as Day] = { scheduled: [], unscheduled: [] }

    function pushEvent(course: Course, event: CourseEvent, scheduled: boolean) {
      const idx = indexOfCourse(course.id)
      if (idx < 0) return
      const colorIdx = idx % COLORS.length

      for (const ts of event.timeSlots) {
        if (ts.semester !== semester) continue
        const fromMin = parseHM(ts.from)
        const toMin = parseHM(ts.to)
        const top = ((fromMin - minMin) / totalMins) * 100
        const height = ((toMin - fromMin) / totalMins) * 100

        const ge: GridEvent = {
          key: `${event.id}-${ts.semester}-${ts.day}-${ts.from}`,
          course,
          event,
          day: ts.day as Day,
          fromMin,
          toMin,
          top,
          height,
          colorIdx,
        }
        if (scheduled) map[ts.day as Day].scheduled.push(ge)
        else map[ts.day as Day].unscheduled.push(ge)
      }
    }

    for (const { course, event } of scheduledPairs) {
      if (store.selectedCourseIds.includes(course.id)) {
        pushEvent(course, event, true)
      }
    }

    for (const course of selectedCourses) {
      const chosen = new Set(Object.keys(scheduledMap[course.id] || {}))
      for (const ev of course.events) {
        if (chosen.has(ev.category)) continue
        if (!canScheduleEvent(ev, store.scheduled, store.courses, semester)) continue
        pushEvent(course, ev, false)
      }
    }
    return map
  }, [selectedCourses, store.scheduled, store.courses, store.selectedCourseIds, minMin, maxMin, scheduledMap, semester])

  const ticks = useMemo(() => {
    const arr: number[] = []
    const firstHour = Math.ceil(minMin / 60)
    const lastHour = Math.floor(maxMin / 60)
    for (let h = firstHour; h <= lastHour; h++) arr.push(h * 60)
    return arr
  }, [minMin, maxMin])

  return (
    <div className="h-full w-full bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-lg p-2 overflow-auto">
      <div
        className="grid h-full"
        style={{
          gridTemplateColumns: `80px repeat(${dayList.length}, minmax(120px, 1fr))`,
          gridTemplateRows: '40px 1fr',
          minWidth: 900,
        }}
      >
        {/* Header row */}
        <div className="border-b dark:border-slate-700"></div>
        {dayList.map((day) => (
          <div key={`hdr-${day}`} className="border-b dark:border-slate-700 text-sm font-medium px-2 py-1 text-center">
            {t(`days.${day}`)}
          </div>
        ))}

        {/* Time axis (left) */}
        <div className="relative h-full">
          <div className="absolute inset-0">
            {ticks.map((m) => {
              const top = ((m - minMin) / totalMins) * 100
              const hh = String(Math.floor(m / 60)).padStart(2, '0')
              return (
                <div key={`tick-${m}`} className="absolute w-full" style={{ top: `${top}%` }}>
                  <div className="text-xs text-slate-500 dark:text-slate-400 select-none -translate-y-2 px-1">{hh}:00</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Day columns */}
        {dayList.map((day) => (
          <DayColumn
            key={`col-${day}`}
            day={day}
            scheduled={perDay[day].scheduled}
            unscheduled={perDay[day].unscheduled}
            onClickSchedule={(course, event) => store.scheduleEvent(course.id, event.category, event)}
            onClickUnschedule={(course, event) => store.unscheduleEvent(course.id, event.category)}
            hoverEventId={hoverEventId}
            setHoverEventId={setHoverEventId}
            minMin={minMin}
            totalMins={totalMins}
            ticks={ticks}
          />
        ))}
      </div>
    </div>
  )
}