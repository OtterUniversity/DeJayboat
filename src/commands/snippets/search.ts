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

  let avatar: string;
  if (item.author) {
    const [member] = await api.searchGuildMembers(message.guild_id, {
      query: item.author.replaceAll("@", "").replaceAll("#", "").replaceAll("```", ""),
      limit: "1"
    });

    if (member) {
      avatar = member.avatar
        ? `https://cdn.discordapp.com/guilds/${message.guild_id}/users/${member.user.id}/avatars/${
            member.avatar
          }.${member.avatar.startsWith("a_") ? "gif" : "png"}`
        : member.user.avatar
        ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.${
            member.user.avatar.startsWith("a_") ? "gif" : "png"
          }`
        : `https://cdn.discordapp.com/embed/avatars/${member.user.discriminator % 5}.png`;
    }
  }

  await api.createMessage(
    message.channel_id,
    {
      embeds: [
        {
          title: item.title,
          author: item.author && { name: item.author, icon_url: avatar },
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