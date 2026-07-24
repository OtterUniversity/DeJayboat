import { Context, exactSnowflakeRegex } from "../util";
import { APIMessage } from "discord-api-types/v10";
import { DiscordSnowflake } from "@sapphire/snowflake";

export const open = true;
export const name = "ping";
export default async function ({ message, api, ws }: Context) {
  const { id }: APIMessage = await api.createMessage(message.channel_id, {
    content: "Pinging gateway..."
  });

  const pings: [string, number | string][] = [];
  function edit() {
    return api.editMessage(message.channel_id, id, {
      content: pings.map(([type, ping]) => "🕓 **" + ping + "ms** " + type).join("\n")
    });
  }

  if (message.nonce != null && exactSnowflakeRegex.test(String(message.nonce)))
    pings.push([
      "User",
      DiscordSnowflake.timestampFrom(message.id) -
        DiscordSnowflake.timestampFrom(String(message.nonce))
    ]);

  pings.push(["Gateway", ws.getShardPing() ?? "?"]);
  await edit();

  const restStart = Date.now();
  await api.getCurrentUser();
  pings.push(["Rest", Date.now() - restStart]);
  await edit();
}
