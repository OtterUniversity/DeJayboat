import commands from "../commands";

import { owners, role } from "../config";
import { Context } from "../util";

export const open = true;
export const name = "help";
export default async function ({ message, api }: Context) {
  let content = "👌 You can use: ";
  for (const command of commands) {
    if (
      !command.open &&
      !owners.includes(message.author.id) &&
      !message.member.roles.includes(role)
    )
      continue;

    if (command.owner && !owners.includes(message.author.id)) continue;
    content += "\n`" + command.name + "`";
  }

  content = content.slice(0, -2);
  api.createMessage(message.channel_id, { content });
}
