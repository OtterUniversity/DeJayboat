import { Context } from "../util";
import * as commands from "../commands";

export default async function ({ message, api }: Context) {
  let unique = new Map();
  for (const [command, run] of Object.entries(commands)) {
    const id = run.toString();
    if (unique.has(id)) unique.set(id, unique.get(id) + ", " + command);
    else unique.set(id, "`" + command + "`");
  }

  api.createMessage(message.channel_id, {
    content: "👌 You can ||(or can't idk)|| use:\n" + [...unique.values()].join("\n")
  });
}