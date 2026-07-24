import { Context } from "../../util";

export const name = "webhooks fuck";
export const aliases = [
  "webhooks delete",
  "webhooks remove",
  "webhooks del",
  "webhooks rem",
  "webhooks rm"
];

export default async function ({ message, args, api }: Context) {
  let url: URL;

  try {
    url = new URL(args.join("/"), "https://discord.com/api/v10/webhooks");
  } catch {
    return api.createMessage(message.channel_id, { content: "Invalid URL" });
  }

  if (
    url.hostname !== "discord.com" &&
    url.hostname !== "discordapp.com" &&
    url.hostname !== "ptb.discord.com" &&
    url.hostname !== "ptb.discordapp.com" &&
    url.hostname !== "canary.discord.com" &&
    url.hostname !== "canary.discordapp.com"
  )
    return api.createMessage(message.channel_id, { content: "Invalid URL" });

  const match = url.pathname.match(/\/webhooks\/(\d{17,19})\/([\w-]+)/);
  if (!match) return api.createMessage(message.channel_id, { content: "Invalid URL" });
  const [, id, token] = match;

  try {
    const webhook = await api.getWebhookWithToken(id, token);
    await api.createMessage(message.channel_id, {
      content: "Webhook:\n```json\n" + JSON.stringify(webhook, null, 2) + "```",
      allowed_mentions: { parse: [] }
    });

    await api.deleteWebhookWithToken(id, token);
    await api.createMessage(message.channel_id, { content: "Webhook deleted 👽" });
  } catch {
    api.createMessage(message.channel_id, { content: "Invalid webhook" });
  }
}
