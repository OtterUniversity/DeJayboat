import { Context, color } from "../../util";
import { inspect } from "util";

const prefix = "```js\n";
const suffix = "\n```";
const slice = "...";
const max = 4096;

function $(path) {
  return require(path);
}

export const owner = true;
export const name = "eval";
export default async function ({ message, args, api, ws }: Context) {
  try {
    let out = eval(args.join(" "));
    if (out instanceof Promise) {
      api.createMessage(message.channel_id, {
        content: "<a:crumbdance:877043850890317855> @everyone *we do a bit of trolling*"
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
