import { Context, color } from "../../util";
import { guilds } from "../../store";
import fuse from "fuse.js";

export const name = "guilds search";
export const aliases = ["guilds find"];
export default async function ({ message, args, api }: Context) {
  if (!args.length) api.createMessage(message.channel_id, { content: "No query specified" });
  const query = args.join(" ");

  //@ts-ignore fuse's typings are stupid
  const engine = new fuse(
    Object.entries(guilds).map(([id, name]) => ({ id, name })),
    { keys: ["name"] }
  );

  const results = engine
    .search(query)
    .map(result => "`" + result.item.id + "` " + result.item.name);

  if (!results.length)
    return api.createMessage(message.channel_id, {
      content: "No results found"
    });

  api.createMessage(message.channel_id, {
    embeds: [
      {
        color,
        title: "🔍 Search Results",
        description: results.slice(0, 10).join("\n"),
        footer: { text: results.length + " Results" }
      }
    ]
  });
}
