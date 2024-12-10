const { resolvePath } = require("../../../pathHelper"); // Importing resolvePath from pathHelper.js
const { logInfo, logError } = require(resolvePath("logger.js")); // Adjusted path for logger
const handleCommand = require(resolvePath(
  "chatBot/modules/handlers/commandHandler"
)); // Importing command handler
const handleAliases = require(resolvePath(
  "chatBot/modules/handlers/aliasHandler"
)); // Importing alias handler
const handleKeywords = require(resolvePath(
  "chatBot/modules/handlers/keywordHandler"
)); // Importing keyword handler

module.exports = (client) => (channel, tags, message, self) => {
  if (self) return;

  try {
    // Welcome first-time chatters
    if (tags["first-msg"]) {
      client.say(
        channel,
        `Welcome ${tags["display-name"]}! 🎉 Thanks for joining us!`
      );
    }

    logInfo(
      resolvePath("chatBot/logs"),
      `Received message: ${message} from ${tags.username} 💬`
    );

    // Extract command and arguments from the message
    const args = message.slice(1).split(" ");
    const commandName = args.shift().toLowerCase();
    logInfo(
      resolvePath("chatBot/logs"),
      `Processing command: ${commandName} with arguments: ${args.join(" ")} 🔄`
    );

    // Handle aliases, keywords, and commands
    const command =
      handleAliases(client, commandName) ||
      client.commands.get(commandName) ||
      handleKeywords(client, channel, tags, message);

    if (command) {
      logInfo(
        resolvePath("chatBot/logs"),
        `Executing command: ${command.name} 🛠️`
      );
      command.execute(client, channel, tags, args.join(" ")).catch((error) => {
        logError(
          resolvePath("chatBot/logs"),
          `Error executing command ${command.name}: ${error.message} ❌`
        );
      });
    } else {
      logInfo(
        resolvePath("chatBot/logs"),
        `No direct command, alias, or keyword found for: ${commandName}. 🔍`
      );
    }
  } catch (error) {
    logError(
      resolvePath("chatBot/logs"),
      `Error processing message: ${error.message} ❌`
    );
  }
};
