import React, { useEffect, useMemo } from "react";
import "./i18n";
import {
  useScheduleStore,
  getSelectedCourses,
  getScheduledEventIdsMap,
  computeDefaultTimeRangeIfAuto,
} from "./store/scheduleStore";
import { useThemeStore } from "./store/themeStore";
import { useSettingsStore } from "./store/settingsStore";
import i18n from "./i18n";
import { TopBar } from "./components/TopBar";
import { Sidebar } from "./components/Sidebar";
import { WeeklyGrid } from "./components/WeeklyGrid";

export default function App() {
  const sched = useScheduleStore();
  const theme = useThemeStore((s) => s.theme);
  const { language, dir, semester, sidebarCollapsed } = useSettingsStore();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta)
      meta.setAttribute("content", theme === "dark" ? "#0b1324" : "#0ea5e9");
  }, [theme]);

  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

  const selectedCourses = getSelectedCourses(sched);
  const scheduledEventIds = useMemo(
    () => getScheduledEventIdsMap(sched),
    [sched.scheduled]
  );
  const derivedRange = computeDefaultTimeRangeIfAuto(sched, semester);
  const timeRange = sched.timeRange.auto
    ? { ...derivedRange, auto: true }
    : sched.timeRange;

  return (
    <div className="flex flex-col h-screen">
      <TopBar />
      <div className={`flex flex-1 min-h-0 gap-4 p-4`}>
        {!sidebarCollapsed && (
          <Sidebar
            courses={sched.courses}
            selectedCourseIds={sched.selectedCourseIds}
            scheduled={sched.scheduled}
            onToggleCourse={sched.toggleCourse}
            onSelectAll={sched.selectAll}
            onClearSelection={sched.clearSelection}
          />
        )}
        <div className="flex-1 min-w-0">
          <WeeklyGrid
            selectedCourses={selectedCourses}
            scheduledEventIds={scheduledEventIds}
            scheduledMap={sched.scheduled}
            timeRange={timeRange}
          />
        </div>
      </div>
    </div>
  );
}
