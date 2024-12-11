const axios = require("axios");
const { resolvePath } = require("../../../../pathHelper"); // Importing resolvePath from pathHelper.js
const config = require(resolvePath("global.js")); // Import global configurations
const { logError, logInfo } = require(resolvePath("logger.js")); // Adjusted to import logger
const { getGameId, updateChannelInfo } = require(resolvePath(
  "chatBot/modules/api/twitchAPIwrapper"
)); // Adjusted path for Twitch API
const checkPermissions = require(resolvePath(
  "chatBot/modules/handlers/permissionHandler"
)); // Adjusted path for permission handler
const handleCooldowns = require(resolvePath(
  "chatBot/modules/handlers/cooldownHandler"
)); // Adjusted path for cooldown handler

const COOLDOWN_TIME = 30000; // 30 seconds cooldown

module.exports = {
  name: "setgame",
  description: "Sets the current game.",
  aliases: ["!setgame", "!changegame"],
  keywords: ["set game", "change game"],
  category: "Moderation",

  /**
   * Executes the setgame command.
   *
   * @param {object} client - The Twitch client instance.
   * @param {string} channel - The channel where the message was sent.
   * @param {object} tags - The user tags associated with the message.
   * @param {string} args - The command arguments.
   */
  async execute(client, channel, tags, args) {
    logInfo(
      resolvePath("chatBot/logs"),
      `Setgame command called by ${tags.username}.`
    );

    // Check if the user has the required permissions (Moderators have access)
    if (!checkPermissions(tags, "moderator")) {
      client.say(
        channel,
        `@${tags.username}, you don't have permission to use this command. 🚫`
      );
      logError(
        resolvePath("chatBot/logs"),
        `User ${tags.username} tried to use !setgame without permission. ❌`
      );
      return;
    }

    // Check if the command is on cooldown for the user
    if (
      handleCooldowns(client, channel, this.name, tags.username, COOLDOWN_TIME)
    ) {
      return; // Exit if the command is on cooldown
    }

    const game = args.join(" ");
    try {
      // Get the game ID using the Twitch API
      const gameId = await getGameId(game);
      if (!gameId) {
        client.say(
          channel,
          `@${tags.username}, the game "${game}" was not found. ❌`
        );
        logError(resolvePath("chatBot/logs"), `Game "${game}" was not found.`);
        return;
      }

      // Update the channel information with the new game ID
      await updateChannelInfo({ game_id: gameId });
      client.say(
        channel,
        `@${tags.username}, the game has been updated to: ${game} 🎮`
      );
      logInfo(
        resolvePath("chatBot/logs"),
        `Game updated to: ${game} by ${tags.username}`
      );
    } catch (error) {
      logError(
        resolvePath("chatBot/logs"),
        `Error updating game: ${error.message} ❌`
      );
      client.say(
        channel,
        `@${tags.username}, there was an error updating the game. ❌`
      );
    }
  },
};
