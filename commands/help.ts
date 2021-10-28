import { Context } from "../util";
import * as commands from "../commands";

export default async function ({ message, api }: Context) {
  let content = "👌 You can ||(or can't idk)|| use:\n";

  let unique = new Set();
  for (const [command, run] of Object.entries(commands)) {
    const id = run.toString();
    if (!unique.has(id)) {
      unique.add(id);
      content += "\n`" + command + "`";
    }
  }

  api.createMessage(message.channel_id, {
    content
  });
}