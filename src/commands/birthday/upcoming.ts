import { Context, color, easternToday } from "../../util";
import { birthdays } from "../../store";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const open = true;
export const name = "birthday upcoming";
export const aliases = ["birthday next", "birthday list"];
export default async function ({ message, api }: Context) {
  const entries = Object.entries(birthdays.users);
  if (!entries.length)
    return api.createMessage(message.channel_id, {
      content: "No birthdays are set yet. Use `.birthday set MM/DD` to add yours!",
      allowed_mentions: { parse: [] }
    });

  const { year, month, day } = easternToday();
  const today = Date.UTC(year, month - 1, day);

  const upcoming = entries
    .map(([id, entry]) => {
      let next = Date.UTC(year, entry.month - 1, entry.day);
      if (next < today) next = Date.UTC(year + 1, entry.month - 1, entry.day);
      return { id, entry, next };
    })
    .sort((a, b) => a.next - b.next)
    .slice(0, 3);

  const description = upcoming
    .map(({ id, entry, next }) => {
      const days = Math.round((next - today) / 86400000);
      const when = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
      return `<@${id}> — ${monthNames[entry.month - 1]} ${entry.day} (${when})`;
    })
    .join("\n");

  api.createMessage(message.channel_id, {
    embeds: [{ color, title: "🎂 Upcoming Birthdays", description }],
    allowed_mentions: { parse: [] }
  });
}
