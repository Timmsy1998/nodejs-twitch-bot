const fs = require("fs");
const { resolvePath } = require("../../../../pathHelper"); // Importing resolvePath from pathHelper.js
const { logError, logInfo } = require(resolvePath("logger.js")); // Adjusted to import logger
const checkPermissions = require(resolvePath(
  "chatBot/modules/handlers/permissionHandler"
)); // Adjusted path for permission handler
const handleCooldowns = require(resolvePath(
  "chatBot/modules/handlers/cooldownHandler"
)); // Adjusted path for cooldown handler

const COOLDOWN_TIME = 5000; // 5 seconds cooldown

const jokesFilePath = resolvePath("dataStorage/jokes.json");

const getJokesFromFile = () => {
  if (fs.existsSync(jokesFilePath)) {
    const data = fs.readFileSync(jokesFilePath, "utf8");
    const jokesData = JSON.parse(data);
    return jokesData.jokes;
  }
  return [];
};

module.exports = {
  name: "joke",
  description: "Get a random joke.",
  category: "Fun",
  aliases: ["!joke", "!jotd"],

  /**
   * Executes the joke command.
   *
   * @param {object} client - The Twitch client instance.
   * @param {string} channel - The channel where the message was sent.
   * @param {object} tags - The user tags associated with the message.
   * @param {string} args - The command arguments.
   */
  async execute(client, channel, tags, args) {
    logInfo(
      resolvePath("chatBot/logs"),
      `Joke command called by ${tags.username}.`
    );

    // Check if the user has the required permissions (Viewers have access by default)
    if (!checkPermissions(tags, "viewer")) {
      client.say(
        channel,
        `@${tags.username}, you do not have permission to use this command. 🚫`
      );
      logError(
        resolvePath("chatBot/logs"),
        `User ${tags.username} tried to use !joke without permission. ❌`
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
      const jokes = getJokesFromFile();
      if (jokes.length === 0) {
        client.say(
          channel,
          `@${tags.username}, there are no jokes available at the moment. ❌`
        );
        logError(
          resolvePath("chatBot/logs"),
          "No jokes available in jokes.json."
        );
        return;
      }

      // Get a random joke
      const randomIndex = Math.floor(Math.random() * jokes.length);
      const joke = jokes[randomIndex];
      logInfo(resolvePath("chatBot/logs"), `Joke: ${joke}`);

      client.say(channel, `@${tags.username}, here's your joke: ${joke} 😂`);
    } catch (error) {
      logError(
        resolvePath("chatBot/logs"),
        `Error fetching joke: ${error.message} ❌`
      );
      client.say(
        channel,
        `@${tags.username}, there was an error getting the joke. ❌`
      );
    }
  },
};
