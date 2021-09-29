import * as config from "./config.js";
import * as ottercord from "ottercord";
import * as robert from "robert";
import * as fuse from "fuse.js";

import { APIInvite, APIPartialGuild, GatewayMessageCreateDispatchData } from "discord-api-types/v9";
import { writeFileSync, readFileSync } from "fs";
import { execSync } from "child_process";
import { Gateway } from "detritus-client-socket";
import { inspect } from "util";
import { load } from "cheerio";

const ws = new Gateway.Socket(config.token);
const api = ottercord(config.token);
const zendesk = robert
  .client("https://support.discord.com/api/v2/help_center/en-us/articles.json")
  .query("sort_by", "created_at")
  .query("sort_order", "desc")
  .query("per_page", 99)
  .format("json");

const exactSnowflakeRegex = /^\d{17,19}$/;
const snowflakeRegex = /\b\d{17,19}\b/g;
const color = parseInt("36393f", 16);

// Thanks Geek :) - https://git.io/Jz9RC
const inviteRegex = /discord(?:app)?\.(?:com|gg)\/(?:invite\/)?(?<code>[\w-]{1,25})/;

let guilds = {};
try {
  guilds = JSON.parse(readFileSync("guilds.json", "utf-8"));
} catch {
  writeFileSync("guilds.json", JSON.stringify({}));
}

ws.on("ready", () => {
  let shutdown;
  try {
    shutdown = JSON.parse(readFileSync("shutdown.json", "utf-8"));
  } catch {
    return;
  }

  if (Date.now() - shutdown.time > 60000) return;
  api.editMessage(shutdown.channel, shutdown.message, { content: "🟢 Online" });
});

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

          if (validImage)
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

        if (validSvg)
          await robert
            .get("https://util.bruhmomentlol.repl.co/svg")
            .query("q", svg)
            .query("width", 400)
            .send("buffer")
            .then(value =>
              files.push({
                name: "image" + files.length + ".png",
                value
              })
            )
            .catch(() => {});
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
      case "override":
        override(d, args);
        break;
      case "search":
        search(d, args);
        break;
      case "set":
        set(d, args);
        break;
      case "delete":
      case "del":
        del(d, args);
        break;
      case "list":
        list(d);
        break;
      case "help":
        let help =
          "👌 You can use: `massuser`, `massguild`, `override`, `search`, `set`, `delete`, `list`, `help`, `ping`, `otter`";
        if (config.owners.includes(d.author.id)) help += ", `eval`, `exec`, `update`";
        api.createMessage(d.channel_id, {
          content: help
        });
        break;
      case "ping":
        const pingMessage = await api.createMessage(d.channel_id, {
          content: "Pinging gateway..."
        });
        const gatewayPing = await ws.ping();
        api.editMessage(d.channel_id, pingMessage.id, {
          content: "🕓 **" + gatewayPing + "ms** Gateway\nPinging rest..."
        });

        const restStart = Date.now();
        await api.getCurrentUser();
        const restPing = Date.now() - restStart;
        api.editMessage(d.channel_id, pingMessage.id, {
          content: "🕓 **" + gatewayPing + "ms** Gateway\n🕓 **" + restPing + "ms** Rest"
        });
        break;
      case "otter":
      case "imgoingfuckinginsanewhydidyoutellmetomakeanottercommand":
        const otter = await robert.get("https://otter.bruhmomentlol.repl.co/random").full().send();
        api.createMessage(
          d.channel_id,
          {},
          { name: "otter." + otter.headers["x-file-ext"], value: otter.data }
        );
        break;
      case "invite":
        invite(d, args);
        break;
      case "eval":
        if (config.owners.includes(d.author.id)) {
          try {
            let res = eval(args.join(" "));
            if (res instanceof Promise) {
              api.createMessage(d.channel_id, {
                content: "<a:crumbdance:877043850890317855> Resolving Promise"
              });

              try {
                res = await res;
              } catch (e) {
                return api.createMessage(d.channel_id, {
                  content: e?.message ?? e ?? "⚠ Unknown Error"
                });
              }
            }

            api.createMessage(d.channel_id, {
              embeds: [
                {
                  color,
                  description: "```js\n" + inspect(res, { depth: 1 }).toString().trim() + "```"
                }
              ]
            });
          } catch (e) {
            api.createMessage(d.channel_id, {
              content: e?.message ?? e ?? "⚠ Unknown Error"
            });
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
            api.createMessage(d.channel_id, {
              content: e?.message ?? e ?? "⚠ Unknown Error"
            });
          }
        }
        break;
      case "update":
        if (config.owners.includes(d.author.id)) {
          const updateMessage = await api.createMessage(d.channel_id, {
            content: "Pulling from GitHub"
          });
          execSync("git pull");
          await api.editMessage(d.channel_id, updateMessage.id, {
            content: "Installing dependencies"
          });
          execSync("npm install");
          await api.editMessage(d.channel_id, updateMessage.id, {
            content: "Compiling typescript"
          });
          execSync("npm run build");
          await api.editMessage(d.channel_id, updateMessage.id, { content: "Exiting process" });
          writeFileSync(
            "shutdown.json",
            JSON.stringify({
              channel: d.channel_id,
              message: updateMessage.id,
              time: Date.now()
            })
          );

          process.exit();
        }
        break;
    }
  }
});

