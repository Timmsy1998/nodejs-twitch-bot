const fs = require("fs");
const { resolvePath } = require("../../../../pathHelper"); // Importing resolvePath from pathHelper.js
const config = require(resolvePath("global.js")); // Import global configurations
const { logError, logInfo } = require(resolvePath("logger.js")); // Adjusted to import logger
const checkPermissions = require(resolvePath(
  "chatBot/modules/handlers/permissionHandler"
)); // Adjusted path for permission handler
const handleCooldowns = require(resolvePath(
  "chatBot/modules/handlers/cooldownHandler"
)); // Adjusted path for cooldown handler

const accountsFilePath = resolvePath("dataStorage/lolAccounts.json");

const COOLDOWN_TIME = 5000; // 5 seconds cooldown

const keywords = ["op.gg", "deeplol", "deep lol", "opgg"];

module.exports = {
  name: "deeplol",
  description: "Displays the Deeplol link of all accounts.",
  aliases: ["!deeplol", "!opgg"],
  keywords: keywords,
  category: "League of Legends",

  /**
   * Executes the deeplol command.
   *
   * @param {object} client - The Twitch client instance.
   * @param {string} channel - The channel where the message was sent.
   * @param {object} tags - The user tags associated with the message.
   * @param {string} args - The command arguments.
   */
  async execute(client, channel, tags, args) {
    logInfo(
      resolvePath("chatBot/logs"),
      `Deeplol command called by ${tags.username}.`
    );

    // Check if the user has the required permissions (Viewers have access by default)
    if (!checkPermissions(tags, "viewer")) {
      client.say(
        channel,
        `@${tags.username}, you don't have permission to use this command. 🚫`
      );
      logError(
        resolvePath("chatBot/logs"),
        `User ${tags.username} tried to use !deeplol without permission. ❌`
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
      const accountsData = JSON.parse(
        fs.readFileSync(accountsFilePath, "utf8")
      );
      const deeplolLinks = accountsData.accounts
        .map(
          (account) =>
            `https://www.deeplol.gg/summoner/${account.region.toUpperCase()}/${encodeURIComponent(
              account.name
            )}-${account.tag.toLowerCase()}`
        )
        .join(" | ");

      client.say(
        channel,
        `@${tags.username}, here are the Deeplol links: ${deeplolLinks}`
      );
      logInfo(
        resolvePath("chatBot/logs"),
        `Deeplol links sent to ${tags.username}: ${deeplolLinks}`
      );
    } catch (error) {
      logError(
        resolvePath("chatBot/logs"),
        `Error generating Deeplol links: ${error.message} ❌`
      );
      client.say(
        channel,
        `@${tags.username}, there was an error generating the Deeplol links. ❌`
      );
    }
  },
};
