import { execSync as exec } from "child_process";
import { updateShutdown } from "../store";
import { Context } from "../util";
import { owners } from "../config";

export default async function ({ message, api }: Context) {
  if (!owners.includes(message.author.id)) return;
  const updateMessage = await api.createMessage(message.channel_id, {
    content: "Pulling from GitHub"
  });

  exec("git pull");

  await api.editMessage(message.channel_id, updateMessage.id, {
    content: "Installing dependencies"
  });

  exec("npm install");

  await api.editMessage(message.channel_id, updateMessage.id, {
    content: "Compiling typescript"
  });
  exec("npm run build");

  await api.editMessage(message.channel_id, updateMessage.id, { content: "Exiting process" });
  updateShutdown({
    channel: updateMessage.channel_id,
    message: updateMessage.id,
    time: Date.now()
  });

  process.exit();
}