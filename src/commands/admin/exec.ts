import { Context, color } from "../../util";
import { execSync } from "child_process";

export const owner = true;
export const name = "exec";
export default async function ({ message, args, api }: Context) {
  try {
    const res = execSync(args.join(" "), { timeout: 10000 });
    api.createMessage(message.channel_id, { content: "```ansi\n" + res.toString().slice(0, 4000) + "```" });
  } catch (e) {
    api.createMessage(message.channel_id, {
      content: e?.message ?? e ?? "⚠ Unknown Error"
    });
  }
}
