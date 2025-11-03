import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { parse } from "csv-parse/sync";

const hebDayToEnglish = new Map([
  ["א", "Sunday"],
  ["ב", "Monday"],
  ["ג", "Tuesday"],
  ["ד", "Wednesday"],
  ["ה", "Thursday"],
  ["ו", "Friday"],
  ["ש", "Saturday"],
]);

function usageAndExit(msg) {
  if (msg) console.error("Error:", msg);
  console.error(
    "Usage: node scripts/merge-csv.js <input-folder> [--out out.json] [--pretty]"
  );
  process.exit(msg ? 1 : 0);
}

const args = process.argv.slice(2);
if (args.length < 1) usageAndExit();
const inputDir = args[0];
let outPath = null;
let pretty = false;
for (let i = 1; i < args.length; i++) {
  const a = args[i];
  if (a === "--pretty") pretty = true;
  else if (a === "--out") {
    outPath = args[i + 1];
    i++;
  } else {
    usageAndExit(`Unknown argument: ${a}`);
  }
}

function splitSemi(cell) {
  if (!cell) return [];
  // Also remove trailing/leading whitespace and empty tokens
  return cell
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

function cleanHebToken(token) {
  if (!token) return "";
  return token.replace(/['"]/g, "").trim();
}

function parseDays(dayCell) {
  // Multi-day: "ב';ד'" or "ב'" (note: may be quoted or not)
  return splitSemi(dayCell)
    .map(cleanHebToken)
    .map((token) => hebDayToEnglish.get(token) || null)
    .filter(Boolean);
}

function parseSemesters(semCell) {
  // Multi-semester: "סמסטר א';סמסטר ב';"
  return splitSemi(semCell)
    .map(cleanHebToken)
    .map((s) => (s.includes("א") ? "A" : s.includes("ב") ? "B" : null))
    .filter(Boolean);
}

function parseHours(hoursCell) {
  // Multi-hour: "12:00 - 14:00;10:00 - 12:00;"
  return splitSemi(hoursCell)
    .map((s) => {
      const m = s.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
      if (!m) return null;
      const from = normalizeHM(m[1]);
      const to = normalizeHM(m[2]);
      if (from && to) return { from, to };
      return null;
    })
    .filter(Boolean);
}

function normalizeHM(hm) {
  if (!hm) return null;
  const [h, m] = hm.split(":").map((x) => x.trim());
  if (h == null || m == null) return null;
  const hh = String(Number(h)).padStart(2, "0");
  const mm = String(Number(m)).padStart(2, "0");
  return `${hh}:${mm}`;
}

function pick(obj, keys) {
  for (const k of keys) {
    if (obj[k] != null && obj[k] !== "") return obj[k];
  }
  return "";
}

function pushUniqueTimeSlot(arr, slot) {
  if (!slot || !slot.day || !slot.from || !slot.to || !slot.semester) return;
  const exists = arr.some(
    (s) =>
      s.day === slot.day &&
      s.from === slot.from &&
      s.to === slot.to &&
      s.semester === slot.semester
  );
  if (!exists) arr.push(slot);
}

function getOrCreateCourse(map, id, name) {
  if (!map.has(id)) {
    map.set(id, { id, name, events: [] });
  } else {
    const c = map.get(id);
    if (!c.name && name) c.name = name;
    if (name && name.length > c.name.length) c.name = name;
  }
  return map.get(id);
}

function getOrCreateEvent(course, eventId, category, lecturers, location) {
  let ev = course.events.find((e) => e.id === eventId);
  if (!ev) {
    ev = {
      id: eventId,
      category,
      lecturers: lecturers && lecturers.length ? lecturers : [],
      location: location || "",
      timeSlots: [],
    };
    course.events.push(ev);
  } else {
    if (lecturers && lecturers.length) {
      for (const l of lecturers) {
        if (!ev.lecturers.includes(l)) ev.lecturers.push(l);
      }
    }
    if (!ev.location && location) ev.location = location;
  }
  return ev;
}

// Zips (by index) days, hours, semesters. Falls back to single value if any array is shorter.
function buildTimeSlots(days, hours, semesters) {
  const nslots = Math.max(days.length, hours.length, semesters.length);
  if (nslots === 0) return [];
  const res = [];
  for (let i = 0; i < nslots; i++) {
    const day = days.length ? days[i % days.length] : undefined;
    const hour = hours.length ? hours[i % hours.length] : undefined;
    const semester = semesters.length
      ? semesters[i % semesters.length]
      : undefined;
    if (day && hour && semester) {
      res.push({ day, from: hour.from, to: hour.to, semester });
    }
  }
  return res;
}

const dayOrder = new Map([
  ["Sunday", 0],
  ["Monday", 1],
  ["Tuesday", 2],
  ["Wednesday", 3],
  ["Thursday", 4],
  ["Friday", 5],
  ["Saturday", 6],
]);

function sortTimeSlots(slots) {
  slots.sort((a, b) => {
    const da = dayOrder.get(a.day) ?? 0;
    const db = dayOrder.get(b.day) ?? 0;
    if (da !== db) return da - db;
    return (
      a.from.localeCompare(b.from) ||
      a.to.localeCompare(b.to) ||
      a.semester.localeCompare(b.semester)
    );
  });
}

async function collectCsvFiles(dir) {
  const files = await readdir(dir);
  const out = [];
  for (const f of files) {
    const full = path.join(dir, f);
    const st = await stat(full);
    if (st.isDirectory()) {
      const nested = await collectCsvFiles(full);
      out.push(...nested);
    } else if (f.toLowerCase().endsWith(".csv")) {
      out.push(full);
    }
  }
  return out;
}

async function main() {
  const files = await collectCsvFiles(inputDir);
  if (files.length === 0) {
    console.error("No CSV files found in", inputDir);
    process.exit(1);
  }

  const coursesMap = new Map();

  for (const file of files) {
    const buf = await readFile(file);
    const text = buf.toString("utf8");
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      relax_quotes: true,
      relax_column_count: true,
      trim: true,
    });

    for (const row of records) {
      const courseId = String(pick(row, ["קורס"])).trim();
      if (!courseId) continue;

      const courseName = String(pick(row, ["שם קורס"])).trim();
      const group = String(pick(row, ["קבוצה"])).trim();
      const lecturersArr = splitSemi(row["מרצה"]);
      const categoriesArr = splitSemi(row["סוג מפגש"]);
      const semestersArr = parseSemesters(row["סמסטר"]);
      const daysArr = parseDays(row["יום"]);
      const hoursArr = parseHours(row["שעות"]);
      const details = String(pick(row, ["פרטים"])).trim();

      // For each combination of category, build an event
      for (
        let catIdx = 0;
        catIdx < Math.max(categoriesArr.length, 1);
        catIdx++
      ) {
        const category = categoriesArr[catIdx] || "";
        const eventId = `${courseId}-${group || "XX"}-${catIdx}`;
        const course = getOrCreateCourse(coursesMap, courseId, courseName);
        const ev = getOrCreateEvent(
          course,
          eventId,
          category,
          lecturersArr,
          details || ""
        );

        // Compose time slots for all combinations of day, hour, semester
        const slots = buildTimeSlots(daysArr, hoursArr, semestersArr);
        for (const s of slots) pushUniqueTimeSlot(ev.timeSlots, s);
        sortTimeSlots(ev.timeSlots);
      }
    }
  }

  for (const c of coursesMap.values()) {
    c.events.sort((a, b) => a.id.localeCompare(b.id));
  }

  const output = { courses: Array.from(coursesMap.values()) };
  const json = pretty
    ? JSON.stringify(output, null, 2)
    : JSON.stringify(output);
  if (outPath) {
    await writeFile(outPath, json, "utf8");
    console.log(`Wrote ${outPath} (${output.courses.length} courses)`);
  } else {
    process.stdout.write(json);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
