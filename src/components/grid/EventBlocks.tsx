import React from "react";
import type { CourseEvent } from "../../types";
import {
  COLORS,
  TEXT_COLORS,
  DARK_TEXT_COLORS,
  BORDER_COLORS,
} from "../../ui/theme";

export function ScheduledEventBlock(props: {
  colorIdx: number;
  courseName: string;
  event: CourseEvent;
  onUnschedule: () => void;
}) {
  const { colorIdx, courseName, event, onUnschedule } = props;
  // Fill the entire parent wrapper height/width; parent controls absolute positioning
  return (
    <div className="h-full w-full px-1">
      <button
        onClick={onUnschedule}
        className={`w-full h-full text-left px-2 py-1 rounded text-white ${COLORS[colorIdx]} bg-opacity-90 hover:bg-opacity-100 transition-all duration-300 ease-out shadow-sm`}
        title="Click to unschedule"
      >
        <div className="text-[11px] font-semibold flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded bg-white/90"></span>
          {courseName}
        </div>
        <div className="text-[11px]">{event.category}</div>
        <div className="text-[10px] text-white/90 line-clamp-1">
          {event.lecturers.join(", ")}
        </div>
        <div className="text-[10px] text-white/90 line-clamp-1">
          {event.location}
        </div>
      </button>
    </div>
  );
}

export function UnscheduledEventBlock(props: {
  colorIdx: number;
  label: string;
  hovered: boolean;
  onSchedule: () => void;
  onHover: (hover: boolean) => void;
}) {
  const { colorIdx, label, hovered, onSchedule, onHover } = props;

  const base =
    `w-full h-full text-left rounded shadow-sm border ${BORDER_COLORS[colorIdx]} ` +
    `transition-all duration-200 ease-out transform-gpu px-1`;
  const filled = `${COLORS[colorIdx]} text-white bg-opacity-95 ring-2 ring-offset-1 ring-slate-300 dark:ring-slate-600 scale-[1.01]`;
  const outlined =
    `bg-transparent ${TEXT_COLORS[colorIdx]} ${DARK_TEXT_COLORS[colorIdx]} ` +
    `hover:${COLORS[colorIdx]} hover:text-white hover:bg-opacity-95 ` +
    `hover:scale-[1.01] hover:ring-2 hover:ring-offset-1 hover:ring-slate-300 dark:hover:ring-slate-600`;

  return (
    <button
      onClick={onSchedule}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={`${base} ${hovered ? filled : outlined}`}
    >
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-sm font-bold leading-none">{label}</span>
      </div>
    </button>
  );
}
