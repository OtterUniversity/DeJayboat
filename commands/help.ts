import * as commands from "../commands";

import { owners, role } from "../config";
import { Context } from "../util";

export const open = true;
export default async function ({ message, api }: Context) {
  let content = "👌 You can use: ";
  const unique = new Set();
  for (const [name, command] of Object.entries(commands)) {
    if (
      // @ts-ignore open exists too
      !command.open &&
      !owners.includes(message.author.id) &&
      !message.member.roles.includes(role)
    )
      continue;

    // @ts-ignore owner does exist????
    if (command.owner && !owners.includes(message.author.id)) continue;
    if (unique.has(command)) continue;
    unique.add(command);

    content += "`" + name + "`, ";
  }

  // remove last comma
  content = content.slice(0, -2);
  api.createMessage(message.channel_id, { content });
}