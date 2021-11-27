import { Context } from "../util";
import { get } from "robert";

const regex = /webhooks\/\d{16,22}\/[\w-]{68}/gim;

export default async function ({ message, api }: Context) {
  const [attachment] = message.attachments;
  if (!attachment) return api.createMessage(message.channel_id, { content: "No attachment found" });

  const text = await get(attachment.url).send("text");
  const webhooks = text.match(regex);

  if (!webhooks) return api.createMessage(message.channel_id, { content: "No webhooks found" });

  api.createMessage(message.channel_id, {
    content: `Found **${webhooks.length}** webhooks\n>>> ${webhooks
      .map(webhook => "https://discord.com/api/v9/" + webhook)
      .join("\n")}`
  });
}