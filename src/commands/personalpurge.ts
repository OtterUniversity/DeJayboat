import { Context, exactSnowflakeRegex } from "../util";

export const open = true;
export const name = "personalpurge";
export const aliases = ["ppurge"];
export default async function ({ message, api, ws, args }: Context) {
  const [filterArg] = args;

  let limit = 100;
  let after;
  if (filterArg) {
    if (exactSnowflakeRegex.test(filterArg)) {
      after = filterArg;
    } else {
      limit = parseInt(filterArg);
      if (!limit)
        return api.createMessage(message.channel_id, {
          content: "failed to parse as after or limit"
        });

      if (limit > 100)
        return api.createMessage(message.channel_id, {
          content: "cant download over 100 of your messages"
        });
    }
  }

  const statusMsg = await api.createMessage(message.channel_id, {
    content: `deleting messages after \`${after ?? "none"}\` with a limit of \`${limit}\``
  });

  let loopCount = 0;
  let deleted = 0;
  let before;

  while (deleted < limit && loopCount < 10) {
    const nextMessages = await api
      .getChannelMessages(message.channel_id, {
        before,
        after,
        limit: `${limit - deleted}`
      })
      .then((ms) => ms.filter((m) => m.author_id === message.author.id));

    if (nextMessages.length === 0) break;

    deleted += nextMessages.length;
    before = nextMessages[nextMessages.length - 1].id;

    await api.bulkDeleteMessages(message.channel_id, {
      messages: nextMessages.map((m) => m.id)
    });

    await api.editMessage(statusMsg.channel_id, statusMsg.id, {
      content: `deleted ${deleted}/${limit} messages`
    });

    loopCount++;
  }

  await api.editMessage(statusMsg.channel_id, statusMsg.id, {
    content: `done! deleted ${deleted} messages`
  });

  setTimeout(() => api.deleteMessage(statusMsg.channel_id, statusMsg.id), 5_000);
}
