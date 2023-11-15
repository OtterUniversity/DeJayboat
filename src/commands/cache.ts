import { Context } from "../util";
import robert from "robert";

export const open = true;
export const name = "cache";
export const aliases = ["cacheuser"];
export default async function ({ message, args, api }: Context) {
  const userId = args[0];
  if (!userId || !/^\d+$/.test(userId)) return api.createMessage(message.channel_id, { content: "Invalid user" });

  try {
    await api.getUser(userId);
  } catch {
    await api.createMessage(message.channel_id, { content: "kys" });
    return;
  }

  try {
    await api.getGuildMember(message.guild_id, userId);
    await api.createMessage(message.channel_id, { content: "User is in the server" });
    return;
  } catch {}

  try {
    await api.getGuildBan(message.guild_id, userId);
    // if they're already banned, ban and unban
    await api.removeGuildBan(message.guild_id, userId);
    await api.createGuildBan(message.guild_id, userId, {
      deleteMessageDays: 0,
      reason: ".cache by " + message.author.username + "#" + message.author.discriminator
    });
  } catch {
    // if they arent banned, ban and unban
    await api.createGuildBan(message.guild_id, userId, {
      deleteMessageDays: 0,
      reason: ".cache by " + message.author.username + "#" + message.author.discriminator
    });
    await api.removeGuildBan(message.guild_id, userId);
  }

  await api.createMessage(message.channel_id, { content: `<@${userId}> has been cached` });
}
