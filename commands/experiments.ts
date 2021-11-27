import { color, Context, fetchExperiments } from "../util";

export default async function ({ message, args, api }: Context) {
  const experiments = await fetchExperiments();

  let page = 1;
  if (args[0]) {
    page = Math.round(parseInt(args[0]));
    if (!page || page < 1 || page > 5)
      return api.createMessage(message.channel_id, { content: "Invalid page" });
  }

  await api.createMessage(message.channel_id, {
    embeds: [
      {
        color,
        title: "🧪 Experiments",
        fields: Object.entries(experiments)
          .map(([id, experiment]) =>
            experiment.metadata.title
              ? {
                  name: experiment.metadata.title,
                  value: `${experiment.metadata.id} (${
                    experiment.metadata.type
                  })\nUpdated: <t:${Math.round(experiment.last_updated / 1000)}:f>`
                }
              : {
                  name: id,
                  value: "Unknown"
                }
          )
          .slice(10 * page - 10, 10 * page),
        footer: {
          text: "Page " + page + " of 5"
        }
      }
    ]
  });
}