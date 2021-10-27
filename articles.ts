import { articles as known, updateArticles } from "./store";
import { articles as channel } from "./config";
import { color, Client } from "./util";
import { load } from "cheerio";

import * as robert from "robert";

const zendesk = robert
  .client("https://support.discord.com/api/v2/help_center/en-us/articles.json")
  .query("sort_by", "created_at")
  .query("sort_order", "desc")
  .query("per_page", 99)
  .format("json");

export default async function (api: Client["api"]) {
  const categories = await robert
    .get("https://support.discord.com/api/v2/help_center/en-us/categories.json")
    .send("json")
    .then(res => Object.fromEntries(res.categories.map(c => [c.id, c])));

  const sections = await robert
    .get("https://support.discord.com/api/v2/help_center/en-us/sections.json")
    .send("json")
    .then(res => Object.fromEntries(res.sections.map(s => [s.id, s])));

  const callback = async () => {
    const { articles } = await zendesk.get().send();
    const after = articles.filter(({ id }) => !known.includes(id));
    if (after.length) {
      known.push(...after.map(({ id }) => id));
      updateArticles();
      const data = {
        content: after.map(a => a.html_url).join("\n"),
        embeds: after.map(a => {
          const section = sections[a.section_id] ?? "Unknown";
          const category = categories[section.category_id] ?? "Unknown";

          const html = load(a.body);
          const image = html("img")[0]?.attribs.src;
          const description =
            html
              .text()
              .replace(/^note:.+/gim, "")
              .trim()
              .slice(0, 200) + "...";

          const tags = a.label_names
            .map(tag =>
              tag
                .split(/[^\w]/gim)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(" ")
            )
            .join(" • ");

          return {
            color,
            description,
            title: a.title,
            url: a.html_url,
            timestamp: a.created_at,
            image: { url: image },
            footer: {
              text: tags
            },
            fields: [
              {
                name: "Section",
                value: "[" + section.name + "](" + section.html_url + ")",
                inline: true
              },
              {
                name: "Category",
                value: "[" + category.name + "](" + category.html_url + ")",
                inline: true
              }
            ]
          };
        })
      };

      api.createMessage(channel, data);
    }
  };

  callback();
  setInterval(callback, 900000);
}