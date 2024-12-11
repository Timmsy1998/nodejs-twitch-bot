const fs = require("fs");
const { resolvePath } = require("../../../../pathHelper"); // Importing resolvePath from pathHelper.js
const config = require(resolvePath("global.js")); // Adjusted to import global configurations
const { logError, logInfo } = require(resolvePath("logger.js")); // Adjusted to import logger
const checkPermissions = require(resolvePath(
  "chatBot/modules/handlers/permissionHandler"
)); // Adjusted path for permission handler
const { getCurrentGame } = require(resolvePath(
  "chatBot/modules/api/twitchAPIwrapper"
)); // Adjusted path for Twitch API

module.exports = {
  name: "addquote",
  description: "Adds a new quote.",
  category: "Fun",

  /**
   * Executes the addquote command.
   *
   * @param {object} client - The Twitch client instance.
   * @param {string} channel - The channel where the message was sent.
   * @param {object} tags - The user tags associated with the message.
   * @param {string} args - The command arguments.
   */
  async execute(client, channel, tags, args) {
    logInfo(
      resolvePath("chatBot/logs"),
      `Addquote command called by ${tags.username}.`
    );

    // Check if the user has the required permissions (Viewers have access by default)
    if (!checkPermissions(tags, "viewer")) {
      client.say(
        channel,
        `@${tags.username}, you don't have permission to use this command. 🚫`
      );
      logError(
        resolvePath("chatBot/logs"),
        `User ${tags.username} tried to use !addquote without permission. ❌`
      );
      return;
    }

    try {
      if (!args || typeof args !== "string") {
        logError(
          resolvePath("chatBot/logs"),
          "Invalid args: expected a string. ❌"
        );
        client.say(
          channel,
          `@${tags.username}, there was an error with the quote format. ❌`
        );
        return;
      }

      const quote = args.trim();
      if (!quote) {
        client.say(channel, `@${tags.username}, please provide a quote. 📝`);
        return;
      }

      const date = new Date().toLocaleDateString();
      const game = await getCurrentGame();
      if (!game) {
        client.say(
          channel,
          `@${tags.username}, could not retrieve current game. 🎮❌`
        );
        return;
      }

      const quoteEntry = `"${quote}" - 'Timmsy' | (${game}) (${date})`;
      const filePath = resolvePath("dataStorage/quotes.json"); // Adjusted path for quotes file

      logInfo(
        resolvePath("chatBot/logs"),
        `Attempting to add quote: ${quoteEntry}`
      );

      fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
          logError(
            resolvePath("chatBot/logs"),
            `Error reading quotes file: ${err.message} ❌`
          );
          client.say(
            channel,
            `@${tags.username}, there was an error reading the quotes file. ❌`
          );
          return;
        }

        let quotes;
        try {
          quotes = JSON.parse(data);
        } catch (parseError) {
          logError(
            resolvePath("chatBot/logs"),
            `Error parsing quotes file: ${parseError.message} ❌`
          );
          client.say(
            channel,
            `@${tags.username}, there was an error parsing the quotes file. ❌`
          );
          return;
        }

        quotes.quotes.push(quoteEntry);
        const quoteNumber = quotes.quotes.length; // Get the quote number

        fs.writeFile(filePath, JSON.stringify(quotes, null, 2), (writeErr) => {
          if (writeErr) {
            logError(
              resolvePath("chatBot/logs"),
              `Error writing to quotes file: ${writeErr.message} ❌`
            );
            client.say(
              channel,
              `@${tags.username}, there was an error adding the quote. ❌`
            );
            return;
          }
          client.say(channel, `Quote #${quoteNumber} added: ${quoteEntry}`);
          logInfo(
            resolvePath("chatBot/logs"),
            `Quote #${quoteNumber} added by ${tags.username}: ${quoteEntry}`
          );
        });
      });
    } catch (error) {
      logError(
        resolvePath("chatBot/logs"),
        `Unexpected error: ${error.message} ❌`
      );
      client.say(
        channel,
        `@${tags.username}, there was an unexpected error adding the quote. ❌`
      );
    }
  },
};
