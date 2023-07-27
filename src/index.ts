import * as config from "./config";

import {
  UserFlags,
  GatewayDispatchEvents,
  GatewayMessageCreateDispatchData,
  GatewayGuildMemberAddDispatchData,
  MessageFlags,
  GatewayMessageUpdateDispatchData
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
      if (!embed?.description) return;

      const mdImageRegex = /!\[.*?\]\((?<image>.*?)\)/g;
      const htmlImageRegex = /<img.*?src="(?<image>.*?)"/g;

      let match;
      let images = [];

      while ((match = mdImageRegex.exec(embed.description))) images.push(match.groups.image);
      while ((match = htmlImageRegex.exec(embed.description))) images.push(match.groups.image);

      if (images) {
        for (const image of images.slice(0, 10)) {
          try {
            new URL(image);
          } catch {
            break;
          }

          // todo: check if the image url is valid?
          await api.createMessage(message.channel_id, { content: image });
        }
      }
    }

    if (message.channel_id === "1094133074243108954") {
      // TODO: Move to config :)
      const content = message.content?.toLowerCase();
      if (content !== "5") {
        api.deleteMessage(message.channel_id, message.id);
      }
    }

    if (message.author.id === "444871677176709141" && message.content.replaceAll("\u200b", "") === "You forgot the hyphen! It's Spider-Man*") {
      api.createMessage(message.channel_id, { content: "shut up" });
    }

    const svgs: string[] = message.content.match(/https?:\/\/\S+\.svg\b/g) ?? [];
    if (message.attachments.length) {
      const attachments = message.attachments.map(({ url }) => url);
      svgs.push(...attachments);
    }

    if (message.content.includes("https://spotify.link/")) {
      const [short] = message.content.match(/https:\/\/spotify\.link\/.{11}/g) ?? [];
      let spotify: string;
      await robert
        .head(short)
        .full()
        .send()
        .then(res => (spotify = res.headers.location))
        .catch(() => {});
      await api.createMessage(message.channel_id, {
        content: spotify
      });
    }

    if (message.embeds.length) {
      const tiktoks = message.embeds.filter(
        embed => embed.provider && embed.provider.name === "TikTok" && embed.url && embed.url.includes("tiktok.com")
      );

      if (tiktoks.length) {
        await api.editMessage(message.channel_id, message.id, { flags: MessageFlags.SuppressEmbeds });
        await api.createMessage(message.channel_id, {
          content: tiktoks.map(({ url }) => url.replace("tiktok.com", "tiktxk.com")).join("\n")
        });
      }

      const tweets = message.embeds.filter(
        embed => embed.url && embed.url.startsWith("https://twitter.com") && embed.video
      );

      if (tweets.length) {
        await api.editMessage(message.channel_id, message.id, { flags: MessageFlags.SuppressEmbeds });
        await api.createMessage(message.channel_id, {
          content: tweets.map(({ url }) => url.replace("twitter.com", "fxtwitter.com")).join("\n")
        });
      }
    }

    if (svgs) {
      const files = [];
      for await (const svg of svgs.slice(0, 10)) {
        let validSvg: boolean;
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
    if (!command.open && !config.owners.includes(message.author.id) && !message.member.roles.includes(config.role))
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

  if (t === GatewayDispatchEvents.MessageUpdate && d.guild_id) {
    const updated_message: GatewayMessageUpdateDispatchData = d;
    if (updated_message.channel_id === "1094133074243108954") {
      // TODO: Move to config :)
      const content = updated_message.content?.toLowerCase();
      if (content !== "5") {
        api.deleteMessage(updated_message.channel_id, updated_message.id);
      }
    }

    if (updated_message.embeds.length) {
      const tweets = updated_message.embeds.filter(
        embed => embed.url && embed.url.startsWith("https://twitter.com") && embed.video
      );

      if (tweets.length) {
        await api.editMessage(updated_message.channel_id, updated_message.id, { flags: MessageFlags.SuppressEmbeds });
        await api.createMessage(updated_message.channel_id, {
          content: tweets.map(({ url }) => url.replace("twitter.com", "fxtwitter.com")).join("\n")
        });
      }
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
