import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { writeBirthdayICS } from "./birthdayIcs";

if (!existsSync("store")) mkdirSync("store");
if (!existsSync("store/guilds.json")) writeFileSync("store/guilds.json", JSON.stringify({}));
if (!existsSync("store/articles.json")) writeFileSync("store/articles.json", JSON.stringify([]));
if (!existsSync("store/shutdown.json")) writeFileSync("store/shutdown.json", JSON.stringify({}));
if (!existsSync("store/birthdays.json"))
  writeFileSync("store/birthdays.json", JSON.stringify({ users: {}, lastAnnounced: null }));

type Guilds = Record<string, string>;
type Articles = number[];
interface Shutdown {
  channel: string;
  message: string;
  time: number;
}

export interface BirthdayEntry {
  month: number;
  day: number;
  year?: number;
}
interface Birthdays {
  users: Record<string, BirthdayEntry>;
  lastAnnounced: string;
}

export const guilds: Guilds = JSON.parse(readFileSync("store/guilds.json", "utf-8"));
export const articles: Articles = JSON.parse(readFileSync("store/articles.json", "utf-8"));
export const shutdown: Shutdown = JSON.parse(readFileSync("store/shutdown.json", "utf-8"));
export const birthdays: Birthdays = JSON.parse(readFileSync("store/birthdays.json", "utf-8"));

export function updateGuilds() {
  writeFileSync("store/guilds.json", JSON.stringify(guilds));
}

export function updateArticles() {
  writeFileSync("store/articles.json", JSON.stringify(articles));
}

export function updateShutdown(data: Shutdown) {
  writeFileSync("store/shutdown.json", JSON.stringify(data));
}

export function updateBirthdays() {
  writeFileSync("store/birthdays.json", JSON.stringify(birthdays));
  writeBirthdayICS().catch(e => console.error("Failed to write birthday ics:", e));
}