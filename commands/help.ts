import * as commands from "../commands";

import { Context } from "../util";
import { owners } from "../config";

export default async function ({ message, api }: Context) {
  let content = "👌 You can use:";
  const unique = new Set();
  for (const [name, command] of Object.entries(commands)) {
    // @ts-ignore owner does exist????
    if (command.owner && !owners.includes(message.author.id)) continue;
    if (unique.has(command)) continue;
    unique.add(command);

    content += "`" + name + "`, ";
  }

  api.createMessage(message.channel_id, { content });
}