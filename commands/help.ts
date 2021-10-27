import { Context } from "../util";
import * as commands from "../commands";

export default async function ({ message, api }: Context) {
  api.createMessage(message.channel_id, {
    content:
      "👌 You can ||(or can't idk)|| use: " +
      Object.keys(commands)
        .map(command => "`" + command + "`")
        .join(", ")
  });
}