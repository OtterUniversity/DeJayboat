import { Context } from "../util";
import robert from "robert";

export const open = true;
export const name = "otter";
export const aliases = ["botter", "oter"];
export default async function ({ message, args, api }: Context) {
  let amount = 1;
  if (args[0]) {
    amount = Math.round(parseInt(args[0]));
    if (!amount) return api.createMessage(message.channel_id, { content: "Invalid amount" });
    if (amount < 1)
      return api.createMessage(message.channel_id, { content: "Amount under minimum" });

    if (amount > 10)
      return api.createMessage(message.channel_id, { content: "Amount over maximum" });
  }

  const { id } = await api.createMessage(message.channel_id, { content: "🦦 Loading..." });
  for (let i = 0; i < amount; i++) {
    const otter = await robert.get("https://otter.bruhmomentlol.repl.co/random").send();
    const ext = otter.headers["x-file-ext"];

    const completed = i + 1;
    const percent = Math.round((completed / amount) * 10);
    api.editMessage(
      message.channel_id,
      id,
      {
        content:
          "(`" +
          completed +
          "/" +
          amount +
          "`) [" +
          "🦦".repeat(percent) +
          "🐟".repeat(10 - percent) +
          "] "
      },
      { name: "otter" + completed + "." + ext, value: otter }
    );
  }
}