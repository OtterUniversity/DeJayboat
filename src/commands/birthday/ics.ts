import { Context } from "../../util";
import { birthdays } from "../../store";
import { generateBirthdayICS } from "../../birthdayIcs";

export const open = true;
export const name = "birthday ics";
export const aliases = ["birthday ical", "birthdays ics"];
export default async function ({ message, api }: Context) {
  if (!Object.keys(birthdays.users).length)
    return api.createMessage(message.channel_id, {
      content: "No birthdays are set yet. Use `.birthday set MM/DD` to add yours!",
      allowed_mentions: { parse: [] }
    });

  const ics = await generateBirthdayICS();

  api.createMessage(
    message.channel_id,
    { content: "🎂 Here's the birthday calendar", allowed_mentions: { parse: [] } },
    [{ name: "birthdays.ics", data: ics, contentType: "text/calendar" }]
  );
}
