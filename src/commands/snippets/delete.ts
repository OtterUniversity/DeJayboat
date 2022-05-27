import { Context, exec } from "../../util";
import { BASE_DIR, SNIPPETS_DIR } from "../../../snippets/util/build";
import { unlink } from "fs/promises";
import { resolve } from "path";

export const name = "snippets delete";
export default async function ({ message, args, api }: Context) {
  const title = args.shift();
  if (!title)
    return api.createMessage(message.channel_id, { content: "Missing title" });

  const { id } = await api.createMessage(message.channel_id, {
    content: "Preparing..."
  });

  await exec(["git", "pull"], { cwd: BASE_DIR });
  await unlink(resolve(SNIPPETS_DIR, `${title}.js`));

  await api.editMessage(message.channel_id, id, { content: "Uploading..." });
  await exec(["git", "add", "."], { cwd: BASE_DIR });
  await exec(
    [
      "git",
      "commit",
      "-m",
      `Helperboat: Delete snippet ${title} for ${message.author.username}`
    ],
    { cwd: BASE_DIR }
  );

  await exec(["git", "push"], { cwd: BASE_DIR });
  await api.editMessage(message.channel_id, id, { content: "Uploaded!" });
}
