import { Context } from "../util";

export const open = true;
export const name = "cache";
export const aliases = ["cacheuser"];
export default async function ({ message, args, api }: Context) {
  const userId = args[0];
  if (!userId || !/^\d+$/.test(userId)) return api.createMessage(message.channel_id, { content: "Invalid user" });

  const isValidUser = await api
    .getUser(userId)
    .then(() => true)
    .catch(() => false);

  if (!isValidUser) {
    await api.createMessage(message.channel_id, { content: "kys" });
    return;
  }

  const isInServer = await api
    .getGuildMember(message.guild_id, userId)
    .then(() => true)
    .catch(() => false);

  if (isInServer) {
    await api.createMessage(message.channel_id, { content: "User is in the server" });
    return;
  }

  const { isBanned, ban } = await api
    .getGuildBan(message.guild_id, userId)
    .then(ban => ({ isBanned: true, ban }))
    .catch(() => ({ isBanned: false, ban: null }));

  if (isBanned) {
    // if they're already banned, unban and ban
    await api.removeGuildBan(message.guild_id, userId);
    await api.createGuildBan(message.guild_id, userId, {
      deleteMessageDays: 0,
      reason: ban.reason
    });
  } else {
    // if they arent banned, ban and unban
    await api.createGuildBan(message.guild_id, userId, {
      deleteMessageDays: 0,
      reason: ".cache by " + message.author.username + "#" + message.author.discriminator
    });
    await api.removeGuildBan(message.guild_id, userId);
  }

  await api.createMessage(message.channel_id, { content: `<@${userId}> has been cached` });
}
