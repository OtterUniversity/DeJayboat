const prettyBytesPkg = import("pretty-bytes");
import { Context } from "../util";

export const open = true;
export const name = "bytes";
export default async function ({ message, args, api }: Context) {
  const prettyBytes = (await prettyBytesPkg).default;
  let bytes = parseInt(args[0]);
  if (!bytes) return await api.createMessage(message.channel_id, { content: "invalid amount of bytes" });

  await api.createMessage(message.channel_id, {
    content: prettyBytes(bytes) + "\n" + prettyBytes(bytes, { bits: true })
  });
}
