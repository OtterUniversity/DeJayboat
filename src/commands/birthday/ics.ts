import { Context } from "../../util";
import { birthdays } from "../../store";

function escapeICS(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export const open = true;
export const name = "birthday ics";
export const aliases = ["birthday ical", "birthdays ics"];
export default async function ({ message, api }: Context) {
  const entries = Object.entries(birthdays.users);
  if (!entries.length)
    return api.createMessage(message.channel_id, {
      content: "No birthdays are set yet. Use `.birthday set MM/DD` to add yours!",
      allowed_mentions: { parse: [] }
    });

  const users = await Promise.all(entries.map(([id]) => api.getUser(id).catch(() => null)));

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

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DeJayboat//Birthdays//EN",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR"
  ].join("\r\n");

  api.createMessage(
    message.channel_id,
    { content: "🎂 Here's the birthday calendar", allowed_mentions: { parse: [] } },
    [{ name: "birthdays.ics", data: ics, contentType: "text/calendar" }]
  );
}
