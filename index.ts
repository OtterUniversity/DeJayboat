import * as config from "./config";
import * as ottercord from "ottercord";
import * as robert from "robert";

import { GatewayMessageCreateDispatchData } from "discord-api-types/v9";
import { shutdown } from "./store.js";
import { Gateway } from "detritus-client-socket";

import commands from "./commands";
import articles from "./articles";

const ws = new Gateway.Socket(config.token);
const api = ottercord(config.token);

ws.on("ready", () => {
  if (shutdown.time && shutdown.channel && shutdown.message && Date.now() - shutdown.time < 60000)
    api.editMessage(shutdown.channel, shutdown.message, { content: "🟢 Online" });
});

ws.on("packet", async ({ t, d }: { t: string; d: GatewayMessageCreateDispatchData }) => {
  if (t === "MESSAGE_CREATE" && d.guild_id) {
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
    const rest = d.content.slice(config.prefix.length).trim();

    let command;
    for (const _command in commands) if (rest.startsWith(_command)) command = _command;

    if (!command) return;
    if (
      !command.open &&
      !config.owners.includes(d.author.id) &&
      !d.member.roles.includes(config.role)
    )
      return api.createMessage(d.channel_id, { content: "👽 Missing permissions" });

    if (command.owner && !config.owners.includes(d.author.id))
      return api.createMessage(d.channel_id, { content: "💀 You don't have access to that" });

    const args = rest.split(/ +/);
    try {
      await command.default({ message: d, args, api, ws });
    } catch (e) {
      api.createMessage(d.channel_id, {
        content: "<@296776625432035328> it broke\n```js\n" + e.message + "\n" + e.stack + "```"
      });
    }
  }
});

ws.connect("wss://gateway.discord.gg");

articles(api);