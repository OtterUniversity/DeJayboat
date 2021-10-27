import { Context } from "../util";
import * as robert from "robert";

export default async function (ctx: Context) {
  const otter = await robert.get("https://otter.bruhmomentlol.repl.co/random").full().send();
  ctx.api.createMessage(
    ctx.message.channel_id,
    {},
    { name: "otter." + otter.headers["x-file-ext"], value: otter.data }
  );
}