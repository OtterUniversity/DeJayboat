import { color, Context, fetchExperiments } from "../util";

export default async function ({ message, api }: Context) {
  const experiments = await fetchExperiments();
  api.createMessage(message.channel_id, {
    embeds: [
      {
        color,
        title: "Experiments",
        fields: Object.values(experiments)
          .map(experiment => ({
            inline: true,
            name: experiment.meta?.title ?? "Unknown",
            value: `${experiment.id} (${experiment.type})\nUpdated: <t:${
              experiment.last_updated / 1000
            }:f>`
          }))
          .slice(0, 25)
      }
    ]
  });
}