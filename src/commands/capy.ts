import { Context, color } from "../util";
import robert from "robert";

export const open = true;
export const name = "capy";
export const aliases = ["capybara", "cap"];
export default async function ({ message, api }: Context) {
  const { id } = await api.createMessage(message.channel_id, {
    content: "🦧 Loading...",
    allowed_mentions: { parse: [], replied_user: true },
    message_reference: { message_id: message.id }
  });

  const { data } = await robert.get("https://api.capy.lol/v1/capybara").query("json", true).send("json");

  await api.editMessage(message.channel_id, id, {
    content: "",
    embeds: [
      {
        color,
        title: data.alt,
        image: { url: data.url },
        footer: { text: "capy.lol • #" + data.index }
      }
    ]
  });
}
