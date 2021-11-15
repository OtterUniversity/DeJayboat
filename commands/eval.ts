import { Context, color } from "../util";
import { inspect } from "util";
import { owners } from "../config";

const prefix = "```js\n";
const suffix = "\n```";
const slice = "...";
const max = 4096;

export default async function ({ message, args, api }: Context) {
  if (!owners.includes(message.author.id)) return;
  try {
    let out = eval(args.join(" "));
    if (out instanceof Promise) {
      api.createMessage(message.channel_id, {
        content: "<a:crumbdance:877043850890317855> Resolving Promise"
      });

      try {
        out = await out;
      } catch (e) {
        return api.createMessage(message.channel_id, {
          content: e?.message ?? e ?? "⚠ Unknown Error"
        });
      }
    }

    let res: string = typeof out === "string" ? out : inspect(out, { depth: 1 });
    if (res.length > max - prefix.length - suffix.length - slice.length)
      res = res.slice(0, max - prefix.length - suffix.length - slice.length) + "...";

    const description = prefix + res + suffix;
    api.createMessage(message.channel_id, { embeds: [{ color, description }] });
  } catch (e) {
    api.createMessage(message.channel_id, {
      content: e?.message ?? e ?? "⚠ Unknown Error"
    });
  }
}