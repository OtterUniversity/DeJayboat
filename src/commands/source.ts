import { Context } from "../util";

export const name = "source";
export const aliases = ["src"];
export default function ({ message, api }: Context) {
  let content = "";

  if (message.author.id === "152164749868662784") content = "ok tiemen here you go";
  else if (message.author.id === "194861788926443520")
    content = "you are in the repo 💀 but ok here is the link";
  else if (message.author.id === "190916650143318016")
    content = "fuck off you are tiemen too, but here you go";
  else content = "here is the source 👽";

  content += " https://github.com/OtterUniversity/DeJayboat";
  api.createMessage(message.channel_id, { content });
}