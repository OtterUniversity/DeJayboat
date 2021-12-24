import { Context } from "../../util";
import { guilds } from "../../store";

export const name = "guilds list";
export const aliases = ["guilds ls", "guilds export"];
export default async function ({ message, api }: Context) {
  const text = Object.entries(guilds).map(g => g.join(" "));
  api.createMessage(
    message.channel_id,
    { content: "Here are the **" + text.length + "** guilds I have stored" },
    { name: "list.txt", value: text.join("\n") }
  );
}