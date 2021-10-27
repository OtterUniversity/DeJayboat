import { Context, color } from "../util";
import { inspect } from "util";
import { owners } from "../config";

export default async function ({ message, args, api }: Context) {
  if (owners.includes(message.author.id)) {
    try {
      let res = eval(args.join(" "));
      if (res instanceof Promise) {
        api.createMessage(message.channel_id, {
          content: "<a:crumbdance:877043850890317855> Resolving Promise"
        });

        try {
          res = await res;
        } catch (e) {
          return api.createMessage(message.channel_id, {
            content: e?.message ?? e ?? "⚠ Unknown Error"
          });
        }
      }

      api.createMessage(message.channel_id, {
        embeds: [
          {
            color,
            description: "```js\n" + inspect(res, { depth: 1 }).toString().trim() + "```"
          }
        ]
      });
    } catch (e) {
      api.createMessage(message.channel_id, {
        content: e?.message ?? e ?? "⚠ Unknown Error"
      });
    }
  }
}