import { Context, exactSnowflakeRegex } from "../../util";
import { DiscordSnowflake } from "@sapphire/snowflake";
import { APIMessage } from "discord-api-types/v9";
import robert from "robert";

const Snowflake = DiscordSnowflake;

export const name = "snowflake";
export const aliases = ["snowflakeinfo", "si", "typeof", "instanceof"];
async function resolve(snowflake: string, api: Context["api"]): Promise<string> {
  try {
    const user = await api.getUser(snowflake);
    if(user.discriminator != '0') return "User (`" + user.username + "#" + user.discriminator + "`)"
    else return "User `(@" + user.username + "`)"
  } catch {}

  try {
    const guild = await api.getGuildPreview(snowflake);
    return "Guild (`" + guild.name + "`)";
  } catch {}

  try {
    await api.getGuildChannels(snowflake);
  } catch ({ status }) {
    if (status === 403) return "Guild";
  }

  try {
    const channel = await api.getChannel(snowflake);
    return "Channel (`" + channel.name + "`)";
  } catch ({ status }) {
    if (status === 403) return "Channel";
  }

  try {
    const application = await robert
      .get("https://discord.com/api/v9/applications/" + snowflake + "/rpc")
      .send("json");
    return "Application (`" + application.name + "`)";
  } catch {}

  try {
    const webhook = await api.getWebhook(snowflake);
    return "Webhook (" + webhook.name + ")";
  } catch ({ status }) {
    if (status === 403) return "Webhook";
  }

  try {
    const status = await robert
      .head("https://cdn.discordapp.com/emojis/" + snowflake + ".png")
      .send("status");
    if (status === 200) return "Emoji";
  } catch {}

  return "Unknown";
}

export default async function ({ message, args, api }: Context) {
  const [snowflake] = args;
  if (!snowflake) return api.createMessage(message.channel_id, { content: "No snowflake" });
  if (!exactSnowflakeRegex.test(snowflake))
    return api.createMessage(message.channel_id, { content: "Invalid snowflake" });

  const data = Snowflake.deconstruct(snowflake);
  const seconds = Math.round(Number(data.timestamp) / 1000);

  let content = "❄️ <t:" + seconds + ":F><t:" + seconds + ":R>";
  content += "\nWorker: " + data.workerId;
  content += "\nProcess: " + data.processId;
  content += "\nIncrement: " + data.increment;

  const msg: APIMessage = await api.createMessage(message.channel_id, { content });
  const type = await resolve(snowflake, api);
  content += "\nType: " + type;

  api.editMessage(message.channel_id, msg.id, {
    content
  });
}
