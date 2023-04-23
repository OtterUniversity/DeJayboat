import { color, Context } from "../../util";

interface DiscordOverride {
  targetBuildOverride: Record<string, object>;
  releaseChannel: string;
  validForUserIds: string[];
  allowLoggedOut: boolean;
  expiresAt: string;
}

interface FireOverride {
  bucket: number;
  experiment: number;
  id: number;
  releaseChannel: string;
  validForUserIds?: string[];
}

export const name = "override";
export const aliases = ["overrideinfo", "oi"];
export default function ({ message, args, api }: Context) {
  if (!args.length)
    return api.createMessage(message.channel_id, { content: "Please specify an override URL" });

  let url: URL;
  try {
    url = new URL(args.join(" "));
  } catch {
    return api.createMessage(message.channel_id, { content: "Invalid URL" });
  }

  const param = url.searchParams.get("s");
  if (
    url.hostname === "discord.com" ||
    url.hostname === "discordapp.com" ||
    url.hostname === "ptb.discord.com" ||
    url.hostname === "ptb.discordapp.com" ||
    url.hostname === "canary.discord.com" ||
    url.hostname === "canary.discordapp.com"
  ) {
    const [, encoded] = param.split(".");
    if (!encoded) return api.createMessage(message.channel_id, { content: "Invalid Parameter" });

    let decoded: string;
    try {
      decoded = Buffer.from(encoded, "base64").toString();
    } catch {
      return api.createMessage(message.channel_id, { content: "Invalid Base64" });
    }

    let data: DiscordOverride;
    try {
      data = JSON.parse(decoded);
    } catch {
      return api.createMessage(message.channel_id, { content: "Invalid JSON" });
    }

    const fields = Object.entries(data.targetBuildOverride).map(([platform, target]) => ({
      name: platform,
      //@ts-ignore im lazy
      value: "`" + target.type + "` " + target.id
    }));

    const dataStr = JSON.stringify(data, null, 2)
    api.createMessage(message.channel_id, {
      content: dataStr.length < 1000 ? "```json\n" + JSON.stringify(data, null, 2) + "```" : "",
      embeds: [
        {
          color,
          timestamp: new Date(data.expiresAt),
          footer: {
            text: "Expires"
          },
          fields: [
            {
              name: "Users",
              value: data.validForUserIds.map(id => `<@${id}>`).join("\n") || "None",
              inline: true
            },
            {
              name: "Release Channel",
              value: data.releaseChannel ?? "None",
              inline: true
            },
            {
              name: "Allow Logged Out",
              value: data.allowLoggedOut ? "Yes" : "No",
              inline: true
            },
            ...fields
          ]
        }
      ]
    }, dataStr.length < 1000 ? null : { name: 'override.json', value: JSON.stringify(data, null, 2) });
  } else if (url.hostname === "inv.wtf") {
    let decoded: string;
    try {
      decoded = Buffer.from(param, "base64").toString();
    } catch {
      return api.createMessage(message.channel_id, { content: "Invalid Base64" });
    }

    let data: FireOverride;
    try {
      data = JSON.parse(decoded);
    } catch {
      return api.createMessage(message.channel_id, { content: "Invalid JSON" });
    }

    api.createMessage(message.channel_id, {
      content: "```json\n" + JSON.stringify(data, null, 2) + "```",
      embeds: [
        {
          color,
          fields: [
            {
              name: "ID",
              value: data.id.toString(),
              inline: true
            },
            {
              name: "Bucket",
              value: data.bucket.toString(),
              inline: true
            },
            {
              name: "Experiment",
              value: data.experiment.toString(),
              inline: true
            },
            {
              name: "Release Channel",
              value: data.releaseChannel ?? "None"
            },
            {
              name: "Users",
              value: data.validForUserIds?.length ? data.validForUserIds.map(id => `<@${id}>`).join("\n") : "None"
            }
          ]
        }
      ]
    });
  } else return api.createMessage(message.channel_id, { content: "Invalid origin" });
}
