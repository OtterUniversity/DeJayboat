export const exactSnowflakeRegex = /^\d{17,19}$/;
export const snowflakeRegex = /\b\d{17,19}\b/g;
export const color = parseInt("36393f", 16);

// Thanks Geek :) - https://git.io/Jz9RC
export const inviteRegex = /discord(?:app)?\.(?:com|gg)\/(?:invite\/)?(?<code>[\w-]{1,25})/;

import ottercord from "ottercord";
import murmurhash from "murmurhash";

import { GatewayMessageCreateDispatchData } from "discord-api-types";
import { Gateway } from "detritus-client-socket";
import { guilds } from "./store";
import robert from "robert";

export interface Client {
  api?: ReturnType<typeof ottercord>;
  ws?: Gateway.Socket;
}

export interface Context extends Client {
  message?: GatewayMessageCreateDispatchData;
  args?: string[];
}

export function fetchExperiments(): Promise<Record<string, any>> {
  return robert
    .get("https://discord-services.justsomederpyst.repl.co/experiment")
    .query("with_metadata", true)
    .agent("dejayboat/1.0")
    .send("json")
    .catch(() => ({}));
}

export async function collectExperiments(experiment, { message, args, api }: Context) {
  const treatments: Record<string, number> = {};
  let ids: string[] = [];

  const no = args.includes("-n") || args.includes("--no");
  if (!no) ids = Object.values(experiment.overrides).flat() as string[];

  const yes = args.includes("-y") || args.includes("--yes");
  if (!yes) {
    for await (const id of Object.keys(guilds)) {
      const range = murmurhash.v3(`${experiment.hash}:${id}`) % 1e4;
      let treatment = 0;
      experiment.populations.forEach(a => {
        Object.keys(a.buckets).forEach(b => {
          a.buckets[b].rollout.forEach(r => {
            if (range >= r.min && range <= r.max) treatment = parseInt(b);
          });
        });

        a.filters.forEach(f => {
          if (
            f.type == "guild_id_range" &&
            (BigInt(id) <= BigInt(f.min_id) || BigInt(id) >= BigInt(f.max_id))
          )
            treatment = 0;
        });
      });

      if (treatment > 0) {
        treatments[id] = treatment;
        ids.push(id);
      }
    }
  }

  return { ids, treatments };
}