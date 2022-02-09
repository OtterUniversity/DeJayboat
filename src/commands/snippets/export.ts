import { BASE_DIR } from "../../../snippets/util";
import { createReadStream } from "fs";
import { Context, exec } from "../../util";
import { resolve } from "path";

export const name = "snippets";
export const aliases = ["snippets export", "snippets build"];

export default async function ({ message, api }: Context) {
  await exec("git pull", { cwd: BASE_DIR });

  const snippets = createReadStream(resolve(BASE_DIR, "build", "output", "snippets.js"));
  await api.createMessage(message.channel_id, {}, { name: "snippets.js", value: snippets });
}