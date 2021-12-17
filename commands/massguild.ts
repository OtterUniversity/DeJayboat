import { Context, fetchExperiments, snowflakeRegex, color, collectExperiments } from "../util";
import { guilds } from "../store";
import { get } from "robert";

import * as fuse from "fuse.js";
import * as murmurhash from "murmurhash";

async function resolve(id: string, api: Context["api"]): Promise<string> {
  let ratelimited: string;
  try {
    const { name } = await api.getGuildPreview(id);
    guilds[id] = name;
    return name + "*";
  } catch ({ status }) {
    ratelimited = "🕓 Preview Ratelimited";
  }

  try {
    await api.getGuildChannels(id);
  } catch ({ status }) {
    if (status === 404) return "⛔ Invalid Guild";
    if (status === 403) ratelimited = "🕓 Widget Ratelimited";
  }

  try {
    const { name } = await api.getGuildWidget(id);
    guilds[id] = name;
    return name + "^";
  } catch ({ status }) {
    if (status === 403) ratelimited = "🕓 Widget Ratelimited";
  }

  try {
    const {
      guild: { name }
    } = await get("https://mee6.xyz/api/plugins/levels/leaderboard/" + id)
      .query("limit", 1)
      .send("json");

    guilds[id] = name;
    return name + "%";
  } catch ({ status }) {
    if (status === 403) ratelimited = "🕓 MEE6 Ratelimited";
  }

  return ratelimited ?? "🔒 Private";
}

export default async function ({ message, args, api }: Context) {
  let treatments: Record<string, number> = {};
  let input = args.join(" ");
  let performance = args.includes("-f") || args.includes("--fast");
  if (!input) {
    const [attachment] = message.attachments;
    if (!attachment?.content_type.endsWith("charset=utf-8"))
      return api.createMessage(message.channel_id, {
        content: "No input found"
      });

    input = await get(attachment.url).send("text");
  }

  const ids = new Map(
    input.match(snowflakeRegex)?.map(key => [key, guilds[key] ?? "🔍 Loading..."])
  );

  if (!ids.size) {
    let hashed = args[0];
    if (hashed.includes("-")) hashed = murmurhash.v3(hashed).toString();

    const experiments = await fetchExperiments();
    let experiment = experiments[hashed];
    if (!experiment) {
      // @ts-ignore again i dont want to enable esmoduleinterp
      const engine = new fuse(Object.values(experiments), {
        keys: ["metadata.title"]
      });

      const search = engine.search(args.join(" "));
      if (!search.length)
        return api.createMessage(message.channel_id, {
          content: "No experiment matched that query"
        });

      experiment = search[0].item;
    }

    await api.createMessage(message.channel_id, {
      content: "Getting guilds in experiment **" + experiment.metadata.title + "**"
    });

    const experimentGuilds = await collectExperiments(experiment, {
      message,
      args,
      api
    });

    if (!experimentGuilds.ids.length)
      return api.createMessage(message.channel_id, { content: "No IDs found" });

    experimentGuilds.ids.forEach(id => ids.set(id, guilds[id] ?? "🔍 Loading..."));
    treatments = experimentGuilds.treatments;
  }

  if ([...ids.values()].filter(value => value === "🔍 Loading...").length > 1000)
    return api.createMessage(message.channel_id, {
      content: "Cannot lookup more than 1000 guilds"
    });

  const pending = await api.createMessage(message.channel_id, {
    content: "🔍 Loading..."
  });

  for await (const [id, status] of ids.entries()) {
    if (status === "🔍 Loading...") {
      const value = await resolve(id, api);
      ids.set(id, value);
    }

    let completed = 0;
    let description = "";
    ids.forEach((value, key) => {
      if (value !== "🔍 Loading...") completed++;
      description += "`" + key + "` " + value;
      const treatment = treatments[key];
      if (treatment) description += " (" + treatment + ")";
      description += "\n";
    });

    const percent = Math.round((completed / ids.size) * 10);
    if (!performance || completed === ids.size) {
      let file;
      if (description.length > 4000) {
        if (completed === ids.size) file = { name: "guilds.txt", value: description };
        description = description.slice(0, 4000);
      }

      await api.editMessage(
        pending.channel_id,
        pending.id,
        {
          content:
            "(`" +
            completed +
            "/" +
            ids.size +
            "`) [" +
            "⬜".repeat(percent) +
            "🔳".repeat(10 - percent) +
            "] ",
          embeds: [
            {
              color,
              description,
              title:
                completed === ids.size
                  ? "✅ Looked up **" + ids.size + "** guilds"
                  : "🔍 Looking up **" + ids.size + "** guilds",
              footer: {
                text: "* = From Preview | ^ = From Widget | % = From MEE6"
              }
            }
          ]
        },
        file
      );

      if (completed === ids.size) break;
    }
  }
}