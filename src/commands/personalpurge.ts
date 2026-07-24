import { Context, exactSnowflakeRegex } from "../util";
import { DiscordSnowflake } from "@sapphire/snowflake";
import ms from "ms";

export const open = true;
export const name = "personalpurge";
export const aliases = ["ppurge"];

const MAX_LIMIT = 100;
const MAX_PAGES = 10;
const BULK_DELETE_AGE_LIMIT = 14 * 24 * 60 * 60 * 1000;

export default async function ({ message, args, api }: Context) {
  let [first, second] = args;

  let after: string | undefined;
  if (first && exactSnowflakeRegex.test(first)) {
    after = first;
    first = second;
  }

  if (!first)
    return api.createMessage(message.channel_id, {
      content: "specify a number of messages or a time span (eg. `1h`) to delete"
    });

  let limit: number;
  let statusDescription: string;

  if (/[a-z]/i.test(first)) {
    const duration = ms(first as ms.StringValue);
    if (!duration) return api.createMessage(message.channel_id, { content: "failed to parse time span" });

    after = DiscordSnowflake.generate({ timestamp: Date.now() - duration }).toString();
    limit = Infinity;
    statusDescription = `all of your messages from the past \`${first}\``;
  } else {
    limit = parseInt(first, 10);
    if (!limit || limit < 1) return api.createMessage(message.channel_id, { content: "failed to parse limit" });

    if (limit > MAX_LIMIT)
      return api.createMessage(message.channel_id, { content: "cant delete over 100 of your messages" });

    statusDescription = after
      ? `up to \`${limit}\` of your messages after \`${after}\``
      : `up to \`${limit}\` of your messages`;
  }

  const status = await api.createMessage(message.channel_id, {
    content: `deleting ${statusDescription}`
  });

  let deleted = 0;
  let before: string | undefined;

  for (let page = 0; page < MAX_PAGES && deleted < limit; page++) {
    const batch = await api.getChannelMessages(message.channel_id, { before, limit: 100 });
    if (batch.length === 0) break;

    before = batch[batch.length - 1].id;

    let mine = batch.filter(m => m.author.id === message.author.id);
    if (after) mine = mine.filter(m => BigInt(m.id) > BigInt(after!));
    mine = mine.slice(0, limit - deleted);

    if (mine.length > 0) {
      const cutoff = Date.now() - BULK_DELETE_AGE_LIMIT;
      const fresh = mine.filter(m => DiscordSnowflake.timestampFrom(m.id) > cutoff);
      const stale = mine.filter(m => DiscordSnowflake.timestampFrom(m.id) <= cutoff);

      if (fresh.length === 1) await api.deleteMessage(message.channel_id, fresh[0].id);
      else if (fresh.length > 1)
        await api.bulkDeleteMessages(message.channel_id, { messages: fresh.map(m => m.id) });

      for (const m of stale) await api.deleteMessage(message.channel_id, m.id);

      deleted += mine.length;
      await api.editMessage(status.channel_id, status.id, {
        content: Number.isFinite(limit) ? `deleted ${deleted}/${limit} messages` : `deleted ${deleted} messages`
      });
    }

    // batch is sorted newest to oldest, so once the oldest message in it is past `after` there's nothing left to find
    if (after && BigInt(before) <= BigInt(after)) break;
  }

  await api.editMessage(status.channel_id, status.id, { content: `done! deleted ${deleted} messages` });
  setTimeout(() => api.deleteMessage(status.channel_id, status.id), 5_000);
}
