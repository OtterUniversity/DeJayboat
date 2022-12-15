import { Context } from "../util";
import robert from "robert";

export const open = true;
export const name = "ye";
export const aliases = ["kanye"];
export default async function ({ message, api }: Context) {
  const quote = await robert
    .get("https://api.kanye.rest")
    .send("json")
    .then(res => res.quote);

  await api.createMessage(message.channel_id, { content: quote });
}
