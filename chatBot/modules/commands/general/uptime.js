const axios = require("axios");
const { resolvePath } = require("../../../../pathHelper"); // Importing resolvePath from pathHelper.js
const config = require(resolvePath("global.js")); // Import global configurations
const { logError, logInfo } = require(resolvePath("logger.js")); // Adjusted to import logger
const checkPermissions = require(resolvePath(
  "chatBot/modules/handlers/permissionHandler"
)); // Adjusted path for permission handler

module.exports = {
  name: "uptime",
  description: "Displays how long the stream has been live.",
  aliases: ["!uptime", "!streamtime"],
  keywords: ["uptime", "how long have you been live"],
  category: "General",
  modOnly: false,
  broadcasterOnly: false,

  /**
   * Executes the uptime command.
   *
   * @param {object} client - The Twitch client instance.
   * @param {string} channel - The channel where the message was sent.
   * @param {object} tags - The user tags associated with the message.
   * @param {string} args - The command arguments.
   */
  async execute(client, channel, tags, args) {
    logInfo(
      resolvePath("chatBot/logs"),
      `Uptime command called by ${tags.username}.`
    );

    // Check if the user has the required permissions (Viewers have access by default)
    if (!checkPermissions(tags, "viewer")) {
      client.say(
        channel,
        `@${tags.username}, you don't have permission to use this command. 🚫`
      );
      logError(
        resolvePath("chatBot/logs"),
        `User ${tags.username} tried to use !uptime without permission. ❌`
      );
      return;
    }

    try {
      // Fetch the stream information from the Twitch API
      const response = await axios.get(
        `https://api.twitch.tv/helix/streams?user_id=${config.BROADCASTER_ID}`,
        {
          headers: {
            "Client-ID": config.CLIENT_ID,
            Authorization: `Bearer ${config.BROADCASTER_TOKEN}`,
          },
        }
      );

      if (response.data.data.length > 0) {
        const streamData = response.data.data[0];
        const startedAt = new Date(streamData.started_at);
        const now = new Date();
        const uptime = Math.floor((now - startedAt) / (1000 * 60)); // Uptime in minutes
        client.say(channel, `The stream has been live for ${uptime} minutes.`);
        logInfo(
          resolvePath("chatBot/logs"),
          `Uptime command executed by ${tags.username}: ${uptime} minutes`
        );
      } else {
        client.say(channel, "The stream is not live currently. 🚫");
        logInfo(
          resolvePath("chatBot/logs"),
          `Uptime command executed by ${tags.username}: Stream is not live`
        );
      }
    } catch (error) {
      logError(
        resolvePath("chatBot/logs"),
        `Error fetching stream uptime: ${
          error.response ? JSON.stringify(error.response.data) : error.message
        } ❌`
      );
      client.say(
        channel,
        `@${tags.username}, there was an error fetching the stream uptime. ❌`
      );
    }
  },

  /**
   * Trigger command for sentences containing specific keywords.
   *
   * @param {string} message - The message content.
   * @returns {boolean} - Whether the command should be triggered.
   */
  trigger(message) {
    const triggerKeywords = ["have you been live"];
    return triggerKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword)
    );
  },
};
