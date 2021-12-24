import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

if (!existsSync("store")) mkdirSync("store");
if (!existsSync("store/guilds.json")) writeFileSync("store/guilds.json", JSON.stringify({}));
if (!existsSync("store/articles.json")) writeFileSync("store/articles.json", JSON.stringify([]));
if (!existsSync("store/shutdown.json")) writeFileSync("store/shutdown.json", JSON.stringify({}));

type Guilds = Record<string, string>;
type Articles = number[];
interface Shutdown {
  channel: string;
  message: string;
  time: number;
}

export const guilds: Guilds = JSON.parse(readFileSync("store/guilds.json", "utf-8"));
export const articles: Articles = JSON.parse(readFileSync("store/articles.json", "utf-8"));
export const shutdown: Shutdown = JSON.parse(readFileSync("store/shutdown.json", "utf-8"));

export function updateGuilds() {
  writeFileSync("store/guilds.json", JSON.stringify(guilds));
}

export function updateArticles() {
  writeFileSync("store/articles.json", JSON.stringify(articles));
}

export function updateShutdown(data: Shutdown) {
  writeFileSync("store/shutdown.json", JSON.stringify(data));
}