import { birthdays, updateBirthdays } from "./store";
import { birthdays as channel } from "./config";
import { Client, easternToday } from "./util";

export default function (api: Client["api"]) {
  async function check() {
    const { key, year, month, day } = easternToday();
    if (birthdays.lastAnnounced === key) return;

    birthdays.lastAnnounced = key;
    updateBirthdays();

    for (const [id, entry] of Object.entries(birthdays.users)) {
      if (entry.month !== month || entry.day !== day) continue;

      const age = entry.year ? year - entry.year : undefined;
      api.createMessage(channel, {
        content: age
          ? `🎂 Happy birthday <@${id}>! You're **${age}** today!`
          : `🎂 Happy birthday <@${id}>!`,
        allowed_mentions: { users: [id] }
      });
    }
  }

  check();
  setInterval(check, 1000 * 60);
}
