import { color, Context, fetchExperiments } from "../util";

export default async function ({ message, api }: Context) {
  const experiments = await fetchExperiments();
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
          .slice(0, 10)
      }
    ]
  });
}