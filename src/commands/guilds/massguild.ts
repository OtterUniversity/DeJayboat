import {
  Context,
  fetchExperiments,
  snowflakeRegex,
  color,
  collectExperiments,
} from "../../util";
import { guilds, updateGuilds } from "../../store";
import robert from "robert";

import fuse from "fuse.js";
import murmurhash from "murmurhash";

export const name = "massguild";
export const aliases = ["guildinfo", "gi"];
async function resolve(id: string, api: Context["api"]): Promise<string> {
  let ratelimited: string;
  try {
    const { name } = await api.getGuildPreview(id);
    guilds[id] = name;
    return name + "*";
  } catch ({ status }) {
    if (status === 429) ratelimited = "🕓 Preview Ratelimited";
  }

  try {
    await api.getGuildChannels(id);
  } catch ({ status }) {
    if (status === 404) return "⛔ Invalid Guild";
    if (status === 429) ratelimited = "🕓 Channel Ratelimited";
  }

  try {
    const { name } = await api.getGuildWidget(id);
    guilds[id] = name;
    return name + "^";
  } catch ({ status }) {
    if (status === 429) ratelimited = "🕓 Widget Ratelimited";
  }

  try {
    const {
      guild: { name },
    } = await robert
      .get("https://mee6.xyz/api/plugins/levels/leaderboard/" + id)
      .query("limit", 1)
      .send("json");

    guilds[id] = name;
    return name + "%";
  } catch ({ status }) {
    if (status === 429) ratelimited = "🕓 MEE6 Ratelimited";
  }

  return ratelimited ?? "🔒 Private";
}

export default async function ({ message, args, api }: Context) {
  let treatments: Record<string, number> = {};
  let input = args.join(" ");
  let fast = args.includes("-f") || args.includes("--fast");
  if (!input) {
    const [attachment] = message.attachments;
    if (!attachment?.content_type.endsWith("charset=utf-8"))
      return api.createMessage(message.channel_id, {
        content: "No input found",
      });

    input = await robert.get(attachment.url).send("text");
  }

  const ids = new Map<string, null | string>(
    input.match(snowflakeRegex)?.map((key) => [key, null])
  );

  if (!ids.size) {
    let hashed = args[0];
    if (hashed.includes("-")) hashed = murmurhash.v3(hashed).toString();

    const experiments = await fetchExperiments();
    let experiment = experiments[hashed];
    if (!experiment) {
      // @ts-ignore again i dont want to enable esmoduleinterp
      const engine = new fuse(Object.values(experiments), {
        keys: ["metadata.title"],
      });

      const search = engine.search(args.join(" "));
      if (!search.length)
        return api.createMessage(message.channel_id, {
          content: "No experiment matched that query",
        });

      experiment = search[0].item;
    }

    await api.createMessage(message.channel_id, {
      content:
        "Getting guilds in experiment **" + experiment.metadata.title + "**",
    });

    const experimentGuilds = await collectExperiments(experiment, {
      message,
      args,
      api,
    });

    if (!experimentGuilds.ids.length)
      return api.createMessage(message.channel_id, { content: "No IDs found" });

    experimentGuilds.ids.forEach((id) => ids.set(id, null));
    treatments = experimentGuilds.treatments;
  }

  if (ids.size > 1000)
    return api.createMessage(message.channel_id, {
      content: "Cannot lookup more than 1000 guilds",
    });

  const pending = await api.createMessage(message.channel_id, {
    content: "🔍 Loading...",
  });

  function render() {
    let completed = 0;
    let body = "";

    for (const [id, value] of ids.entries()) {
      body += "`" + id + "` " + (value ?? "🔍 Loading...");
      const treatment = treatments[id];
      if (treatment) body += " (" + treatment + ")";
      body += "\n";
    }

    const percent = Math.round((completed / ids.size) * 10);
    const progress =
      "(`" +
      completed +
      "/" +
      ids.size +
      "`) [" +
      "⬜".repeat(percent) +
      "🔳".repeat(10 - percent) +
      "] ";

    return { completed, body, percent, progress };
  }

  for (const [id] of ids.entries()) {
    if (guilds[id]) {
      const value = guilds[id];
      ids.set(id, value);
      continue;
    }

    const value = await resolve(id, api);
    ids.set(id, value);

    if (fast) continue;

    const { body, progress } = render();
    if (body.length > 4000) body = body.slice(0, 4000);

    await api.editMessage(pending.channel_id, pending.id, {
      content: progress,
      embeds: [
        {
          color,
          description: body,
          title: "🔍 Looking up **" + ids.size + "** guilds",
          footer: {
            text: "* = From Preview | ^ = From Widget | % = From MEE6",
          },
        },
      ],
    });
  }

  updateGuilds();

  const { body, progress } = render();

  let file;
  if (body.length > 4000) {
    file = { name: "guilds.txt", value: body };
    body = body.slice(0, 4000);
  }

  await api.editMessage(
    pending.channel_id,
    pending.id,
    {
      content: progress,
      embeds: [
        {
          color,
          description: body,
          title: "✅ Looked up **" + ids.size + "** guilds",
          footer: {
            text: "* = From Preview | ^ = From Widget | % = From MEE6",
          },
        },
      ],
    },
    file
  );
}
