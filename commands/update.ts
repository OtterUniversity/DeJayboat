import { updateShutdown } from "../store";
import { execSync } from "child_process";
import { Context } from "../util";
import { owners } from "../config";

export default async function ({ message, api }: Context) {
  if (owners.includes(message.author.id)) {
    const updateMessage = await api.createMessage(message.channel_id, {
      content: "Pulling from GitHub"
    });
    execSync("git pull");

    await api.editMessage(message.channel_id, updateMessage.id, {
      content: "Installing dependencies"
    });

    execSync("npm install");

    await api.editMessage(message.channel_id, updateMessage.id, {
      content: "Compiling typescript"
    });
    execSync("npm run build");

    await api.editMessage(message.channel_id, updateMessage.id, { content: "Exiting process" });
    updateShutdown({ channel: message.channel_id, message: message.id, time: Date.now() });

    process.exit();
  }
}