async function massuser(message: GatewayMessageCreateDispatchData, args: string[]) {
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
      description += "<@" + key + "> " + value + "\n";
    });

    const percent = Math.round((completed / ids.size) * 10);
    if (!performance || completed === ids.size) {
      let file;
      if (description.length > 4000) {
        if (completed === ids.size) file = { name: "users.txt", value: description };
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
                  ? "✅ Looked up **" + ids.size + "** users"
                  : "🔍 Looking up **" + ids.size + "** users"
            }
          ]
        },
        file
      );
    }
  }
}

async function massguild(message: GatewayMessageCreateDispatchData, args: string[]) {
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

  const ids = new Map(
    input.match(snowflakeRegex)?.map(key => [key, guilds[key] ?? "🔍 Loading..."])
  );
  if (!ids.size) return api.createMessage(message.channel_id, { content: "No IDs found" });
  if ([...ids.values()].filter(value => value === "🔍 Loading...").length > 1000)
    return api.createMessage(message.channel_id, {
      content: "Cannot lookup more than 1000 guilds"
    });

  const pending = await api.createMessage(message.channel_id, {
    content: "🔍 Loading..."
  });
  for await (const [id, status] of ids.entries()) {
    if (status === "🔍 Loading...")
      await api
        .getGuildPreview(id)
        .then(({ name }) => (guilds[id] = name + "^"))
        .catch(() =>
          api
            .getGuildWidget(id)
            .then(({ name }) => (guilds[id] = name + "^"))
            .catch(({ status }) =>
              status === 403
                ? "🔒 Private"
                : status === 429
                ? "🕓 Widget Ratelimited"
                : "⛔ Invalid Guild"
            )
        )
        .then(value => ids.set(id, value));

    let completed = 0;
    let description = "";
    ids.forEach((value, key) => {
      if (value !== "🔍 Loading...") completed++;
      description += "`" + key + "` " + value + "\n";
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
                text: "* = From Preview | ^ = From Widget"
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

function override(message: GatewayMessageCreateDispatchData, args: string[]) {
  try {
    const data = JSON.parse(
      Buffer.from(
        decodeURIComponent(args.join("").split("?s=")[1].split(".")[1]),
        "base64"
      ).toString()
    );

    const fields = Object.entries(data.targetBuildOverride).map(([platform, target]) => ({
      name: platform,
      //@ts-ignore im lazy
      value: "`" + target.type + "` " + target.id
    }));

    api.createMessage(message.channel_id, {
      content: "```json\n" + JSON.stringify(data, null, 2) + "```",
      embeds: [
        {
          timestamp: new Date(data.expiresAt),
          footer: {
            text: "Expires"
          },
          fields: [
            {
              name: "Users",
              value: data.validForUserIds.join("\n") || "None",
              inline: true
            },
            {
              name: "Release Channel",
              value: data.releaseChannel ?? "None",
              inline: true
            },
            {
              name: "Allow Logged Out",
              value: data.allowLoggedOut.toString(),
              inline: true
            },

            ...fields
          ]
        }
      ]
    });
  } catch (e) {
    api.createMessage(message.channel_id, {
      content: "⚠ " + e.message,
      allowedMentions: { parse: [] }
    });
  }
}

function search(message: GatewayMessageCreateDispatchData, args: string[]) {
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

function set(message: GatewayMessageCreateDispatchData, args: string[]) {
  const id = args.shift();
  const name = args.join(" ");
  if (!exactSnowflakeRegex.test(id))
    return api.createMessage(message.channel_id, {
      content: "Invalid snowflake"
    });
  if (!name)
    return api.createMessage(message.channel_id, {
      content: "No name specified"
    });

  const current = guilds[id];
  if (current)
    return api.createMessage(message.channel_id, {
      content:
        "`" +
        id +
        "` is already set to **" +
        name +
        "**, please delete it with `.delete " +
        id +
        "` first",
      allowedMentions: { parse: [] }
    });

  guilds[id] = name;

  writeFileSync("guilds.json", JSON.stringify(guilds));
  api.createMessage(message.channel_id, {
    content: "Set `" + id + "` to **" + name + "**",
    allowedMentions: { parse: [] }
  });
}

function del(message: GatewayMessageCreateDispatchData, args: string[]) {
  const id = args.shift();
  if (!exactSnowflakeRegex.test(id))
    return api.createMessage(message.channel_id, {
      content: "Invalid snowflake"
    });

  const current = guilds[id];
  if (!current)
    return api.createMessage(message.channel_id, {
      content: "`" + id + "` doesn't exist in the ||(json)|| database"
    });

  delete guilds[id];

  writeFileSync("guilds.json", JSON.stringify(guilds));
  api.createMessage(message.channel_id, {
    content: "Deleted `" + id + "`",
    allowedMentions: { parse: [] }
  });
}

async function invite(message: GatewayMessageCreateDispatchData, args: string[]) {
  const url = args.shift();
  if (!inviteRegex.test(url)) {
    api.createMessage(message.channel_id, {
      content: "Invalid invite"
    });
  }

  const invite: APIInvite = await api.getInvite(RegExp(inviteRegex).exec(url)[1], {withCounts: true});
  const guild: APIPartialGuild = invite.guild;

  /*if (!guilds[guild.id]) {
    guilds[guild.id] = guild.name;
    writeFileSync("guilds.json", JSON.stringify(guilds));
  }*/

  api.createMessage(message.channel_id, {
    embeds: [
      {
        color,
        title: guild.name,
        description: guild.description || "No description",
        url: `https://discord.gg/${invite.code}`,
        image: guild.banner ? { url: `https://cdn.discordapp.com/api/banners/${guild.id}/${guild.banner}.png` } : undefined,
        thumbnail: { url: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` },
        fields: [
          {
            name: "Welcome Screen",
            value: guild.welcome_screen?.description || "No welcome screen description provided.",
          },
          {
            name: "Welcome Channels",
            value: guild.welcome_screen?.welcome_channels?.map(channel => {
              let url = `` //`<#${channel.channel_id}>`
              if(channel.emoji_id) {
                url += `<:${channel.emoji_name}:${channel.emoji_id}>`
              } else if(channel.emoji_name) {
                url += `${channel.emoji_name}`
              }
              url += ` <#${channel.channel_id}>\n${channel.description}`
              return url
            }).join("\n"),
          },
          {
            name: "Features",
            value: guild.features.join(", ") // apply sentence case
          },
          {
            name: "Verification Level",
            value: guild.verification_level
          }
        ]
      }
    ]
  });
}

async function list(message: GatewayMessageCreateDispatchData) {
  const text = Object.entries(guilds).map(g => g.join(" "));
  api.createMessage(
    message.channel_id,
    { content: "Here are the **" + text.length + "** guilds I have stored" },
    { name: "list.txt", value: text.join("\n") }
  );
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

    let known;
    try {
      known = JSON.parse(readFileSync("articles.json", "utf-8"));
    } catch {
      return writeFileSync("articles.json", JSON.stringify([]));
    }

    const after = articles.filter(({ id }) => !known.includes(id));
    if (after.length) {
      known.push(...after.map(({ id }) => id));
      writeFileSync("articles.json", JSON.stringify(known));
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