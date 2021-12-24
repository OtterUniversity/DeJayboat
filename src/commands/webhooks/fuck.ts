import { Context } from "../../util";
import * as robert from "robert";

export const name = "webhooks fuck";
export const aliases = [
  "webhooks delete",
  "webhooks remove",
  "webhooks del",
  "webhooks rem",
  "webhooks rm"
];

export default function ({ message, args, api }: Context) {
  const url = args[0];

  try {
    new URL(url);
  } catch {
    return api.createMessage(message.channel_id, { content: "Invalid URL" });
  }

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