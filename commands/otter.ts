import { Context } from "../util";
import * as robert from "robert";

export default async function ({ message, args, api }: Context) {
  const files = [];
  let amount = 1;
  if (args[0]) {
    amount = Math.round(parseInt(args[0]));
    if (!amount) return api.createMessage(message.channel_id, { content: "Invalid amount" });
    if (amount < 1)
      return api.createMessage(message.channel_id, { content: "Amount under minimum" });

    if (amount > 10)
      return api.createMessage(message.channel_id, { content: "Amount over maximum" });
  }

  for (let i = 0; i < amount; i++) {
    const otter = await robert.get("https://otter.bruhmomentlol.repl.co/random").send();
    files.push({ name: "otter" + i + "." + otter.headers["x-file-ext"], value: otter });
  }

  api.createMessage(message.channel_id, { content: "🦦" }, files);
}