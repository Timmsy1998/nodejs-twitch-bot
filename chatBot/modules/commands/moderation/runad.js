const axios = require("axios");
const config = require("../../../../global.js"); // Adjusted to import global configurations
const { logError, logInfo } = require("../../../../logger.js"); // Adjusted to import logger
const { checkPermissions } = require("../../handlers/permissionHandler"); // Adjusted path for permission handler
const { handleCooldowns } = require("../../handlers/cooldownHandler"); // Adjusted path for cooldown handler

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
    // Check if the user has the required permissions (Moderators have access)
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

    const broadcasterId = config.broadcasterId;
    const accessToken = config.broadcasterToken;

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
            "Client-ID": config.clientId,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      logInfo(`Ad started: ${JSON.stringify(response.data)}`);
    } catch (error) {
      logError(`Error running ad: ${error.message} ❌`);
      client.say(
        channel,
        `@${tags.username}, there was an error running the ad. ❌`
      );
    }
  },
};
