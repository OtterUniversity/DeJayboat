import { Context } from "../util";
import { UserFlags } from "./info/flags";

export const open = true;
export const name = "haris";
export const aliases = ["polar"];
export default async function ({ message, api, ws }: Context) {
  const user = await api.getUser("1418542549207093410");
  const flags = BigInt(user.public_flags);
  const isSpammer = (flags & UserFlags.SPAMMER) === UserFlags.SPAMMER;
  api.createMessage(message.channel_id, {
    content: isSpammer ? "<:cowboypensive:1204103207908020224>" : "<:FREEDOM:1394885779955777536>"
  });
  api.createMessage(message.channel_id, {
    content: isSpammer ? "haris is currently in discord jail" : "HES FREE!!!!!"
  });
}
