const { resolvePath } = require("../../../../pathHelper"); // Importing resolvePath from pathHelper.js
const { logError, logInfo } = require(resolvePath("logger.js")); // Adjusted to import logger
const checkPermissions = require(resolvePath(
  "chatBot/modules/handlers/permissionHandler"
)); // Adjusted path for permission handler
const handleCooldowns = require(resolvePath(
  "chatBot/modules/handlers/cooldownHandler"
)); // Adjusted path for cooldown handler

const COOLDOWN_TIME = 5000; // 5 seconds cooldown

module.exports = {
  name: "discord",
  description: "Sends the Discord invite link.",
  aliases: ["!discord", "!join"],
  category: "General",

  /**
   * Executes the discord command.
   *
   * @param {object} client - The Twitch client instance.
   * @param {string} channel - The channel where the message was sent.
   * @param {object} tags - The user tags associated with the message.
   * @param {string} args - The command arguments.
   */
  async execute(client, channel, tags, args) {
    logInfo(
      resolvePath("chatBot/logs"),
      `Discord command called by ${tags.username}.`
    );

    // Check if the user has the required permissions (Viewers have access by default)
    if (!checkPermissions(tags, "viewer")) {
      client.say(
        channel,
        `@${tags.username}, you do not have permission to use this command. 🚫`
      );
      logError(
        resolvePath("chatBot/logs"),
        `User ${tags.username} tried to use !discord without permission. ❌`
      );
      return;
    }

    // Check if the command is on cooldown for the user
    if (
      handleCooldowns(client, channel, this.name, tags.username, COOLDOWN_TIME)
    ) {
      return; // Exit if the command is on cooldown
    }

    try {
      const message = "Join The Gathering Today: https://discord.gg/24wA6Hy2mc";
      client.say(channel, message);
      logInfo(
        resolvePath("chatBot/logs"),
        `Sent Discord invite link in response to ${tags.username}.`
      );
    } catch (error) {
      logError(
        resolvePath("chatBot/logs"),
        `Error sending Discord invite link: ${error.message} ❌`
      );
      client.say(
        channel,
        `@${tags.username}, there was an error sending the Discord invite link. ❌`
      );
    }
  },
};
