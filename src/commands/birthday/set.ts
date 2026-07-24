import { Context, exactSnowflakeRegex } from "../../util";
import { birthdays, updateBirthdays, BirthdayEntry } from "../../store";
import { owners } from "../../config";

const mentionRegex = /^<@!?(\d{17,19})>$/;
const dateRegex = /^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/;

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const open = true;
export const name = "birthday set";
export const aliases = ["birthday add"];
export default async function ({ message, args, api }: Context) {
  let target = message.author.id;

  const mention = args[0]?.match(mentionRegex);
  if (mention || exactSnowflakeRegex.test(args[0] ?? "")) {
    if (!owners.includes(message.author.id))
      return api.createMessage(message.channel_id, {
        content: "👽 Only admins can set someone else's birthday",
        allowed_mentions: { parse: [] }
      });

    target = mention ? mention[1] : args[0];
    args.shift();
  }

  const match = args.join(" ").trim().match(dateRegex);
  if (!match)
    return api.createMessage(message.channel_id, {
      content: "Give me a date like `MM/DD` or `MM/DD/YYYY`",
      allowed_mentions: { parse: [] }
    });

  const month = parseInt(match[1]);
  const day = parseInt(match[2]);
  const year = match[3] ? parseInt(match[3].length === 2 ? "20" + match[3] : match[3]) : undefined;

  const date = new Date(Date.UTC(2000, month - 1, day));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day)
    return api.createMessage(message.channel_id, {
      content: "That's not a real date",
      allowed_mentions: { parse: [] }
    });

  const entry: BirthdayEntry = { month, day };
  if (year) entry.year = year;

  birthdays.users[target] = entry;
  updateBirthdays();

  api.createMessage(message.channel_id, {
    content: `🎂 Set <@${target}>'s birthday to **${monthNames[month - 1]} ${day}**${year ? ` **${year}**` : ""}`,
    allowed_mentions: { parse: [] }
  });
}
