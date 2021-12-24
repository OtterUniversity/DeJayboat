import { Context } from "../../util";

const from = "Object.values(webpackJsonp.push([[],{['']:(_,e,r)=>{e.cache=r.c}},[['']]]).cache)";
const to = "(webpackChunkdiscord_app.push([[''],{},e=>{m=[];for(let c in e.c)m.push(e.c[c])}]),m)";

export const name = "snippets fix";
export const aliases = ["snippets webpack", "snippets fx"];
export default function ({ message, args, api }: Context) {
  if (!args.length) return api.createMessage(message.channel_id, { content: "no snippet to fix" });

  const snippet = args.join(" ");
  const fixed = snippet.replace(from, to);
  if (snippet === fixed) return api.createMessage(message.channel_id, { content: "no fix found" });

  api.createMessage(message.channel_id, {
    content: `\`\`\`js\n${fixed}\n\`\`\``,
    allowedMentions: { parse: [] }
  });
}