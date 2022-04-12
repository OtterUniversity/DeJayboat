import { Context } from "../../util";

export const name = "snippets build";
export const aliases = ["snippets export"];

export default async function ({ message, api }: Context) {
  const { content } = await api.getChannelMessage(
    "843878764282118174",
    "962470737392852992"
  );

  await api.createMessage(message.channel_id, { content });
}
