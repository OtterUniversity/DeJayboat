import * as config from "./config.js";
import * as ottercord from "ottercord";

import { Gateway } from "detritus-client-socket";
import { GatewayMessageCreateDispatchData } from "discord-api-types/v9";
import { execSync } from "child_process";
import { inspect } from "util";
import { load } from "cheerio";
import robert from "robert";

const ws = new Gateway.Socket(config.token);
const api = ottercord(config.token);
const zendesk = robert
  .client("https://support.discord.com/api/v2/help_center/en-us/articles.json")
  .query("sort_by", "created_at")
  .query("sort_order", "desc")
  .query("per_page", 99)
  .format("json");

const snowflakeRegex = /\b\d{17,19}\b/g;
const color = parseInt("36393f", 16);

ws.on("packet", async ({ t, d }: { t: string; d: GatewayMessageCreateDispatchData }) => {
  if (t === "MESSAGE_CREATE") {
    if (d.channel_id === config.datamining) {
      const [embed] = d.embeds;
      const images = embed?.description?.match(/https?:\/\/\S+\.(png|jpg|jpeg|webp)\b/g);
      if (images) {
        const files = [];
        for await (const image of images.slice(0, 10)) {
          let validImage;
          try {
            new URL(image);
            validImage = true;
          } catch {}

          if (validImage) {
            await robert
              .get(image)
              .send("buffer")
              .then(value =>
                files.push({
                  name: "image" + files.length + "." + image.split(".").pop(),
                  value
                })
              )
              .catch(() => {});
          }
        }

        if (files.length) api.createMessage(d.channel_id, {}, files);
      }
    }

    const svgs = d.content.match(/https?:\/\/\S+\.svg\b/g);
    if (svgs) {
      const files = [];
      for await (const svg of svgs.slice(0, 10)) {
        let validSvg;
        try {
          new URL(svg);
          validSvg = true;
        } catch {}

        if (validSvg) {
          const url = new URL("https://svg.bruhmomentlol.repl.co");
          url.searchParams.set("q", svg);

          await robert
            .get(url.toString())
            .send("buffer")
            .then(value =>
              files.push({
                name: "image" + files.length + ".png",
                value
              })
            )
            .catch(() => {});
        }
      }

      if (files.length) api.createMessage(d.channel_id, {}, files);
    }

    if (!d.content.startsWith(config.prefix)) return;
    const args = d.content.slice(config.prefix.length).split(/ +/);
    const command = args.shift();

    switch (command) {
      case "massuser":
        massuser(d, args);
        break;
      case "massguild":
        massguild(d, args);
        break;
      case "ping":
        const gatewayMessage = await api.createMessage(d.channel_id, { content: "Pinging gateway..." });
        const gatewayPing = await ws.ping();
        api.editMessage(d.channel_id, gatewayMessage.id, { content: "🕓 **" + gatewayPing + "ms** Gateway" });

        const restMessage = await api.createMessage(d.channel_id, { content: "Pinging Rest..." });
        const restStart = Date.now();
        await api.getCurrentUser();
        const restPing = Date.now() - restStart;
        api.editMessage(d.channel_id, restMessage.id, { content: "🕓 **" + restPing + "ms** Rest" });
        break;
      case "eval":
        if (config.owners.includes(d.author.id)) {
          try {
            const res = eval(args.join(" "));
            api.createMessage(d.channel_id, {
              embeds: [
                {
                  color,
                  description: "```js\n" + inspect(res, { depth: 1 }).toString().trim() + "```"
                }
              ]
            });
          } catch (e) {
            api.createMessage(d.channel_id, { content: e?.message ?? e ?? "⚠ Unknown Error" });
          }
        }
        break;
      case "exec":
        if (config.owners.includes(d.author.id)) {
          try {
            const res = execSync(args.join(" "), { timeout: 10000 });
            api.createMessage(d.channel_id, {
              embeds: [
                {
                  color,
                  description: "```js\n" + res.toString().slice(0, 4000) + "```"
                }
              ]
            });
          } catch (e) {
            api.createMessage(d.channel_id, { content: e?.message ?? e ?? "⚠ Unknown Error" });
          }
        }
        break;
      case "update":
        if (config.owners.includes(d.author.id)) {
          const updateMessage = await api.createMessage(d.channel_id, { content: "Pulling from GitHub" });
          execSync("git pull");
          await api.editMessage(d.channel_id, updateMessage.id, { content: "Compiling typescript" });
          execSync("npm run build");
          await api.editMessage(d.channel_id, updateMessage.id, { content: "👋 Exiting process" });
          process.exit();
        }
        break;
    }
  }
});

