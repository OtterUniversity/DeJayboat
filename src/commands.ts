import { lstatSync, readdirSync } from "fs";
import { resolve } from "path";
import { Context } from "./util";

export interface Command {
  open: boolean;
  owner: boolean;

  name: string;
  aliases: string[];
  default(context: Context);
}

const commands: Command[] = [];
function walk(dir: string) {
  for (const file of readdirSync(dir)) {
    const path = resolve(dir, file);
    const stat = lstatSync(path);
    if (stat.isDirectory()) walk(path);
    else if (file.endsWith(".js")) {
      const command = require(path);
      command.aliases ??= [];
      commands.push(command);
    }
  }
}

walk(resolve(__dirname, "commands"));
console.log("Loaded " + commands.length + " commands");

export default commands;