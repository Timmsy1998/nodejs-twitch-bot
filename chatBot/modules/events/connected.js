const { resolvePath } = require("../../../pathHelper"); // Importing resolvePath from pathHelper.js
const { logInfo, logError } = require(resolvePath("logger.js")); // Adjusted path for logger
const config = require(resolvePath("global.js")); // Import global configuration
const client = require(resolvePath("chatBot/main")); // Adjusted path for client import

module.exports = (addr, port) => {
  try {
    console.log(`* Connected to ${addr}:${port} 🚀`);
    logInfo(
      resolvePath("chatBot/logs"),
      `Successfully connected to ${addr}:${port} 🚀`
    ); // Logging connection

    // Send a message to the chat when the bot comes online
    client.say(
      config.BROADCASTER_USERNAME,
      "Hello chat! 🤖 The bot is now online and ready to assist you. 🚀✨"
    );
  } catch (error) {
    logError(
      resolvePath("chatBot/logs"),
      `Error in connected handler: ${error.message} ❌`
    );
  }
};
