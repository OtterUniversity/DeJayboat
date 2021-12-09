import { Context, snowflakeRegex } from "../util";
import { APIMessage, APIWebhook } from "discord-api-types";

export default async function ({ message, args, api }: Context) {
  const input = args.join(" ");
  const ids = input.match(snowflakeRegex);
  if (!ids) return api.createMessage(message.channel_id, { content: "No IDs found" });
  if (ids.length > 100)
    return api.createMessage(message.channel_id, {
      content: "Cannot lookup more than 100 applications"
    });

  let [webhook]: [APIWebhook] = await api.getChannelWebhooks(message.channel_id);
  webhook ??= await api.createWebhook(message.channel_id, { name: "(real)" });

  for await (const id of ids) {
    const proxy: APIMessage = await api.executeWebhook(
      webhook.id,
      webhook.token,
      {
        username: "(real)",
        avatarUrl: "https://cdn.discordapp.com/emojis/808831739614724186.png",
        content: "!!appinfo " + id
      },
      { wait: true }
    );

    await api.deleteWebhookMessage(webhook.id, webhook.token, proxy.id);
  }
}