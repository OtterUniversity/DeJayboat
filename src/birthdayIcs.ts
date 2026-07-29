import { writeFile, mkdir } from "fs/promises";
import { homedir } from "os";
import { dirname, join } from "path";

import { birthdays } from "./store";
import { getUser } from "./rest";

export const icsPath = join(homedir(), "server", "static", "djbirthdays.ics");

function escapeICS(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export async function generateBirthdayICS() {
  const entries = Object.entries(birthdays.users);
  const users = await Promise.all(entries.map(([id]) => getUser(id).catch(() => null)));

  const now = new Date();
  const stamp =
    now.getUTCFullYear().toString().padStart(4, "0") +
    (now.getUTCMonth() + 1).toString().padStart(2, "0") +
    now.getUTCDate().toString().padStart(2, "0") +
    "T" +
    now.getUTCHours().toString().padStart(2, "0") +
    now.getUTCMinutes().toString().padStart(2, "0") +
    now.getUTCSeconds().toString().padStart(2, "0") +
    "Z";

  const events = entries.map(([id, entry], i) => {
    const name = users[i]?.username ?? id;
    const year = entry.year ?? 2000;
    const dtstart =
      year.toString().padStart(4, "0") +
      entry.month.toString().padStart(2, "0") +
      entry.day.toString().padStart(2, "0");

    return [
      "BEGIN:VEVENT",
      `UID:birthday-${id}@dejayboat`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      "RRULE:FREQ=YEARLY",
      "SUMMARY:🎂 " + escapeICS(name) + "'s Birthday",
      "END:VEVENT"
    ].join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DeJayboat//Birthdays//EN",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR"
  ].join("\r\n");
}

export async function writeBirthdayICS() {
  const ics = await generateBirthdayICS();
  // await mkdir(dirname(icsPath), { recursive: true });
  await writeFile(icsPath, ics);
}
