import { Context, snowflakeRegex, color } from "../../util";
import robert from "robert";

export const name = "massuser";
export const aliases = ["userinfo", "ui"];
export default async function ({ message, args, api }: Context) {
  let input = args.join(" ");
  let performance = args.includes("-f") || args.includes("--fast");
  if (!input) {
    const [attachment] = message.attachments;
    if (!attachment?.content_type.endsWith("charset=utf-8"))
      return api.createMessage(message.channel_id, {
        content: "No input found"
      });

    input = await robert.get(attachment.url).send("text");
  }

  const ids = new Map(input.match(snowflakeRegex)?.map(key => [key, "🔍 Loading..."]));
  if (!ids.size) return api.createMessage(message.channel_id, { content: "No IDs found" });
  if (ids.size > 1000)
    return api.createMessage(message.channel_id, {
      content: "Cannot lookup more than 1000 users"
    });
  const pending = await api.createMessage(message.channel_id, {
    content: "🔍 Loading..."
  });

  let arr = [];
  for await (const id of ids.keys()) {
    await api
      .getUser(id)
      .then(u => {
        arr.push(u);
        return u.username;
      })
      .catch(() => "⛔ Invalid User")
      .then(value => ids.set(id, value));

    let completed = 0;
    let description = "";
    ids.forEach((value, key) => {
      if (value !== "🔍 Loading...") completed++;
      description += "<@" + key + "> " + value + "\n";
    });

    const percent = Math.round((completed / ids.size) * 10);
    if (!performance || completed === ids.size) {
      let files = [];
      if (completed === ids.size) {
        files.push({ name: "users.json", value: JSON.stringify(arr, null, 2) });
        if (description.length > 4000) {
          files.push({ name: "users.txt", value: description });
        }
      }
      if (description.length > 4000) {
        description = description.slice(0, 4000);
      }

      await api.editMessage(
        pending.channel_id,
        pending.id,
        {
          content: "(`" + completed + "/" + ids.size + "`) [" + "⬜".repeat(percent) + "🔳".repeat(10 - percent) + "] ",
          embeds: [
            {
              color,
              description,
              title:
                completed === ids.size
                  ? "✅ Looked up **" + ids.size + "** users"
                  : "🔍 Looking up **" + ids.size + "** users"
            }
          ]
        },
        files
      );
    }
  }
}
