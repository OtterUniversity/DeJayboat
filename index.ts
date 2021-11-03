import * as commands from "./commands";
import * as config from "./config.js";
import * as ottercord from "ottercord";
import * as robert from "robert";

import { GatewayMessageCreateDispatchData } from "discord-api-types/v9";
import { shutdown } from "./store.js";
import { Gateway } from "detritus-client-socket";

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
    const args = d.content.slice(config.prefix.length).trim().split(/ +/);
    const command = args.shift();

    const run = commands[command];
    if (run) {
      if (!d.member.roles.includes(config.role) && !config.owners.includes(d.author.id))
        return api.createMessage(d.channel_id, { content: "👽 Missing permissions" });

      run({ message: d, args, api, ws });
    }
  }
});

ws.connect("wss://gateway.discord.gg");
