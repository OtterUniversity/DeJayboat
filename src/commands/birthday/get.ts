import { Context, exactSnowflakeRegex } from "../../util";
import { birthdays } from "../../store";

const mentionRegex = /^<@!?(\d{17,19})>$/;

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const open = true;
export const name = "birthday get";
export const aliases = ["birthday mine", "birthdays get", "birthdays mine"];
export default async function ({ message, args, api }: Context) {
  let target = message.author.id;

  const mention = args[0]?.match(mentionRegex);
  if (mention || exactSnowflakeRegex.test(args[0] ?? "")) target = mention ? mention[1] : args[0];

  const entry = birthdays.users[target];
  const self = target === message.author.id;
  if (!entry)
    return api.createMessage(message.channel_id, {
      content: self
        ? "You haven't set your birthday yet. Use `.birthday set MM/DD` to add it!"
        : `<@${target}> hasn't set their birthday yet.`,
      allowed_mentions: { parse: [] }
    });

  api.createMessage(message.channel_id, {
    content: `🎂 ${self ? "Your" : `<@${target}>'s`} birthday is **${monthNames[entry.month - 1]} ${entry.day}${entry.year ? `, ${entry.year}` : ""}**`,
    allowed_mentions: { parse: [] }
  });
}