async function massuser(message: GatewayMessageCreateDispatchData, args: string[]) {
  let input = args.join(" ");
  let performance = args.some(arg => arg === "-f" || arg === "--fast");
  if (!input) {
    const [attachment] = message.attachments;
    if (!attachment?.content_type.endsWith("charset=utf-8"))
      return api.createMessage(message.channel_id, { content: "No input found" });

    input = await robert.get(attachment.url).send("text");
  }

  const ids = new Map(input.match(snowflakeRegex)?.map(key => [key, "🔍 Loading..."]));
  if (!ids.size) return api.createMessage(message.channel_id, { content: "No IDs found" });
  if (ids.size > 200) return api.createMessage(message.channel_id, { content: "Cannot lookup more than 200 users" });
  const pending = await api.createMessage(message.channel_id, { content: "🔍 Loading..." });

  for await (const id of ids.keys()) {
    await api
      .getUser(id)
      .then(({ username, discriminator }) => username + "#" + discriminator)
      .catch(() => "⛔ Invalid User")
      .then(value => ids.set(id, value));

    let completed = 0;
    let description = "";
    ids.forEach((value, key) => {
      if (value !== "🔍 Loading...") completed++;
      description += "`" + key + "` " + value + "\n";
    });

    const percent = Math.round((completed / ids.size) * 25);
    if (!performance || completed === ids.size)
      await api.editMessage(pending.channel_id, pending.id, {
        content: "(`" + completed + "/" + ids.size + "`) [" + "⬜".repeat(percent) + "🔳".repeat(25 - percent) + "] ",
        embeds: [
          {
            color,
            title:
              completed === ids.size
                ? "✅ Looked up **" + ids.size + "** users"
                : "🔍 Looking up **" + ids.size + "** users",
            description
          }
        ]
      });
  }
}

async function massguild(message: GatewayMessageCreateDispatchData, args: string[]) {
  let input = args.join(" ");
  let performance = args.some(arg => arg === "-f" || arg === "--fast");
  if (!input) {
    const [attachment] = message.attachments;
    if (!attachment?.content_type.endsWith("charset=utf-8"))
      return api.createMessage(message.channel_id, { content: "No input found" });

    input = await robert.get(attachment.url).send("text");
  }

  const ids = new Map(input.match(snowflakeRegex)?.map(key => [key, "🔍 Loading..."]));
  if (!ids.size) return api.createMessage(message.channel_id, { content: "No IDs found" });
  if (ids.size > 200) return api.createMessage(message.channel_id, { content: "Cannot lookup more than 200 guilds" });
  const pending = await api.createMessage(message.channel_id, { content: "🔍 Loading..." });

  for await (const id of ids.keys()) {
    await api
      .getGuildPreview(id)
      .then(({ name }) => name)
      .catch(() => "🔒 Private")
      .then(value => ids.set(id, value));

    let completed = 0;
    let description = "";
    ids.forEach((value, key) => {
      if (value !== "🔍 Loading...") completed++;
      description += "`" + key + "` " + value + "\n";
    });

    const percent = Math.round((completed / ids.size) * 25);
    if (!performance || completed === ids.size)
      await api.editMessage(pending.channel_id, pending.id, {
        content: "(`" + completed + "/" + ids.size + "`) [" + "⬜".repeat(percent) + "🔳".repeat(25 - percent) + "] ",
        embeds: [
          {
            color,
            title:
              completed === ids.size
                ? "✅ Looked up **" + ids.size + "** guilds"
                : "🔍 Looking up **" + ids.size + "** guilds",
            description
          }
        ]
      });
  }
}

(async () => {
  const categories = await robert
    .get("https://support.discord.com/api/v2/help_center/en-us/categories.json")
    .send("json")
    .then(res => Object.fromEntries(res.categories.map(c => [c.id, c])));

  const sections = await robert
    .get("https://support.discord.com/api/v2/help_center/en-us/sections.json")
    .send("json")
    .then(res => Object.fromEntries(res.sections.map(s => [s.id, s])));

  const callback = async () => {
    const { articles } = await zendesk.get().send();

    let [last] = await api.getChannelMessages(config.articles, { limit: "1" });
    last ??= await api.createMessage(config.articles, {
      content: "This channel has been setup to receive Support Articles"
    });

    const after = articles.filter(
      ({ created_at }) => new Date(created_at).getTime() > new Date(last.timestamp).getTime()
    );

    if (after.length) {
      const data = {
        content: after.map(a => a.html_url).join("\n"),
        embeds: after.map(a => {
          const section = sections[a.section_id];
          const category = categories[section.category_id];

          const html = load(a.body);
          const image = html("img")[0]?.attribs.src;
          const description =
            html
              .text()
              .replace(/^note:.+/gim, "")
              .trim()
              .slice(0, 200) + "...";

          const tags = a.label_names
            .map(tag =>
              tag
                .split(/[^\w]/gim)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(" ")
            )
            .join(" • ");

          return {
            color,
            description,
            title: a.title,
            url: a.html_url,
            timestamp: a.created_at,
            image: { url: image },
            footer: {
              text: tags
            },
            fields: [
              {
                name: "Section",
                value: "[" + section.name + "](" + section.html_url + ")",
                inline: true
              },
              {
                name: "Category",
                value: "[" + category.name + "](" + category.html_url + ")",
                inline: true
              }
            ]
          };
        })
      };

      api.createMessage(config.articles, data);
    }
  };

  callback();
  setInterval(callback, 900000);
})();

ws.connect("wss://gateway.discord.gg");