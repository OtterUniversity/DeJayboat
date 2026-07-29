export const exactSnowflakeRegex = /^\d{17,19}$/;
export const snowflakeRegex = /\b\d{17,19}\b/g;
export const color = parseInt("36393f", 16);

// Thanks Geek :) - https://git.io/Jz9RC
export const inviteRegex = /discord(?:app)?\.(?:com|gg)\/(?:invite\/)?(?<code>[\w-]{1,25})/;

import { GatewayMessageCreateDispatchData } from "discord-api-types/v10";

import type * as Api from "./rest";
import type * as Ws from "./gateway";

export interface Client {
  api: typeof Api;
  ws: typeof Ws;
}

// Commands only ever run off a MessageCreate dispatch that already passed a `guild_id` check.
export type GuildMessage = GatewayMessageCreateDispatchData & { guild_id: string };

export interface Context extends Client {
  message: GuildMessage;
  args: string[];
}

// en-CA formats as YYYY-MM-DD
const easternDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

export function easternToday() {
  const key = easternDate.format(new Date());
  return {
    key,
    year: parseInt(key.slice(0, 4)),
    month: parseInt(key.slice(5, 7)),
    day: parseInt(key.slice(8, 10))
  };
}
