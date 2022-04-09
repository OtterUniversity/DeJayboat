import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";
import { BASE_DIR } from "../../../../snippets/util/build";
import { Context, exec } from "../../../util";

export const name = "snippets startup delete";
export const aliases = ["snippets startup remove"];
export default async function ({ message, args, api }: Context) {
  const { id } = await api.createMessage(message.channel_id, {
    content: "Preparing..."
  });

  await exec(["git", "pull"], { cwd: BASE_DIR });
  const startup = JSON.parse(
    await readFile(resolve(BASE_DIR, "build", "startup.json"), "utf8")
  );

  const snippets = new Set(startup[message.author.id]);
  for (const snippet of args) snippets.delete(snippet);

  startup[message.author.id] = [...snippets];
  await writeFile(
    resolve(BASE_DIR, "build", "startup.json"),
    JSON.stringify(startup)
  );

  await api.editMessage(message.channel_id, id, { content: "Uploading..." });
  await exec(["git", "add", "."], { cwd: BASE_DIR });
  await exec(
    [
      "git",
      "commit",
      "-m",
      `Helperboat: Add startup snippet for ${message.author.username}`
    ],
    { cwd: BASE_DIR }
  );

  await exec(["git", "push"], { cwd: BASE_DIR });
  await api.editMessage(message.channel_id, id, { content: "Uploaded!" });
}