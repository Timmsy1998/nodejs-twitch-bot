const axios = require("axios");
const { resolvePath } = require("../../../../pathHelper"); // Importing resolvePath from pathHelper.js
const config = require(resolvePath("global.js")); // Import global configurations
const { logError, logInfo } = require(resolvePath("logger.js")); // Adjusted to import logger
const checkPermissions = require(resolvePath(
  "chatBot/modules/handlers/permissionHandler"
)); // Adjusted path for permission handler
const handleCooldowns = require(resolvePath(
  "chatBot/modules/handlers/cooldownHandler"
)); // Adjusted path for cooldown handler

const COOLDOWN_TIME = 30000; // 30 seconds cooldown

module.exports = {
  name: "runad",
  description: "Run an ad on the channel.",
  aliases: ["!ad", "!commercial"],
  category: "Moderation",

  /**
   * Executes the runad command.
   *
   * @param {object} client - The Twitch client instance.
   * @param {string} channel - The channel where the message was sent.
   * @param {object} tags - The user tags associated with the message.
   * @param {string} args - The command arguments.
   */
  async execute(client, channel, tags, args) {
    logInfo(
      resolvePath("chatBot/logs"),
      `Runad command called by ${tags.username}.`
    );

    // Check if the user has the required permissions (Moderators have access)
    if (!checkPermissions(tags, "moderator")) {
      client.say(
        channel,
        `@${tags.username}, you don't have permission to use this command. 🚫`
      );
      logError(
        resolvePath("chatBot/logs"),
        `User ${tags.username} tried to use !runad without permission. ❌`
      );
      return;
    }

    // Check if the command is on cooldown for the user
    if (
      handleCooldowns(client, channel, this.name, tags.username, COOLDOWN_TIME)
    ) {
      return; // Exit if the command is on cooldown
    }

    const broadcasterId = config.BROADCASTER_ID;
    const accessToken = config.BROADCASTER_TOKEN;

    try {
      client.say(
        channel,
        "🚰🍹 Get a drink, have a tug, we're taking a 3-minute break... 🎬📺"
      );

      const response = await axios.post(
        `https://api.twitch.tv/helix/channels/commercial`,
        {
          broadcaster_id: broadcasterId,
          length: 180,
        },
        {
          headers: {
            "Client-ID": config.CLIENT_ID,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      logInfo(
        resolvePath("chatBot/logs"),
        `Ad started: ${JSON.stringify(response.data)}`
      );
    } catch (error) {
      logError(
        resolvePath("chatBot/logs"),
        `Error running ad: ${error.message} ❌`
      );
      client.say(
        channel,
        `@${tags.username}, there was an error running the ad. ❌`
      );
    }
  },
};
