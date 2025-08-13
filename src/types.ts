export type Day =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'

export type Semester = 'A' | 'B'

export type TimeHM = `${number}:${number}`

export interface TimeSlot {
  day: Day
  from: TimeHM
  to: TimeHM
  semester: Semester
}

export interface CourseEvent {
  id: string
  category: string
  lecturers: string[]
  location: string
  timeSlots: TimeSlot[]
}

export interface Course {
  id: string
  name: string
  events: CourseEvent[]
}

export interface UploadCoursesFile {
  courses: Course[]
}