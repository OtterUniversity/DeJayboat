import { APIInvite, APIPartialGuild } from "discord-api-types";
import { guilds, updateGuilds } from "../store";
import { Context, inviteRegex, color } from "../util";

export default async function ({ message, args, api }: Context) {
  const url = args.join(" ");
  if (!inviteRegex.test(url))
    return api.createMessage(message.channel_id, {
      content: "Invalid invite"
    });

  const code = inviteRegex.exec(url)[1];
  const invite: APIInvite = await api.getInvite(code, {
    withCounts: true
  });

  const { guild } = invite;
  if (!guilds[guild.id]) {
    guilds[guild.id] = guild.name;
    updateGuilds();
  }

  api.createMessage(message.channel_id, {
    embeds: [
      {
        color,
        title: guild.name,
        description: guild.description || "No description",
        url: `https://discord.gg/${invite.code}`,
        image: guild.banner && {
          url: `https://cdn.discordapp.com/api/banners/${guild.id}/${guild.banner}.png`
        },
        thumbnail: guild.icon && {
          url: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
        },
        fields: [
          { name: "Verification Level", value: guild.verification_level },
          {
            name: "Channel",
            value: `<#${invite.channel.id}> (\`${invite.channel.id}\`)\n> ${invite.channel.name}`
          },
          {
            name: "Welcome Screen",
            value: guild.welcome_screen?.description || "No welcome screen description provided."
          },
          {
            name: "Inviter",
            value: invite.inviter
              ? `<@${invite.inviter.id}> (\`${invite.inviter.id}\`)\n> ${invite.inviter.username}#${invite.inviter.discriminator}`
              : "None"
          },
          {
            name: "Members",
            value:
              "Total: " +
              invite.approximate_member_count +
              "\nOnline: " +
              invite.approximate_presence_count
          },
          {
            name: "Welcome Channels",
            value: guild.welcome_screen?.welcome_channels
              ?.map(channel => {
                let res = "";
                if (channel.emoji_name && !channel.emoji_id) res += channel.emoji_name + " ";
                res += `<#${channel.channel_id}> (\`${channel.channel_id}\`)\n> ${channel.description}`;
                return res;
              })
              .join("\n")
          },
          {
            name: "Features",
            value: guild.features
              .map(feature =>
                feature
                  .split("_")
                  .map(word => word.charAt(0) + word.slice(1).toLowerCase())
                  .join(" ")
              )
              .join(", ")
          }
        ]
      }
    ]
  });
}