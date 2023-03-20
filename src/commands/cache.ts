import { Context } from "../util";
import robert from "robert";

export const open = true;
export const name = "cache";
export const aliases = ["cacheuser"];
export default async function ({ message, args, api }: Context) {
  const userId = args[0];
  if (!userId || !/^\d+/.test(userId)) return api.createMessage(message.channel_id, { content: "Invalid user" });

  try {
    await api.getGuildMember(message.guild_id, userId);
    await api.createMessage(message.channel_id, { content: "User is in the server" });
    return;
  } catch {}

  await api.createGuildBan(message.guild_id, userId, {
    deleteMessageDays: 0,
    reason: ".cache by " + message.author.username + "#" + message.author.discriminator
  });

  await api.removeGuildBan(message.guild_id, userId);
  await api.createMessage(message.channel_id, { content: `<@${userId}> has been cached` });
}
