const { resolvePath } = require("../../../pathHelper"); // Importing resolvePath from pathHelper.js
const { logInfo, logError } = require(resolvePath("logger.js")); // Adjusted path for logger

/**
 * Handles keyword detection and triggers commands.
 *
 * @param {object} client - The Twitch client instance.
 * @param {string} channel - The channel where the message was sent.
 * @param {object} tags - The user tags associated with the message.
 * @param {string} message - The message content.
 * @returns {object|null} - The resolved command or null if no keyword is found.
 */
const handleKeywords = (client, channel, tags, message) => {
  try {
    const lowerCaseMessage = message.toLowerCase();

    for (const [commandName, command] of client.commands) {
      if (command.keywords) {
        for (const keyword of command.keywords) {
          if (lowerCaseMessage.includes(keyword.toLowerCase())) {
            logInfo(
              resolvePath("chatBot/logs"),
              `Keyword detected: ${keyword} in message: ${message}`
            );
            return command;
          }
        }
      }
    }

    logInfo(
      resolvePath("chatBot/logs"),
      `No keywords found in message: ${message}`
    );
    return null;
  } catch (error) {
    logError(
      resolvePath("chatBot/logs"),
      `Error handling keywords in message ${message}: ${error.message} ❌`
    );
    return null;
  }
};

module.exports = handleKeywords;
