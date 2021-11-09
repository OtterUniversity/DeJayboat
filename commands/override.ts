import { Context } from "../util";

export default function ({ message, args, api }: Context) {
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