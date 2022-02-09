import { BASE_DIR, Snippet } from "../../../snippets/util";
import { Context, exec } from "../../util";
import { readFile } from "fs/promises";
import { resolve } from "path";
import Fuse from "fuse.js";

export const name = "snippets";
export const aliases = ["snippets export", "snippets build"];

export default async function ({ message, args, api }: Context) {
  if (!args.length) api.createMessage(message.channel_id, { content: "No query specified" });
  const query = args.join(" ");

  await exec("git pull", { cwd: BASE_DIR });
  const snippets: Snippet[] = JSON.parse(
    await readFile(resolve(BASE_DIR, "build", "output", "snippets.json"), "utf-8")
  );

  const engine = new Fuse(snippets, { keys: ["title", "description", "author", "code"] });
  const results = engine.search(query);
  if (!results.length)
    return api.createMessage(message.channel_id, { content: "No results found" });

  const { item } = results.shift();
  await api.createMessage(
    message.channel_id,
    {
      embeds: [
        {
          title: item.title,
          author: { name: item.author },
          description: item.description,
          fields: results.length && [
            {
              name: "Other results",
              value: results
                .slice(0, 10)
                .map(({ item }) => `\`${item.title}\``)
                .join("\n")
            }
          ]
        }
      ]
    },
    { name: item.title + ".js", value: item.code }
  );
}
