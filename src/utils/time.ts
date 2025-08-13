import type { Day, TimeHM, TimeSlot, Semester } from '../types'

export const Days: Day[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export function parseHM(t: TimeHM): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
export function formatHM(min: number): TimeHM {
  const h = Math.floor(min / 60)
  const m = min % 60
  const hh = String(h).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  return `${hh}:${mm}` as TimeHM
}

export function overlap(aFrom: number, aTo: number, bFrom: number, bTo: number): boolean {
  return aFrom < bTo && bFrom < aTo
}

export function slotOverlaps(a: TimeSlot, b: TimeSlot): boolean {
  if (a.day !== b.day) return false
  return overlap(parseHM(a.from), parseHM(a.to), parseHM(b.from), parseHM(b.to))
}

export function filterSlotsBySemester(slots: TimeSlot[], semester: Semester): TimeSlot[] {
  return slots.filter(s => s.semester === semester)
}

export function eventOverlapsSlots(slots: TimeSlot[], otherSlots: TimeSlot[], semester: Semester): boolean {
  const a = filterSlotsBySemester(slots, semester)
  const b = filterSlotsBySemester(otherSlots, semester)
  for (const s of a) {
    for (const o of b) {
      if (slotOverlaps(s, o)) return true
    }
  }
  return false
}

export function minMaxFromCourses(
  courses: { events: { timeSlots: TimeSlot[] }[] }[],
  semester: Semester,
  fallback: { min: TimeHM; max: TimeHM } = { min: '08:00', max: '20:00' }
): { min: TimeHM; max: TimeHM } {
  let min = Number.POSITIVE_INFINITY
  let max = 0
  for (const c of courses) {
    for (const e of c.events) {
      for (const t of e.timeSlots) {
        if (t.semester !== semester) continue
        min = Math.min(min, parseHM(t.from))
        max = Math.max(max, parseHM(t.to))
      }
    }
  }
  if (!isFinite(min) || max === 0) return fallback
  min = Math.max(0, min - 30)
  max = Math.min(24 * 60, max + 30)
  return { min: formatHM(min), max: formatHM(max) }
}

export interface IntervalItem<T> {
  id: string
  fromMin: number
  toMin: number
  payload: T
}
export interface LaidOut<T> extends IntervalItem<T> {
  column: number
  columns: number
}
export function layoutIntervals<T>(items: IntervalItem<T>[]): LaidOut<T>[] {
  const sorted = [...items].sort((a, b) => a.fromMin - b.fromMin || a.toMin - b.toMin)
  type Active = { toMin: number; column: number }
  let active: Active[] = []
  const result: LaidOut<T>[] = []
  let currentCluster: LaidOut<T>[] = []
  let clusterEnd = -1

  for (const it of sorted) {
    active = active.filter(a => a.toMin > it.fromMin)
    const used = new Set(active.map(a => a.column))
    let col = 0
    while (used.has(col)) col++
    active.push({ toMin: it.toMin, column: col })
    active.sort((a, b) => a.column - b.column)

    const laid: LaidOut<T> = { ...it, column: col, columns: 1 }
    result.push(laid)

    if (currentCluster.length === 0) {
      currentCluster = [laid]
      clusterEnd = it.toMin
    } else {
      if (it.fromMin < clusterEnd) {
        currentCluster.push(laid)
        clusterEnd = Math.max(clusterEnd, it.toMin)
      } else {
        const maxCol = Math.max(...currentCluster.map(x => x.column)) + 1
        currentCluster.forEach(x => (x.columns = maxCol))
        currentCluster = [laid]
        clusterEnd = it.toMin
      }
    }
  }
  if (currentCluster.length) {
    const maxCol = Math.max(...currentCluster.map(x => x.column)) + 1
    currentCluster.forEach(x => (x.columns = maxCol))
  }
  return result
}