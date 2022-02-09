import { Context } from "../../util";
import robert from "robert";

export const name = "webhooks fuck";
export const aliases = [
  "webhooks delete",
  "webhooks remove",
  "webhooks del",
  "webhooks rem",
  "webhooks rm"
];

export default function ({ message, args, api }: Context) {
  let url: URL;

  try {
    url = new URL(args.join("/"), "https://discord.com/api/v9/webhooks");
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

  robert
    .get(url)
    .send("json")
    .then(async webhook => {
      await api.createMessage(message.channel_id, {
        content: "Webhook:\n```json\n" + JSON.stringify(webhook, null, 2) + "```",
        allowedMentions: { parse: [] }
      });

      await api.deleteWebhookWithToken(webhook.id, webhook.token);
      await api.createMessage(message.channel_id, { content: "Webhook deleted 👽" });
    })
    .catch(() => api.createMessage(message.channel_id, { content: "Invalid webhook" }));
}