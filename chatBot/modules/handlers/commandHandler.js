// Importing required logging functions
const { logInfo, logError } = require("../../../logger.js");

/**
 * Handles command execution.
 *
 * @param {object} client - The Twitch client instance.
 * @param {string} channel - The channel where the message was sent.
 * @param {object} tags - The user tags associated with the message.
 * @param {string} message - The message content.
 */
const handleCommand = (client, channel, tags, message) => {
  try {
    // Check if the message is a command
    if (!message.startsWith("!")) return;

    // Extract command and arguments from the message
    const args = message.slice(1).split(" ");
    const commandName = args.shift().toLowerCase();

    logInfo(
      "chatBot/logs",
      `Received message: ${message} from ${tags.username} 💬`
    );
    logInfo(
      "chatBot/logs",
      `Processing command: ${commandName} with arguments: ${args.join(" ")} 🔄`
    );

    // Attempt to find the command in the client's commands collection
    let command = client.commands.get(commandName);

    if (command) {
      logInfo("chatBot/logs", `Executing command: ${command.name} 🛠️`);
      // Execute the command and handle any errors
      command.execute(client, channel, tags, args.join(" ")).catch((error) => {
        logError(
          "chatBot/logs",
          `Error executing command ${command.name}: ${error.message} ❌`
        );
      });
    } else {
      logInfo(
        "chatBot/logs",
        `No direct command found for: ${commandName}. 🔍`
      );
      // If no command is found, log a message
    }
  } catch (error) {
    logError("chatBot/logs", `Error processing command: ${error.message} ❌`);
  }
};

module.exports = handleCommand;
