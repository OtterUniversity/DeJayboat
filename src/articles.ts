import { articles as known, updateArticles } from "./store";
import { articles as channel } from "./config";
import { color, Client } from "./util";
import { load } from "cheerio";
import robert from "robert";

interface ZendeskCategory {
  id: number;
  name: string;
  html_url: string;
}

interface ZendeskSection {
  id: number;
  category_id: number;
  name: string;
  html_url: string;
}

interface ZendeskArticle {
  id: number;
  html_url: string;
  title: string;
  created_at: string;
  section_id: number;
  body: string;
  label_names: string[];
}

const zendesk = robert
  .client("https://support.discord.com/api/v2/help_center/en-us")
  .format("json");

export default async function (api: Client["api"]) {
  const categories: Record<string, ZendeskCategory> = await zendesk
    .get("/categories.json")
    .send()
    .then(res => Object.fromEntries(res.categories.map((c: ZendeskCategory) => [c.id, c])));

  const sections: Record<string, ZendeskSection> = await zendesk
    .get("/sections.json")
    .send()
    .then(res => Object.fromEntries(res.sections.map((s: ZendeskSection) => [s.id, s])));

  if (!known.length) {
    console.log("Setting up articles...");
    const { articles } = (await zendesk
      .get("/articles.json")
      .query("sort_by", "created_at")
      .query("sort_order", "desc")
      .query("per_page", 99)
      .send()) as { articles: ZendeskArticle[] };

    known.push(...articles.map(({ id }) => id));
    updateArticles();
  }

  setInterval(async () => {
    console.log("Fetching articles");
    const { articles } = (await zendesk
      .get("/articles.json")
      .query("sort_by", "created_at")
      .query("sort_order", "desc")
      .query("per_page", 99)
      .send()) as { articles: ZendeskArticle[] };

    const after = articles.filter(({ id }) => !known.includes(id));
    if (after.length) {
      known.push(...after.map(({ id }) => id));
      updateArticles();

      const data = {
        content: after.map(article => article.html_url).join("\n"),
        embeds: after.map(article => {
          const section = sections[article.section_id] ?? "Unknown";
          const category = categories[section.category_id] ?? "Unknown";

          const html = load(article.body);
          const image = html("img")[0]?.attribs.src;
          const description =
            html
              .text()
              .replace(/^note:.+/gim, "")
              .trim()
              .slice(0, 200) + "...";

          const tags = article.label_names
            .map((tag: string) =>
              tag
                .split(/[^\w]/gim)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(" ")
            )
            .join(" • ");

          return {
            color,
            description,
            title: article.title,
            url: article.html_url,
            timestamp: article.created_at,
            image: image ? { url: image } : undefined,
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
  }, 1000 * 60);
}