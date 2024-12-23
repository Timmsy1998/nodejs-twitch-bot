const axios = require("axios");
const { resolvePath } = require("../../../../pathHelper"); // Importing resolvePath from pathHelper.js
const config = require(resolvePath("global.js")); // Import global configurations
const { logError, logInfo } = require(resolvePath("logger.js")); // Import logger
const updateChannelInfo = require(resolvePath(
  "chatBot/modules/api/twitchAPIwrapper"
)).updateChannelInfo; // Adjusted path for Twitch API
const checkPermissions = require(resolvePath(
  "chatBot/modules/handlers/permissionHandler"
)); // Import permission handler
const handleCooldowns = require(resolvePath(
  "chatBot/modules/handlers/cooldownHandler"
)); // Import cooldown handler

const COOLDOWN_TIME = 30000; // 30 seconds cooldown

module.exports = {
  name: "settitle",
  description: "Updates the stream title.",
  aliases: ["!settitle"],
  keywords: ["set title", "change title"],
  category: "Moderation",

  /**
   * Executes the settitle command.
   *
   * @param {object} client - The Twitch client instance.
   * @param {string} channel - The channel where the message was sent.
   * @param {object} tags - The user tags associated with the message.
   * @param {string} args - The command arguments.
   */
  async execute(client, channel, tags, args) {
    logInfo(
      resolvePath("chatBot/logs"),
      `Settitle command called by ${tags.username}.`
    );

    // Check if the user has the required permissions (Moderators have access)
    if (!checkPermissions(tags, "moderator")) {
      client.say(
        channel,
        `@${tags.username}, you don't have permission to use this command. 🚫`
      );
      logError(
        resolvePath("chatBot/logs"),
        `User ${tags.username} tried to use !settitle without permission. ❌`
      );
      return;
    }

    // Check if the command is on cooldown for the user
    if (
      handleCooldowns(client, channel, this.name, tags.username, COOLDOWN_TIME)
    ) {
      return; // Exit if the command is on cooldown
    }

    const title = args.join(" ");
    try {
      // Update the stream title using the Twitch API
      await updateChannelInfo({ title });
      client.say(
        channel,
        `@${tags.username}, the stream title has been updated to: ${title} 🎉`
      );
      logInfo(
        resolvePath("chatBot/logs"),
        `Stream title updated by ${tags.username} to: ${title}`
      );
    } catch (error) {
      logError(
        resolvePath("chatBot/logs"),
        `Error updating title: ${error.message} ❌`
      ); // Log error to file
      client.say(
        channel,
        `@${tags.username}, there was an error updating the title. ❌`
      );
    }
  },
};
