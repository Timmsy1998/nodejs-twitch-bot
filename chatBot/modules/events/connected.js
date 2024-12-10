const { logInfo, logError } = require("../../../logger.js"); // Adjusted path for logger
const config = require("../../../global.js"); // Import global configuration
const client = require("../../main"); // Adjusted path for client import

module.exports = (addr, port) => {
  try {
    console.log(`* Connected to ${addr}:${port} 🚀`);
    logInfo("chatBot/logs", `Successfully connected to ${addr}:${port} 🚀`); // Logging connection

    // Send a message to the chat when the bot comes online
    client.say(
      config.broadcasterUsername,
      "Hello chat! 🤖 The bot is now online and ready to assist you. 🚀✨"
    );
  } catch (error) {
    logError("chatBot/logs", `Error in connected handler: ${error.message} ❌`);
  }
};
