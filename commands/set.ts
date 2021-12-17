import { Context, exactSnowflakeRegex } from "../util";
import { guilds, updateGuilds } from "../store";

export default async function ({ message, args, api }: Context) {
  const id = args.shift();
  const name = args.join(" ");
  if (!exactSnowflakeRegex.test(id))
    return api.createMessage(message.channel_id, {
      content: "Invalid snowflake"
    });
  if (!name)
    return api.createMessage(message.channel_id, {
      content: "No name specified"
    });

  const current = guilds[id];
  if (current)
    return api.createMessage(message.channel_id, {
      content:
        "`" +
        id +
        "` is already set to **" +
        name +
        "**, please delete it with `.delete " +
        id +
        "` first",
      allowedMentions: { parse: [] }
    });

  guilds[id] = name;

  updateGuilds();
  api.createMessage(message.channel_id, {
    content: "Set `" + id + "` to **" + name + "**",
    allowedMentions: { parse: [] }
  });
}