import { Context } from "../util";

export default function ({ message, api }: Context) {
  let content = "";

  if (message.author.id === "152164749868662784") content = "ok tiemen here you go";
  else if (message.author.id === "194861788926443520")
    content = "you are in the repo 💀 but ok here is the link";
  else if (message.author.id === "190916650143318016")
    content = "fuck off you are tiemen too, but here you go";
  else if (message.author.id === "828387742575624222")
    content = "its not a security issue tho here's the source";
  else if (message.author.id === "128296384200835073")
    content = "the dog would like to see the github repository of mmm code here you go sir";
  else if (message.member.user.username.toLowerCase().includes("tiemen"))
    content =
      "why the fuck did you change your actual discord name this it isn't even funny, well heres the source";
  else if (message.member.nick.toLowerCase().includes("tiemen"))
    content = "i dont know who the fuck you are but you look kinda like tiemen so here you go";
  else content = "sorry i dont have a funny message for you but heres the source";

  content += " https://github.com/Commandtechno/DeJayboat";
  api.createMessage(message.channel_id, {
    content
  });
}