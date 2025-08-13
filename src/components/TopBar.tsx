import React, { useRef } from "react";
import { useScheduleStore } from "../store/scheduleStore";
import { useThemeStore } from "../store/themeStore";
import { useSettingsStore } from "../store/settingsStore";
import type { Course, UploadCoursesFile } from "../types";
import { useTranslation } from "react-i18next";

export function TopBar() {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const { loadCourses, clearCourses, resetAll } = useScheduleStore();
  const { theme } = useThemeStore();
  const {
    setSemester,
    language,
    setLanguage,
    semester,
    dir,
    sidebarCollapsed,
    toggleSidebar,
  } = useSettingsStore();

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as UploadCoursesFile | Course[];
      const courses = Array.isArray(data) ? data : data.courses;
      if (!Array.isArray(courses)) throw new Error("Invalid courses file");
      validateCourses(courses);
      loadCourses(courses);
    } catch (err) {
      alert("Failed to load courses JSON: " + (err as Error).message);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function validateCourses(courses: Course[]) {
    for (const c of courses) {
      if (!c.id || !c.name || !Array.isArray(c.events)) {
        throw new Error("Invalid course structure.");
      }
      for (const e of c.events) {
        if (!e.id || !e.category || !Array.isArray(e.timeSlots)) {
          throw new Error("Invalid event structure.");
        }
      }
    }
  }

  return (
    <div className="border-b dark:border-slate-700 bg-white dark:bg-slate-900">
      <div
        className={`mx-auto max-w-[1600px] px-4 h-14 flex items-center gap-3 justify-between`}
      >
        {/* Leading cluster: sidebar toggle + title + actions */}
        <div className="flex items-center gap-2">
          {/* Collapse/Expand sidebar button at the start of the top bar */}
          <button
            onClick={toggleSidebar}
            className="px-2 py-1.5 rounded border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            title={
              sidebarCollapsed
                ? t("sidebarExpand") || ""
                : t("sidebarCollapse") || ""
            }
          >
            {/* Use arrows pointing toward the sidebar's location: in LTR sidebar is left; in RTL it's right (due to flex-row-reverse layout) */}
            {
              sidebarCollapsed
                ? dir === "rtl"
                  ? "⟸"
                  : "⟹" // expand
                : dir === "rtl"
                ? "⟹"
                : "⟸" // collapse
            }
          </button>

          <div className="text-xl font-semibold">{t("appTitle")}</div>

          <button
            onClick={() => fileRef.current?.click()}
            className="px-3 py-1.5 rounded bg-sky-600 text-white hover:bg-sky-700"
            title={t("uploadCourses") || ""}
          >
            {t("uploadCourses")}
          </button>
          <input
            ref={fileRef}
            className="hidden"
            type="file"
            accept=".json,application/json"
            onChange={onFileChange}
          />
          <button
            onClick={resetAll}
            className="px-3 py-1.5 rounded bg-amber-500 text-white hover:bg-amber-600"
            title={t("resetSchedule") || ""}
          >
            {t("resetSchedule")}
          </button>
          <button
            onClick={clearCourses}
            className="px-3 py-1.5 rounded bg-rose-500 text-white hover:bg-rose-600"
            title={t("clearCourses") || ""}
          >
            {t("clearCourses")}
          </button>
        </div>

        {/* Trailing cluster: settings pinned to logical end */}
        <div className="flex items-center gap-2">
          {/* Semester switch */}
          <div className="flex items-center gap-1">
            <span className="text-sm">{t("semester")}:</span>
            <div className="inline-flex rounded border dark:border-slate-700 overflow-hidden">
              <button
                onClick={() => setSemester("A")}
                className={`px-2 py-1 text-sm ${
                  semester === "A"
                    ? "bg-sky-600 text-white"
                    : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {t("semA")}
              </button>
              <button
                onClick={() => setSemester("B")}
                className={`px-2 py-1 text-sm ${
                  semester === "B"
                    ? "bg-sky-600 text-white"
                    : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {t("semB")}
              </button>
            </div>
          </div>

          {/* Language picker */}
          <div className="flex items-center gap-1">
            <span className="text-sm">{t("language")}:</span>
            <select
              className="text-sm border rounded px-2 py-1 bg-white dark:bg-slate-900 dark:border-slate-700"
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
            >
              <option value="en">English</option>
              <option value="he">עברית</option>
            </select>
          </div>

          {/* Theme toggle */}
          <button
            onClick={useThemeStore.getState().toggleTheme}
            className="px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            title={
              theme === "dark" ? t("themeDark") || "" : t("themeLight") || ""
            }
          >
            <span className="inline-flex items-center gap-2">
              {theme === "dark"
                ? `🌙 ${t("themeDark")}`
                : `☀️ ${t("themeLight")}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
