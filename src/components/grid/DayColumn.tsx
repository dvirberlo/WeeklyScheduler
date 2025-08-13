import React, { useMemo } from "react";
import type { Course, CourseEvent, Day } from "../../types";
import { layoutIntervals } from "../../utils/time";
import { ScheduledEventBlock, UnscheduledEventBlock } from "./EventBlocks";
import { useScheduleStore } from "../../store/scheduleStore";
import { indexToLetters } from "../../utils/label";

export type GridEvent = {
  key: string;
  course: Course;
  event: CourseEvent;
  day: Day;
  fromMin: number;
  toMin: number;
  top: number;
  height: number;
  colorIdx: number;
};

export function DayColumn(props: {
  day: Day;
  scheduled: GridEvent[];
  unscheduled: GridEvent[];
  onClickSchedule: (course: Course, event: CourseEvent) => void;
  onClickUnschedule: (course: Course, event: CourseEvent) => void;
  hoverEventId: string | null;
  setHoverEventId: (id: string | null) => void;
  minMin: number;
  totalMins: number;
  ticks: number[];
}) {
  const {
    day,
    scheduled,
    unscheduled,
    onClickSchedule,
    onClickUnschedule,
    hoverEventId,
    setHoverEventId,
    minMin,
    totalMins,
    ticks,
  } = props;

  const laid = useMemo(() => {
    const items = unscheduled.map((u) => ({
      id: u.key,
      fromMin: u.fromMin,
      toMin: u.toMin,
      payload: u,
    }));
    return layoutIntervals(items);
  }, [unscheduled]);

  const unscheduledById = new Map(unscheduled.map((u) => [u.key, u]));

  return (
    <div className="relative h-full border-l dark:border-slate-700">
      {/* Hour grid lines */}
      {ticks.map((m) => {
        const top = ((m - minMin) / totalMins) * 100;
        return (
          <div
            key={`hline-${day}-${m}`}
            className="absolute left-0 right-0 border-t border-slate-200 dark:border-slate-700"
            style={{ top: `${top}%` }}
          />
        );
      })}

      {/* Scheduled events (parent sets position/height; child fills it) */}
      {scheduled.map((ev) => (
        <div
          key={`s-${ev.key}`}
          className="absolute"
          style={{
            top: `${ev.top}%`,
            height: `${ev.height}%`,
            left: 0,
            right: 0,
          }}
        >
          <ScheduledEventBlock
            colorIdx={ev.colorIdx}
            courseName={ev.course.name}
            event={ev.event}
            onUnschedule={() => onClickUnschedule(ev.course, ev.event)}
          />
        </div>
      ))}

      {/* Unscheduled events */}
      {laid.map((l) => {
        const ev = unscheduledById.get(l.id)!;
        const colLeftPct = (l.column / l.columns) * 100;
        const colWidthPct = (1 / l.columns) * 100;
        const hovered = hoverEventId === ev.event.id;
        return (
          <div
            key={`u-${ev.key}`}
            className="absolute px-1 transition-all duration-200 ease-out"
            style={{
              top: `${ev.top}%`,
              height: `${ev.height}%`,
              left: `${colLeftPct}%`,
              width: `${colWidthPct}%`,
            }}
          >
            <UnscheduledEventBlock
              colorIdx={ev.colorIdx}
              label={courseLetterLabel(ev.course.id)}
              hovered={hovered}
              onSchedule={() => onClickSchedule(ev.course, ev.event)}
              onHover={(h) => setHoverEventId(h ? ev.event.id : null)}
            />
          </div>
        );
      })}
    </div>
  );
}

function courseLetterLabel(courseId: string) {
  const { selectedCourseIds } = useScheduleStore.getState();
  const selected = selectedCourseIds as string[];
  const idx = selected.indexOf(courseId);
  return idx >= 0 ? indexToLetters(idx) : "?";
}
