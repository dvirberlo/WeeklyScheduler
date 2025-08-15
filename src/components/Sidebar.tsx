import React, { useMemo, useState } from "react";
import type { Course } from "../types";
import { courseScheduleStatus, canScheduleEvent } from "../store/scheduleStore";
import { useSettingsStore } from "../store/settingsStore";
import { useTranslation } from "react-i18next";
import { COLORS, BORDER_COLORS } from "../ui/theme";
import { parseHM } from "../utils/time";

export function Sidebar(props: {
  courses: Course[];
  selectedCourseIds: string[];
  scheduled: Record<string, Record<string, string>>;
  onToggleCourse: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}) {
  const { t } = useTranslation();
  const { semester, dir } = useSettingsStore();
  const {
    courses,
    selectedCourseIds,
    scheduled,
    onToggleCourse,
    onSelectAll,
    onClearSelection,
  } = props;

  // Basic text search
  const [query, setQuery] = useState("");

  // Filter state
  const [showFilters, setShowFilters] = useState(true);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set()); // stores English day names
  const [timeFrom, setTimeFrom] = useState<string>(""); // HH:MM
  const [timeTo, setTimeTo] = useState<string>("");

  function toggleDay(day: string) {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  function clearFilters() {
    setSelectedDays(new Set());
    setTimeFrom("");
    setTimeTo("");
    setQuery("");
  }

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();

    // Pre-compute numeric bounds for time filtering
    const hasTimeFilter = timeFrom !== "" || timeTo !== "";
    const fromMin = timeFrom ? parseHM(timeFrom as any) : null;
    const toMin = timeTo ? parseHM(timeTo as any) : null;

    function courseMatches(c: Course): boolean {
      // Day / time filtering considers only timeSlots for current semester
      let anySlotMatches = false;
      for (const e of c.events) {
        for (const ts of e.timeSlots) {
          if (ts.semester !== semester) continue;
          // Day filter
          // (User selected days stored in English day names)
          if (selectedDays.size > 0 && !selectedDays.has(ts.day)) continue;

          // Time filter (overlap logic)
          if (hasTimeFilter) {
            const slotFrom = parseHM(ts.from as any);
            const slotTo = parseHM(ts.to as any);
            // Build desired range [filterFrom, filterTo]
            // If only one side given, treat as open-ended.
            if (fromMin !== null && slotTo <= fromMin) continue;
            if (toMin !== null && slotFrom >= toMin) continue;
          }
          anySlotMatches = true;
          break;
        }
        if (anySlotMatches) break;
      }
      if (selectedDays.size > 0 || hasTimeFilter) {
        if (!anySlotMatches) return false;
      }
      // Text query: match course name or id
      if (q) {
        const name = c.name.toLowerCase();
        const id = c.id.toLowerCase();
        if (!name.includes(q) && !id.includes(q)) return false;
      }
      return true;
    }

    const base = courses.filter(courseMatches);

    // Selected-first sorting remains
    const selectedSet = new Set(selectedCourseIds);
    const sorted = [...base].sort((a, b) => {
      const aSel = selectedSet.has(a.id) ? 0 : 1;
      const bSel = selectedSet.has(b.id) ? 0 : 1;
      if (aSel !== bSel) return aSel - bSel;
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }, [
    courses,
    selectedCourseIds,
    query,
    selectedDays,
    timeFrom,
    timeTo,
    semester,
  ]);

  const selectedSet = useMemo(
    () => new Set(selectedCourseIds),
    [selectedCourseIds]
  );

  function isCourseBlocked(course: Course): boolean {
    const status = courseScheduleStatus(course, scheduled);
    if (status === "full") return false;
    if (!selectedSet.has(course.id)) return false;

    const chosenCats = new Set(Object.keys(scheduled[course.id] || {}));
    const allCats = Array.from(new Set(course.events.map((e) => e.category)));

    for (const cat of allCats) {
      if (chosenCats.has(cat)) continue;
      const anyEligible = course.events.some(
        (e) =>
          e.category === cat &&
          canScheduleEvent(e, scheduled, courses, semester)
      );
      if (anyEligible) return false;
    }
    return allCats.some((c) => !chosenCats.has(c));
  }

  const DaysEnglishOrdered: string[] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <aside className="w-80 shrink-0 border dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 flex flex-col min-h-0">
      {/* Search + Filters Header */}
      <div className="p-3 pb-2 space-y-3 border-b dark:border-slate-700">
        <div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder") || "Search..."}
            className="w-full text-sm border rounded px-2 py-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">{t("filters")}</span>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="text-xs px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {showFilters ? "−" : "+"}
            </button>
          </div>
          {showFilters && (
            <div className="space-y-3">
              {/* Days filter */}
              <div>
                <div className="text-xs font-semibold mb-1">
                  {t("daysFilter")}
                </div>
                <div className="flex flex-wrap gap-1">
                  {DaysEnglishOrdered.map((day) => {
                    const active = selectedDays.has(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-2 py-0.5 rounded text-xs border dark:border-slate-700
                          ${
                            active
                              ? "bg-sky-600 text-white border-sky-600"
                              : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                          }`}
                        title={t(`days.${day}`) as string}
                      >
                        {t(`days.${day}`)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time range filter */}
              <div>
                <div className="text-xs font-semibold mb-1">
                  {t("timeFilter")}
                </div>
                <div className={`flex items-center gap-2`}>
                  <label className="flex items-center gap-1 text-xs">
                    <span>{t("from")}:</span>
                    <input
                      type="time"
                      value={timeFrom}
                      onChange={(e) => setTimeFrom(e.target.value)}
                      className="border rounded px-1 py-0.5 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-xs">
                    <span>{t("to")}:</span>
                    <input
                      type="time"
                      value={timeTo}
                      onChange={(e) => setTimeTo(e.target.value)}
                      className="border rounded px-1 py-0.5 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={clearFilters}
                  className="text-xs px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100"
                >
                  {t("clearFilters")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions / summary */}
      <div className="px-3 py-2 flex items-center justify-between">
        <div className="text-xs text-slate-600 dark:text-slate-400">
          {t("showing")} {filteredSorted.length} {t("of")} {courses.length}
        </div>
        <div className="flex gap-2">
          <button
            className="text-xs px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100"
            onClick={onSelectAll}
          >
            {t("selectAll")}
          </button>
          <button
            className="text-xs px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100"
            onClick={onClearSelection}
          >
            {t("clear")}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 px-3 pb-3 pr-4">
        {courses.length === 0 && (
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {t("uploadCourses")}
          </div>
        )}
        {courses.length > 0 && filteredSorted.length === 0 && (
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {t("noMatches")}
          </div>
        )}
        {filteredSorted.map((c) => {
          const selected = selectedSet.has(c.id);
          const colorIdx = selected
            ? selectedCourseIds.indexOf(c.id) % COLORS.length
            : -1;
          const status = courseScheduleStatus(c, scheduled);
          const blocked = isCourseBlocked(c);

          return (
            <label
              key={c.id}
              className={`flex items-start gap-2 p-2 border rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer ${
                selected && colorIdx >= 0
                  ? BORDER_COLORS[colorIdx]
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleCourse(c.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {selected && colorIdx >= 0 ? (
                    <span
                      className={`w-3 h-3 rounded ${COLORS[colorIdx]}`}
                      title={`Course color`}
                    ></span>
                  ) : (
                    <span className="w-3 h-3 rounded border border-slate-200 dark:border-slate-700"></span>
                  )}
                  <div className="font-medium">{c.name}</div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {t("id")}: {c.id}
                </div>
                <div className="mt-1">
                  {status === "full" ? (
                    <StatusPill status="full" />
                  ) : blocked ? (
                    <BlockedPill />
                  ) : status === "partial" ? (
                    <StatusPill status="partial" />
                  ) : (
                    <StatusPill status="none" />
                  )}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <div className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 border-t dark:border-slate-700">
        {t("tipColor")}
      </div>
    </aside>
  );
}

function StatusPill({ status }: { status: "none" | "partial" | "full" }) {
  const { t } = useTranslation();
  if (status === "full")
    return (
      <span className="inline-block text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
        {t("fullyScheduled")}
      </span>
    );
  if (status === "partial")
    return (
      <span className="inline-block text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
        {t("partiallyScheduled")}
      </span>
    );
  return (
    <span className="inline-block text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      {t("notScheduled")}
    </span>
  );
}

function BlockedPill() {
  const { t } = useTranslation();
  return (
    <span className="inline-block text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
      {t("blocked")}
    </span>
  );
}
