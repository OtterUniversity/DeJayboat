import { Context, color } from "../../util";
import { birthdays } from "../../store";

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

  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  const upcoming = entries
    .map(([id, entry]) => {
      let next = Date.UTC(now.getUTCFullYear(), entry.month - 1, entry.day);
      if (next < today) next = Date.UTC(now.getUTCFullYear() + 1, entry.month - 1, entry.day);
      return { id, next };
    })
    .sort((a, b) => a.next - b.next)
    .slice(0, 3);

  const description = upcoming
    .map(({ id, next }) => {
      const ts = Math.floor(next / 1000);
      return `<@${id}> — <t:${ts}:D> (<t:${ts}:R>)`;
    })
    .join("\n");

  api.createMessage(message.channel_id, {
    embeds: [{ color, title: "🎂 Upcoming Birthdays", description }],
    allowed_mentions: { parse: [] }
  });
}
