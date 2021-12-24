import { APIMessage } from "discord-api-types";
import { Context } from "../util";
import robert from "robert";

export const open = true;
export const name = "ping";
export default async function ({ message, api, ws }: Context) {
  const { id }: APIMessage = await api.createMessage(message.channel_id, {
    content: "Pinging gateway..."
  });

  const pings = [];
  function edit() {
    return api.editMessage(message.channel_id, id, {
      content: pings.map(([type, ping]) => "🕓 **" + ping + "ms** " + type).join("\n")
    });
  }

  pings.push(["Gateway", await ws.ping()]);
  await edit();

  const restStart = Date.now();
  await api.getCurrentUser();
  pings.push(["Rest", Date.now() - restStart]);
  await edit();

  const experimentStart = Date.now();
  await robert.get("https://discord-services.justsomederpyst.repl.co/experiment").send("status");
  pings.push(["Experiment", Date.now() - experimentStart]);
  edit();
}