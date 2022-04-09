import { Context } from "../../util";

export const name = "snippets build";
export const aliases = ["snippets export"];

export default async function ({ message, api }: Context) {
  const { content } = await api.getChannelMessage(
    "839367089801527306",
    "962230362430398484"
  );

  await api.createMessage(message.channel_id, { content });
}