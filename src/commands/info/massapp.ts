import { Context, snowflakeRegex } from "../../util";
import { APIMessage, RESTGetAPIChannelWebhooksResult } from "discord-api-types";

export const name = "massapp";
export const aliases = ["appinfo", "ai"];
export default async function ({ message, args, api }: Context) {
  const input = args.join(" ");
  const ids = input.match(snowflakeRegex);
  if (!ids) return api.createMessage(message.channel_id, { content: "No IDs found" });
  if (ids.length > 100)
    return api.createMessage(message.channel_id, {
      content: "Cannot lookup more than 100 applications"
    });

  const webhooks: RESTGetAPIChannelWebhooksResult = await api.getChannelWebhooks(
    message.channel_id
  );

  let webhook = webhooks.find(({ token }) => token);
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

    await api.deleteMessage(proxy.channel_id, proxy.id);
    await new Promise(res => setTimeout(res, 1000));
  }
}