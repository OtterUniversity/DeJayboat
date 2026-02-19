export const UserFlags = {
  /**
   * Discord Staff
   *
   * Value: 1 << 0
   * Public: Yes
   */
  STAFF: 1n << 0n,
  /**
   * Partnered Server Owner
   *
   * Public: Yes
   */
  PARTNER: 1n << 1n,
  /**
   * HypeSquad Events
   *
   * Public: Yes
   */
  HYPESQUAD: 1n << 2n,
  /**
   * Level 1 Discord Bug Hunter
   *
   * Public: Yes
   */
  BUG_HUNTER_LEVEL_1: 1n << 3n,
  /**
   * SMS enabled as a multi-factor authentication backup
   *
   * Public: No
   */
  MFA_SMS: 1n << 4n,
  /**
   * User has dismissed the current premium (Nitro) promotion
   *
   * Public: No
   */
  PREMIUM_PROMO_DISMISSED: 1n << 5n,
  /**
   * HypeSquad Bravery
   *
   * Public: Yes
   */
  HYPESQUAD_ONLINE_HOUSE_1: 1n << 6n,
  /**
   * HypeSquad Brilliance
   *
   * Public: Yes
   */
  HYPESQUAD_ONLINE_HOUSE_2: 1n << 7n,
  /**
   * HypeSquad Balance
   *
   * Public: Yes
   */
  HYPESQUAD_ONLINE_HOUSE_3: 1n << 8n,
  /**
   * Early Premium (Nitro) Supporter
   *
   * Public: Yes
   */
  PREMIUM_EARLY_SUPPORTER: 1n << 9n,
  /**
   * User is a Team
   *
   * Public: Yes
   */
  TEAM_PSEUDO_USER: 1n << 10n,
  /**
   * User is registered on Discord's HubSpot customer platform, used for official Discord programs (e.g. partner)
   *
   * Public: No 1
   */
  IS_HUBSPOT_CONTACT: 1n << 11n,
  /**
   * User has unread urgent system messages; an urgent message is one sent from Trust and Safety
   *
   * Public: No
   */
  HAS_UNREAD_URGENT_MESSAGES: 1n << 13n,
  /**
   * Level 2 Discord Bug Hunter
   *
   * Public: Yes
   */
  BUG_HUNTER_LEVEL_2: 1n << 14n,
  /**
   * User is scheduled for deletion for being under the minimum required age
   *
   * Public: No 1
   */
  UNDERAGE_DELETED: 1n << 15n,
  /**
   * Verified Bot
   *
   * Public: Yes
   */
  VERIFIED_BOT: 1n << 16n,
  /**
   * Early Verified Bot Developer
   *
   * Public: Yes
   */
  VERIFIED_DEVELOPER: 1n << 17n,
  /**
   * Moderator Programs Alumni
   *
   * Public: Yes
   */
  CERTIFIED_MODERATOR: 1n << 18n,
  /**
   * Bot uses only HTTP interactions and is shown in the online member list
   *
   * Public: Yes
   */
  BOT_HTTP_INTERACTIONS: 1n << 19n,
  /**
   * User is marked as a spammer and has their messages collapsed in the UI
   *
   * Public: Yes
   */
  SPAMMER: 1n << 20n,
  /**
   * User is a provisional account used with the social layer integration
   *
   * Public: Yes
   */
  PROVISIONAL_ACCOUNT: 1n << 23n,
  /**
   * User has their global ratelimit raised to 1,200 requests per second
   *
   * Public: No 1
   */
  HIGH_GLOBAL_RATE_LIMIT: 1n << 33n,
  /**
   * User's account is deleted
   *
   * Public: No 1
   */
  DELETED: 1n << 34n,
  /**
   * User's account is disabled for suspicious activity and must reset their password to regain access
   *
   * Public: No 1
   */
  DISABLED_SUSPICIOUS_ACTIVITY: 1n << 35n,
  /**
   * User deleted their own account
   *
   * Public: No 1
   */
  SELF_DELETED: 1n << 36n,
  /**
   * User has a premium (Nitro) custom discriminator
   *
   * Public: No 1
   */
  PREMIUM_DISCRIMINATOR: 1n << 37n,
  /**
   * User has used the desktop client
   *
   * Public: No 1
   */
  USED_DESKTOP_CLIENT: 1n << 38n,
  /**
   * User has used the web client
   *
   * Public: No 1
   */
  USED_WEB_CLIENT: 1n << 39n,
  /**
   * User has used the mobile client
   *
   * Public: No 1
   */
  USED_MOBILE_CLIENT: 1n << 40n,
  /**
   * User's account is disabled
   *
   * Public: No 1
   */
  DISABLED: 1n << 41n,
  /**
   * User has started at least one Gateway session and is now eligible to send messages
   *
   * Public: No 1
   */
  HAS_SESSION_STARTED: 1n << 43n,
  /**
   * User is quarantined and cannot create DMs or accept invites
   *
   * Public: No
   */
  QUARANTINED: 1n << 44n,
  /**
   * User is eligible for early access to unique usernames
   *
   * Public: No 1
   */
  PREMIUM_ELIGIBLE_FOR_UNIQUE_USERNAME: 1n << 47n,
  /**
   * User is a collaborator and is considered staff
   *
   * Public: No
   */
  COLLABORATOR: 1n << 50n,
  /**
   * User is a restricted collaborator and is considered staff
   *
   * Public: No
   */
  RESTRICTED_COLLABORATOR: 1n << 51n
} as const;

import { Context } from "../../util";

export const open = true;
export const name = "flags";
export default async function ({ message, api, ws, args }: Context) {
  let user = message.author;
  if (args[0]) {
    const userId = args[0];
    if (!userId || !/^\d+$/.test(userId)) return api.createMessage(message.channel_id, { content: "Invalid user" });

    try {
      user = await api.getUser(userId);
    } catch {
      return api.createMessage(message.channel_id, { content: "Invalid user" });
    }
  }

  const n = BigInt(user.public_flags);
  const flags = Object.entries(UserFlags)
    .filter(([k, v]) => (n & v) === v)
    .map(([k, v]) => k);

  await api.createMessage(message.channel_id, {
    content: flags.join("\n")
  });
}
