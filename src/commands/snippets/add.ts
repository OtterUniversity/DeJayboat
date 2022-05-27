import { BASE_DIR, SNIPPETS_DIR, generate } from "../../../snippets/util";
import { Context, exec } from "../../util";
import { writeFile } from "fs/promises";
import { resolve } from "path";

const codeRegex = /```(js\s+)?(?<code>[\s\S]+?)```/;

export const name = "snippets add";
export default async function ({ message, args, api }: Context) {
  const title = args.shift();
  if (!title)
    return api.createMessage(message.channel_id, { content: "Missing title" });

  let code: string;
  const description = args
    .join(" ")
    .replace(codeRegex, (first, second, third, fourth, fifth, groups) => {
      code = groups.code;
      return "";
    })
    .trim();

  if (!code)
    return api.createMessage(message.channel_id, { content: "Missing code" });

  const author = message.author.username + "#" + message.author.discriminator;
  const file = generate({ title, code, author, description });

  const { id } = await api.createMessage(message.channel_id, {
    content: "Preparing..."
  });
  await exec(["git", "pull"], { cwd: BASE_DIR });
  await writeFile(resolve(SNIPPETS_DIR, `${title}.js`), file);

  await api.editMessage(message.channel_id, id, { content: "Uploading..." });
  await exec(["git", "add", "."], { cwd: BASE_DIR });
  await exec(
    [
      "git",
      "commit",
      "-m",
      `Helperboat: Add snippet ${title} for ${message.author.username}`
    ],
    { cwd: BASE_DIR }
  );

  await exec(["git", "push"], { cwd: BASE_DIR });
  await api.editMessage(message.channel_id, id, { content: "Uploaded!" });
}
