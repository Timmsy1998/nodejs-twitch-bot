const { resolvePath } = require("../../../pathHelper"); // Importing resolvePath from pathHelper.js
const { logInfo, logError } = require(resolvePath("logger.js")); // Adjusted path for logger

/**
 * Handles command aliases.
 *
 * @param {object} client - The Twitch client instance.
 * @param {string} commandName - The command name received from the message.
 * @returns {object|null} - The resolved command or null if no alias is found.
 */
const handleAliases = (client, commandName) => {
  try {
    for (const [name, command] of client.commands) {
      if (
        command.name === commandName ||
        (command.aliases && command.aliases.includes(commandName))
      ) {
        logInfo(
          resolvePath("chatBot/logs"),
          `Resolved command alias: ${commandName} -> ${command.name}`
        );
        return command;
      }
    }

    logInfo(
      resolvePath("chatBot/logs"),
      `No command found for alias: ${commandName}`
    );
    return null;
  } catch (error) {
    logError(
      resolvePath("chatBot/logs"),
      `Error handling alias for command ${commandName}: ${error.message} ❌`
    );
    return null;
  }
};

module.exports = handleAliases;
