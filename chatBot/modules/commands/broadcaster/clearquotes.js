const fs = require("fs");
const { resolvePath } = require("../../../../pathHelper"); // Importing resolvePath from pathHelper.js
const config = require(resolvePath("global.js")); // Import global configurations
const { logError, logInfo } = require(resolvePath("logger.js")); // Adjusted to import logger
const checkPermissions = require(resolvePath(
  "chatBot/modules/handlers/permissionHandler"
)); // Adjusted path for permission handler

module.exports = {
  name: "clearquotes",
  description: "Clears all quotes.",
  category: "Broadcaster",

  /**
   * Executes the clearquotes command.
   *
   * @param {object} client - The Twitch client instance.
   * @param {string} channel - The channel where the message was sent.
   * @param {object} tags - The user tags associated with the message.
   * @param {string} args - The command arguments.
   */
  async execute(client, channel, tags, args) {
    logInfo(
      resolvePath("chatBot/logs"),
      `Clearquotes command called by ${tags.username}.`
    );

    // Check if the user has the required permissions (Only the broadcaster has access)
    if (!checkPermissions(tags, "broadcaster")) {
      client.say(
        channel,
        `@${tags.username}, you don't have permission to use this command. 🚫`
      );
      logError(
        resolvePath("chatBot/logs"),
        `User ${tags.username} tried to use !clearquotes without permission. ❌`
      );
      return;
    }

    fs.writeFile(
      resolvePath("dataStorage/quotes.json"), // Adjusted path for quotes file
      JSON.stringify({ quotes: [] }, null, 2),
      (err) => {
        if (err) {
          logError(
            resolvePath("chatBot/logs"),
            `Error clearing quotes file: ${err.message} ❌`
          );
          client.say(
            channel,
            `@${tags.username}, there was an error clearing the quotes. ❌`
          );
          return;
        }
        client.say(channel, "All quotes have been cleared. 📝");
        logInfo(
          resolvePath("chatBot/logs"),
          `All quotes cleared by ${tags.username}.`
        );
      }
    );
  },
};
