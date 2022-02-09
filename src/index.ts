import * as config from "./config";

import {
  UserFlags,
  GatewayDispatchEvents,
  GatewayMessageCreateDispatchData,
  GatewayGuildMemberAddDispatchData
} from "discord-api-types/v9";
import { Gateway } from "detritus-client-socket";
import { shutdown } from "./store.js";

import commands, { Command } from "./commands";
import articles from "./articles";

import ottercord from "ottercord";
import robert from "robert";

const ws = new Gateway.Socket(config.token);
const api = ottercord(config.token);

ws.on("ready", () => {
  if (shutdown.time && shutdown.channel && shutdown.message && Date.now() - shutdown.time < 60000)
    api.editMessage(shutdown.channel, shutdown.message, { content: "🟢 Online" });
});

ws.on("packet", async ({ t, d }: { t: string; d }) => {
  if (t === GatewayDispatchEvents.MessageCreate && d.guild_id) {
    const message: GatewayMessageCreateDispatchData = d;
    if (message.channel_id === config.datamining) {
      const [embed] = message.embeds;
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

        if (files.length) api.createMessage(message.channel_id, {}, files);
      }
    }

    const svgs = message.content.match(/https?:\/\/\S+\.svg\b/g) ?? [];
    if (message.attachments.length) {
      const attachments = message.attachments.map(({ url }) => url);
      svgs.push(...attachments);
    }

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

      if (files.length) api.createMessage(message.channel_id, {}, files);
    }

    if (!message.content.startsWith(config.prefix)) return;

    let next = message.content.slice(config.prefix.length).trim();
    let command: Command;
    for (const _command of commands) {
      if (next === _command.name || next.startsWith(_command.name + " ")) {
        next = next.slice(_command.name.length).trim();
        command = _command;
        break;
      }

      for (const alias of _command.aliases)
        if (next === alias || next.startsWith(alias + " ")) {
          next = next.slice(alias.length).trim();
          command = _command;
          break;
        }

      if (command) break;
    }

    if (!command) return;
    if (
      !command.open &&
      !config.owners.includes(message.author.id) &&
      !message.member.roles.includes(config.role)
    )
      return api.createMessage(message.channel_id, { content: "👽 Missing permissions" });

    if (command.owner && !config.owners.includes(message.author.id))
      return api.createMessage(message.channel_id, { content: "💀 You don't have access to that" });

    const args = next.split(/ +/);
    try {
      await command.default({ message, args, api, ws });
    } catch (e) {
      console.log(e);
      api.createMessage(message.channel_id, {
        content: "<@296776625432035328> it broke\n```js\n" + e.message + "\n" + e.stack + "```"
      });
    }
  }

  if (t === GatewayDispatchEvents.GuildMemberAdd) {
    const member: GatewayGuildMemberAddDispatchData = d;
    if (member.user.bot) return;
    if ((member.user.flags & UserFlags.Staff) === UserFlags.Staff)
      api.addGuildMemberRole(member.guild_id, member.user.id, "919850136643969054");
  }
});

ws.connect("wss://gateway.discord.gg");

articles(api);