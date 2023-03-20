import { Context } from "../util";

export const name = "source";
export const aliases = ["src"];
export default function ({ message, api }: Context) {
  let content = "https://github.com/OtterUniversity/DeJayboat";
  api.createMessage(message.channel_id, { content });
}
