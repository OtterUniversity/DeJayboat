import { WebSocketManager, WebSocketShardEvents } from "@discordjs/ws";
import { GatewayIntentBits } from "discord-api-types/v10";

import { rest } from "./rest";
import { token } from "./config";

export { WebSocketShardEvents };

export const manager = new WebSocketManager({
  token,
  intents:
    GatewayIntentBits.Guilds |
    GatewayIntentBits.GuildMembers |
    GatewayIntentBits.GuildMessages |
    GatewayIntentBits.MessageContent,
  rest
});

const shardPings = new Map<number, number>();
manager.on(WebSocketShardEvents.HeartbeatComplete, (stats, shardId) => {
  shardPings.set(shardId, stats.latency);
});

export function getShardPing(shardId = 0): number | undefined {
  return shardPings.get(shardId);
}

export function connect(): Promise<void> {
  return manager.connect();
}
