const fs = require("fs");
const { resolvePath } = require("../../../../pathHelper"); // Importing resolvePath from pathHelper.js
const { logError, logInfo } = require(resolvePath("logger.js")); // Adjusted to import logger
const checkPermissions = require(resolvePath(
  "chatBot/modules/handlers/permissionHandler"
)); // Adjusted path for permission handler

module.exports = {
  name: "quote",
  description: "Retrieves a quote.",
  aliases: ["!quote", "!randomquote"],
  category: "Fun",

  /**
   * Executes the quote command.
   *
   * @param {object} client - The Twitch client instance.
   * @param {string} channel - The channel where the message was sent.
   * @param {object} tags - The user tags associated with the message.
   * @param {string} args - The command arguments.
   */
  execute(client, channel, tags, args) {
    logInfo(
      resolvePath("chatBot/logs"),
      `Quote command called by ${tags.username}.`
    );

    // Check if the user has the required permissions (Viewers have access by default)
    if (!checkPermissions(tags, "viewer")) {
      client.say(
        channel,
        `@${tags.username}, you do not have permission to use this command. 🚫`
      );
      logError(
        resolvePath("chatBot/logs"),
        `User ${tags.username} tried to use !quote without permission. ❌`
      );
      return;
    }

    const quoteNumber = args.length ? parseInt(args[0], 10) - 1 : null;

    fs.readFile(
      resolvePath("dataStorage/quotes.json"), // Adjusted path for quotes file
      "utf8",
      (err, data) => {
        if (err) {
          logError(
            resolvePath("chatBot/logs"),
            `Error reading quotes file: ${err.message} ❌`
          );
          client.say(
            channel,
            `@${tags.username}, there was an error retrieving the quote. ❌`
          );
          return;
        }
        const quotes = JSON.parse(data).quotes;

        if (quoteNumber !== null) {
          if (quoteNumber >= 0 && quoteNumber < quotes.length) {
            const quote = quotes[quoteNumber];
            client.say(channel, `Quote #${quoteNumber + 1}: ${quote}`);
            logInfo(
              resolvePath("chatBot/logs"),
              `Retrieved Quote #${quoteNumber + 1}: ${quote}`
            );
          } else {
            client.say(
              channel,
              `@${tags.username}, that quote number doesn't exist. ❌`
            );
            logInfo(
              resolvePath("chatBot/logs"),
              `Requested Quote #${quoteNumber + 1} by ${
                tags.username
              } does not exist.`
            );
          }
        } else {
          const randomIndex = Math.floor(Math.random() * quotes.length);
          const randomQuote = quotes[randomIndex];
          client.say(
            channel,
            `Random Quote #${randomIndex + 1}: ${randomQuote}`
          );
          logInfo(
            resolvePath("chatBot/logs"),
            `Retrieved Random Quote #${randomIndex + 1}: ${randomQuote}`
          );
        }
      }
    );
  },
};
