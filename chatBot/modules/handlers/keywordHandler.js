// Importing required logging functions
const { logInfo, logError } = require("../../../logger.js");

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
    // Example keyword map for demonstration purposes
    const keywordMap = {
      hello: "hello", // Keyword "hello" triggers "hello" command
      help: "help", // Keyword "help" triggers "help" command
      bot: "info", // Keyword "bot" triggers "info" command
      // Add more keywords and associated commands as needed
    };

    // Loop through keywords and check if any are present in the message
    for (const [keyword, commandName] of Object.entries(keywordMap)) {
      if (message.toLowerCase().includes(keyword.toLowerCase())) {
        logInfo(
          "chatBot/logs",
          `Keyword detected: ${keyword} in message: ${message}`
        );
        if (client.commands.has(commandName)) {
          return client.commands.get(commandName);
        } else {
          logInfo("chatBot/logs", `No command found for keyword: ${keyword}`);
        }
      }
    }

    logInfo("chatBot/logs", `No keywords found in message: ${message}`);
    return null;
  } catch (error) {
    logError(
      "chatBot/logs",
      `Error handling keywords in message ${message}: ${error.message} ❌`
    );
    return null;
  }
};

module.exports = handleKeywords;
