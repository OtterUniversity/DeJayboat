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

import sanitizer from "@aero/sanitizer";
import ottercord from "ottercord";
import robert from "robert";

const ws = new Gateway.Socket(config.token);
const api = ottercord(config.token);

const tweetRegex = /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/[^\/]+\/status\/(\d+)/g;
const recentTweets = new Map<string, GatewayMessageCreateDispatchData>();
const repostGifs = [
  "https://tenor.com/view/killablades-cat-gif-20293604",
  "https://tenor.com/view/live-tucker-reaction-live-tucker-reaction-gif-21635164",
  "https://tenor.com/view/mean-cat-cat-fu-gif-23644413",
  "https://tenor.com/view/sus-cat-cat-stare-stare-bruh-cat-really-n-gif-25597234",
  "https://tenor.com/view/cat-cat-meme-cat-staring-cat-stare-stop-staring-at-me-please-gif-9315292369693569596",
  "https://media.discordapp.net/attachments/985005849552494612/996208706389823619/gat.gif",
  "https://media.discordapp.net/attachments/570617862327238656/1122143799632728124/1CFC6F34-BB31-40F6-AA72-DE250F097A90-1.gif",
  "https://tenor.com/view/cat-i-am-going-insane-insane-gif-25031823",
  "https://tenor.com/view/what-happened-what-happened-to-you-as-a-child-what-kind-of-trauma-makes-you-act-like-this-stare-stare-cat-gif-2454779732634892782",
  "https://tenor.com/view/cat-walking-cat-come-cute-cat-walking-gif-8692571989328773745",
  "https://tenor.com/view/nuh-uh-beocord-no-lol-gif-24435520",
  "https://tenor.com/view/cat-cats-furious-cute-kitty-gif-3789237232849071146"
];

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

    // #region Channel 5
    if (message.channel_id === "1094133074243108954") {
      // TODO: Move to config :)
      const content = message.content?.toLowerCase();
      if (content !== "5") {
        api.deleteMessage(message.channel_id, message.id);
      }
    }
    // #endregion

    // #region Repost Detector
    let match: RegExpExecArray | null;
    while ((match = tweetRegex.exec(message.content)) !== null) {
      const tweetId = match[1];
      if (recentTweets.has(tweetId)) {
        const ogMessage = recentTweets.get(tweetId)!;
        const ogMessageUrl = `https://discord.com/channels/${message.guild_id}/${message.channel_id}/${message.id}`;
        api.createMessage(message.channel_id, {
          content: `<:wires:1208617503232892938> repost detected${"!".repeat(
            Math.floor(Math.random() * 5 + 1)
          )} this was posted <t:${Math.floor(new Date(ogMessage.timestamp).getTime() / 1000)}:R> by <@${
            ogMessage.author.id
          }>: ${ogMessageUrl}

${repostGifs[Math.floor(Math.random() * repostGifs.length)]}`,
          allowedMentions: { parse: [] },
          messageReference: { message_id: message.id, replied_user: true }
        });
      } else {
        recentTweets.set(tweetId, message);
        setTimeout(() => recentTweets.delete(tweetId), 24 * 60 * 60 * 1000);
      }
    }
    // #endregion

    // #region Command Parsing
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
    // #endregion
  }

  if (t === GatewayDispatchEvents.MessageUpdate && d.guild_id) {
    const updated_message: GatewayMessageUpdateDispatchData = d;
    if (updated_message.channel_id === "1094133074243108954") {
      const content = updated_message.content?.toLowerCase();
      if (content !== "5") {
        api.deleteMessage(updated_message.channel_id, updated_message.id);
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
