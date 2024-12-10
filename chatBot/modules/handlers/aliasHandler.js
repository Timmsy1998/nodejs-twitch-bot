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
    // Example alias map for demonstration purposes
    const aliasMap = {
      greet: "hello",
      bye: "goodbye",
      info: "information",
      // Add more aliases as needed
    };

    // Check if the commandName is an alias and resolve it to the actual command
    const resolvedCommandName = aliasMap[commandName] || commandName;
    logInfo(
      resolvePath("chatBot/logs"),
      `Resolved command alias: ${commandName} -> ${resolvedCommandName}`
    );

    // Check if the resolved command exists in the client's commands collection
    if (client.commands.has(resolvedCommandName)) {
      return client.commands.get(resolvedCommandName);
    } else {
      logInfo(
        resolvePath("chatBot/logs"),
        `No command found for alias: ${commandName}`
      );
      return null;
    }
  } catch (error) {
    logError(
      resolvePath("chatBot/logs"),
      `Error handling alias for command ${commandName}: ${error.message} ❌`
    );
    return null;
  }
};

module.exports = handleAliases;
