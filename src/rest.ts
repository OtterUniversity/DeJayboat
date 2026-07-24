import { REST, DiscordAPIError, makeURLSearchParams } from "@discordjs/rest";
import type { RawFile } from "@discordjs/rest";
import {
  Routes,
  type Snowflake,
  type RESTPostAPIChannelMessageJSONBody,
  type RESTPatchAPIChannelMessageJSONBody,
  type RESTGetAPIChannelMessagesQuery,
  type RESTPostAPIChannelMessagesBulkDeleteJSONBody,
  type RESTPutAPIGuildBanJSONBody,
  type RESTPostAPIChannelWebhookJSONBody,
  type RESTPostAPIWebhookWithTokenJSONBody,
  type RESTGetAPIInviteQuery,
  type APIMessage,
  type APIUser,
  type APIGuildMember,
  type APIBan,
  type APIGuildPreview,
  type APIGuildChannel,
  type APIGuildWidget,
  type APIWebhook,
  type APIInvite,
  type APIChannel
} from "discord-api-types/v10";

import { token } from "./config";

export { DiscordAPIError };
export type { RawFile };

export const rest = new REST({ version: "10" }).setToken(token);

// Both @discordjs/rest errors and `robert`'s errors expose `.status`, but neither is `unknown`-safe to destructure directly.
export function errorStatus(e: unknown): number | undefined {
  return e && typeof e === "object" && "status" in e ? (e as { status?: number }).status : undefined;
}

export function createMessage(
  channelId: Snowflake,
  body: RESTPostAPIChannelMessageJSONBody,
  files?: RawFile[]
): Promise<APIMessage> {
  return rest.post(Routes.channelMessages(channelId), { body, files }) as Promise<APIMessage>;
}

export function editMessage(
  channelId: Snowflake,
  messageId: Snowflake,
  body: RESTPatchAPIChannelMessageJSONBody,
  files?: RawFile[]
): Promise<APIMessage> {
  return rest.patch(Routes.channelMessage(channelId, messageId), { body, files }) as Promise<APIMessage>;
}

export function deleteMessage(channelId: Snowflake, messageId: Snowflake, reason?: string): Promise<void> {
  return rest.delete(Routes.channelMessage(channelId, messageId), { reason }) as Promise<void>;
}

export function getChannelMessages(
  channelId: Snowflake,
  query?: RESTGetAPIChannelMessagesQuery
): Promise<APIMessage[]> {
  return rest.get(Routes.channelMessages(channelId), {
    query: query && makeURLSearchParams(query)
  }) as Promise<APIMessage[]>;
}

export function bulkDeleteMessages(
  channelId: Snowflake,
  body: RESTPostAPIChannelMessagesBulkDeleteJSONBody,
  reason?: string
): Promise<void> {
  return rest.post(Routes.channelBulkDelete(channelId), { body, reason }) as Promise<void>;
}

export function createReaction(channelId: Snowflake, messageId: Snowflake, emoji: string): Promise<void> {
  return rest.put(Routes.channelMessageOwnReaction(channelId, messageId, emoji), {}) as Promise<void>;
}

export function addGuildMemberRole(
  guildId: Snowflake,
  userId: Snowflake,
  roleId: Snowflake,
  reason?: string
): Promise<void> {
  return rest.put(Routes.guildMemberRole(guildId, userId, roleId), { reason }) as Promise<void>;
}

export function getUser(userId: Snowflake): Promise<APIUser> {
  return rest.get(Routes.user(userId)) as Promise<APIUser>;
}

export function getCurrentUser(): Promise<APIUser> {
  return rest.get(Routes.user("@me")) as Promise<APIUser>;
}

export function getGuildMember(guildId: Snowflake, userId: Snowflake): Promise<APIGuildMember> {
  return rest.get(Routes.guildMember(guildId, userId)) as Promise<APIGuildMember>;
}

export function getGuildBan(guildId: Snowflake, userId: Snowflake): Promise<APIBan> {
  return rest.get(Routes.guildBan(guildId, userId)) as Promise<APIBan>;
}

export function createGuildBan(
  guildId: Snowflake,
  userId: Snowflake,
  body: RESTPutAPIGuildBanJSONBody,
  reason?: string
): Promise<void> {
  return rest.put(Routes.guildBan(guildId, userId), { body, reason }) as Promise<void>;
}

export function removeGuildBan(guildId: Snowflake, userId: Snowflake, reason?: string): Promise<void> {
  return rest.delete(Routes.guildBan(guildId, userId), { reason }) as Promise<void>;
}

export function getGuildPreview(guildId: Snowflake): Promise<APIGuildPreview> {
  return rest.get(Routes.guildPreview(guildId)) as Promise<APIGuildPreview>;
}

export function getGuildChannels(guildId: Snowflake): Promise<APIGuildChannel[]> {
  return rest.get(Routes.guildChannels(guildId)) as Promise<APIGuildChannel[]>;
}

export function getGuildWidget(guildId: Snowflake): Promise<APIGuildWidget> {
  return rest.get(Routes.guildWidgetJSON(guildId)) as Promise<APIGuildWidget>;
}

export function getChannel(channelId: Snowflake): Promise<APIChannel> {
  return rest.get(Routes.channel(channelId)) as Promise<APIChannel>;
}

export function getChannelWebhooks(channelId: Snowflake): Promise<APIWebhook[]> {
  return rest.get(Routes.channelWebhooks(channelId)) as Promise<APIWebhook[]>;
}

export function createWebhook(
  channelId: Snowflake,
  body: RESTPostAPIChannelWebhookJSONBody
): Promise<APIWebhook> {
  return rest.post(Routes.channelWebhooks(channelId), { body }) as Promise<APIWebhook>;
}

export function getWebhook(webhookId: Snowflake): Promise<APIWebhook> {
  return rest.get(Routes.webhook(webhookId)) as Promise<APIWebhook>;
}

export function getWebhookWithToken(webhookId: Snowflake, webhookToken: string): Promise<APIWebhook> {
  return rest.get(Routes.webhook(webhookId, webhookToken), { auth: false }) as Promise<APIWebhook>;
}

export function executeWebhook(
  webhookId: Snowflake,
  webhookToken: string,
  body: RESTPostAPIWebhookWithTokenJSONBody,
  wait: true
): Promise<APIMessage>;
export function executeWebhook(
  webhookId: Snowflake,
  webhookToken: string,
  body: RESTPostAPIWebhookWithTokenJSONBody,
  wait?: false
): Promise<undefined>;
export function executeWebhook(
  webhookId: Snowflake,
  webhookToken: string,
  body: RESTPostAPIWebhookWithTokenJSONBody,
  wait?: boolean
): Promise<APIMessage | undefined> {
  return rest.post(Routes.webhook(webhookId, webhookToken), {
    auth: false,
    body,
    query: wait === undefined ? undefined : makeURLSearchParams({ wait })
  }) as Promise<APIMessage | undefined>;
}

export function deleteWebhookWithToken(webhookId: Snowflake, webhookToken: string): Promise<void> {
  return rest.delete(Routes.webhook(webhookId, webhookToken), { auth: false }) as Promise<void>;
}

export function getInvite(code: string, query?: RESTGetAPIInviteQuery): Promise<APIInvite> {
  return rest.get(Routes.invite(code), { query: query && makeURLSearchParams(query) }) as Promise<APIInvite>;
}
