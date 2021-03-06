import { lstatSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { resolve, dirname, basename } from "path";
import { Context, color } from "../../util";
import robert from "robert";

const base = dirname(dirname(__dirname));

export const owner = true;
export const name = "files";
export const aliases = ["fs"];
export default async function ({ message, args, api }: Context) {
  if (!args.length) return api.createMessage(message.channel_id, { content: "No path specified" });
  const path = resolve(base, args.join(" "));

  let meta: ReturnType<typeof lstatSync>;
  try {
    meta = lstatSync(path);
  } catch {
    return api.createMessage(message.channel_id, { content: "That path does not exist" });
  }

  if (meta.isDirectory()) {
    const files = readdirSync(path);
    api.createMessage(message.channel_id, {
      content: "📁 Files in **" + path + "**",
      embeds: [
        {
          color,
          description: files.join("\n")
        }
      ]
    });
  } else {
    if (message.attachments.length) {
      const [{ url }] = message.attachments;
      const file = await robert.get(url).send("buffer");
      writeFileSync(path, file);
      api.createMessage(message.channel_id, { content: "✏️ Edited **" + path + "**" });
    } else {
      const name = basename(path);
      const value = readFileSync(path);
      api.createMessage(
        message.channel_id,
        { content: "📄 Contents of **" + path + "**" },
        { name, value }
      );
    }
  }
}