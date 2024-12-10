const fs = require("fs");
const { resolvePath } = require("../../../../pathHelper"); // Importing resolvePath from pathHelper.js
const config = require(resolvePath("global.js")); // Adjusted to import global configurations
const { logError, logInfo } = require(resolvePath("logger.js")); // Adjusted to import logger
const { checkPermissions } = require(resolvePath(
  "chatBot/modules/handlers/permissionHandler"
)); // Adjusted path for permission handler
const { handleCooldowns } = require(resolvePath(
  "chatBot/modules/handlers/cooldownHandler"
)); // Adjusted path for cooldown handler

const COOLDOWN_TIME = 30000; // 30 seconds cooldown

module.exports = {
  name: "delquote",
  description: "Deletes a quote by number.",
  category: "Moderation",
  modOnly: true,

  /**
   * Executes the delquote command.
   *
   * @param {object} client - The Twitch client instance.
   * @param {string} channel - The channel where the message was sent.
   * @param {object} tags - The user tags associated with the message.
   * @param {string} args - The command arguments.
   */
  async execute(client, channel, tags, args) {
    logInfo(`Delquote command called by ${tags.username}.`);

    // Check if the user has the required permissions (Only Moderators have access)
    if (!checkPermissions(tags, "moderator")) {
      client.say(
        channel,
        `@${tags.username}, you don't have permission to use this command. 🚫`
      );
      return;
    }

    // Check if the command is on cooldown for the user
    if (
      handleCooldowns(client, channel, this.name, tags.username, COOLDOWN_TIME)
    ) {
      return; // Exit if the command is on cooldown
    }

    const quoteNumber = parseInt(args[0], 10) - 1;

    fs.readFile(
      resolvePath("dataStorage/quotes.json"), // Adjusted path for quotes file
      "utf8",
      (err, data) => {
        if (err) {
          logError(`Error reading quotes file: ${err.message} ❌`);
          client.say(
            channel,
            `@${tags.username}, there was an error deleting the quote. ❌`
          );
          return;
        }
        const quotes = JSON.parse(data).quotes;

        if (quoteNumber >= 0 && quoteNumber < quotes.length) {
          const removedQuote = quotes.splice(quoteNumber, 1);
          fs.writeFile(
            resolvePath("dataStorage/quotes.json"), // Adjusted path for quotes file
            JSON.stringify({ quotes }, null, 2),
            (err) => {
              if (err) {
                logError(`Error writing to quotes file: ${err.message} ❌`);
                client.say(
                  channel,
                  `@${tags.username}, there was an error deleting the quote. ❌`
                );
                return;
              }
              client.say(
                channel,
                `Quote ${quoteNumber + 1} deleted: ${removedQuote}`
              );
              logInfo(`Quote deleted by ${tags.username}: ${removedQuote}`);
            }
          );
        } else {
          client.say(
            channel,
            `@${tags.username}, that quote number doesn't exist. ❌`
          );
        }
      }
    );
  },
};
