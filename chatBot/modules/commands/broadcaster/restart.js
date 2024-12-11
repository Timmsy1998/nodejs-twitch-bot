const axios = require("axios");
const { resolvePath } = require("../../../../pathHelper"); // Importing resolvePath from pathHelper.js
const config = require(resolvePath("global.js")); // Adjusted to import global configurations
const { logError, logInfo } = require(resolvePath("logger.js")); // Adjusted to import logger
const checkPermissions = require(resolvePath(
  "chatBot/modules/handlers/permissionHandler"
)); // Adjusted path for permission handler

module.exports = {
  name: "restart",
  description: "Restarts the bot.",
  category: "Broadcaster",

  /**
   * Executes the restart command.
   *
   * @param {object} client - The Twitch client instance.
   * @param {string} channel - The channel where the message was sent.
   * @param {object} tags - The user tags associated with the message.
   * @param {string} args - The command arguments.
   */
  async execute(client, channel, tags, args) {
    logInfo(
      resolvePath("chatBot/logs"),
      `Restart command called by ${tags.username}. 🚨`
    );

    // Check if the user has the required permissions (Only the broadcaster has access)
    if (!checkPermissions(tags, "broadcaster")) {
      client.say(
        channel,
        `🚫 @${tags.username}, you don't have permission to use this command.`
      );
      logError(
        resolvePath("chatBot/logs"),
        `User ${tags.username} tried to use !restart without permission. ❌`
      );
      return;
    }

    logInfo(
      resolvePath("chatBot/logs"),
      `Bot restart initiated by ${tags.username}. 🔄`
    );
    client.say(
      channel,
      `🔄 Restart initiated by @${tags.username}! Please hold on...`
    );

    // Adding a small delay before the next message to ensure it sends
    setTimeout(() => {
      logInfo(resolvePath("chatBot/logs"), "Bot is restarting... 🤖");
      client.say(channel, "🤖 Bot is restarting...");

      // Exit the process with a success code to trigger PM2 restart
      setTimeout(() => {
        process.exit(0);
      }, 2000); // Adding a slight delay to ensure logs are flushed
    }, 1000);
  },
};
