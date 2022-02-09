import { SNIPPETS_DIR } from "../../../snippets/util";
import { createReadStream } from "fs";
import { Context, exec } from "../../util";
import { resolve } from "path";

export const name = "snippets";
export const aliases = ["snippets export", "snippets build"];

export default async function ({ message, args, api }: Context) {
  await exec("git pull", { cwd: SNIPPETS_DIR });

  const snippets = createReadStream(resolve(SNIPPETS_DIR, "build", "output", "snippets.js"));
  await api.createMessage(message.channel_id, {}, { name: "snippets.js", value: snippets });
}
