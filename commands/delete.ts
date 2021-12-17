import { Context, exactSnowflakeRegex } from "../util";
import { guilds, updateGuilds } from "../store";

export default async function ({ message, args, api }: Context) {
  const id = args.shift();
  if (!exactSnowflakeRegex.test(id))
    return api.createMessage(message.channel_id, {
      content: "Invalid snowflake"
    });

  const current = guilds[id];
  if (!current)
    return api.createMessage(message.channel_id, {
      content: "`" + id + "` doesn't exist in the ||(json)|| database"
    });

  delete guilds[id];
  updateGuilds;

  api.createMessage(message.channel_id, {
    content: "Deleted `" + id + "`",
    allowedMentions: { parse: [] }
  });
}