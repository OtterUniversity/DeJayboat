import { birthdays, updateBirthdays } from "./store";
import { birthdays as channel } from "./config";
import { Client } from "./util";

function todayUTC() {
  const now = new Date();
  return {
    key: now.toISOString().slice(0, 10),
    month: now.getUTCMonth() + 1,
    day: now.getUTCDate()
  };
}

export default function (api: Client["api"]) {
  async function check() {
    const { key, month, day } = todayUTC();
    if (birthdays.lastAnnounced === key) return;

    birthdays.lastAnnounced = key;
    updateBirthdays();

    for (const [id, entry] of Object.entries(birthdays.users)) {
      if (entry.month !== month || entry.day !== day) continue;

      const age = entry.year ? new Date().getUTCFullYear() - entry.year : undefined;
      api.createMessage(channel, {
        content: age
          ? `🎂 Happy birthday <@${id}>! You're **${age}** today!`
          : `🎂 Happy birthday <@${id}>!`,
        allowed_mentions: { users: [id] }
      });
    }
  }

  check();
  setInterval(check, 1000 * 60 * 30);
}
