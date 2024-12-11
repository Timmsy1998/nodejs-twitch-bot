const fs = require("fs");
const { resolvePath } = require("../../../../pathHelper"); // Importing resolvePath from pathHelper.js
const config = require(resolvePath("global.js")); // Adjusted to import global configurations
const { logError, logInfo } = require(resolvePath("logger.js")); // Adjusted to import logger
const checkPermissions = require(resolvePath(
  "chatBot/modules/handlers/permissionHandler"
)); // Adjusted path for permission handler
const handleCooldowns = require(resolvePath(
  "chatBot/modules/handlers/cooldownHandler"
)); // Adjusted path for cooldown handler

const COOLDOWN_TIME = 5000; // 5 seconds cooldown

const responsesFilePath = resolvePath("dataStorage/8ballResponses.json");

const getResponsesFromFile = () => {
  if (fs.existsSync(responsesFilePath)) {
    const data = fs.readFileSync(responsesFilePath, "utf8");
    const responsesData = JSON.parse(data);
    return responsesData.responses;
  }
  return [];
};

module.exports = {
  name: "8ball",
  description: "Ask the Magic 8 Ball a question.",
  category: "Fun",
  aliases: ["!8ball"],

  /**
   * Executes the 8ball command.
   *
   * @param {object} client - The Twitch client instance.
   * @param {string} channel - The channel where the message was sent.
   * @param {object} tags - The user tags associated with the message.
   * @param {string} args - The command arguments.
   */
  async execute(client, channel, tags, args) {
    logInfo(
      resolvePath("chatBot/logs"),
      `8ball command called by ${tags.username}.`
    );

    // Check if the user has the required permissions (Viewers have access by default)
    if (!checkPermissions(tags, "viewer")) {
      client.say(
        channel,
        `@${tags.username}, you do not have permission to use this command. 🚫`
      );
      logError(
        resolvePath("chatBot/logs"),
        `User ${tags.username} tried to use !8ball without permission. ❌`
      );
      return;
    }

    // Check if the command is on cooldown for the user
    if (
      handleCooldowns(client, channel, this.name, tags.username, COOLDOWN_TIME)
    ) {
      return; // Exit if the command is on cooldown
    }

    try {
      const question = args.trim();
      if (!question) {
        client.say(channel, `@${tags.username}, please ask a question. ❓`);
        return;
      }

      const responses = getResponsesFromFile();
      if (responses.length === 0) {
        client.say(
          channel,
          `@${tags.username}, there are no responses available at the moment. ❌`
        );
        logError(
          resolvePath("chatBot/logs"),
          "No responses available in 8ballResponses.json."
        );
        return;
      }

      const randomIndex = Math.floor(Math.random() * responses.length);
      const answer = responses[randomIndex];
      logInfo(resolvePath("chatBot/logs"), `8ball answer: ${answer}`);

      client.say(
        channel,
        `@${tags.username}, the Magic 8 Ball says: ${answer} 🎱`
      );
    } catch (error) {
      logError(
        resolvePath("chatBot/logs"),
        `Error fetching 8ball answer: ${error.message} ❌`
      );
      client.say(
        channel,
        `@${tags.username}, there was an error getting the Magic 8 Ball response. ❌`
      );
    }
  },
};
