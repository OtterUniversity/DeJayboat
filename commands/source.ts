import { Context } from "../util";

export default function ({ message, api }: Context) {
  api.createMessage(message.channel_id, {
    content: "ok tiemen here you go https://github.com/Commandtechno/DeJayboat"
  });
}