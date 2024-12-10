const axios = require("axios");
const config = require("../../../../global.js"); // Adjusted to import global configurations
const { logError, logInfo } = require("../../../../logger.js"); // Adjusted to import logger
const { checkPermissions } = require("../../handlers/permissionHandler"); // Adjusted path for permission handler
const { handleCooldowns } = require("../../handlers/cooldownHandler"); // Adjusted path for cooldown handler

const COOLDOWN_TIME = 5000; // 5 seconds cooldown

module.exports = {
  name: "clip",
  description: "Create a clip for the last 30 seconds of the stream.",
  aliases: ["!clip"],
  category: "Fun",

  /**
   * Executes the clip command.
   *
   * @param {object} client - The Twitch client instance.
   * @param {string} channel - The channel where the message was sent.
   * @param {object} tags - The user tags associated with the message.
   * @param {string} args - The command arguments.
   */
  async execute(client, channel, tags, args) {
    logInfo(`Clip command called by ${tags.username}. 🎬`);

    // Check if the user has the required permissions (Viewers have access by default)
    if (!checkPermissions(tags, "viewer")) {
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

    const broadcasterId = config.broadcasterId; // Your Twitch broadcaster ID
    const accessToken = config.broadcasterToken; // Your Twitch access token

    try {
      // Notify chat about the clip creation
      client.say(channel, "Creating a clip for the last 30 seconds... 🎬");

      // Create the clip
      const response = await axios.post(
        `https://api.twitch.tv/helix/clips?broadcaster_id=${broadcasterId}`,
        null,
        {
          headers: {
            "Client-ID": config.clientId,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const clipData = response.data.data[0];
      const editUrl = clipData.edit_url;

      logInfo(`Clip created: ${JSON.stringify(clipData)}`);

      // Notify chat with the edit URL
      client.say(channel, `Clip created! You can edit it here: ${editUrl}`);
    } catch (error) {
      logError(
        `Error creating clip: ${
          error.response ? error.response.data : error.message
        } ❌`
      );
      client.say(
        channel,
        `@${tags.username}, there was an error creating the clip. ❌`
      );
    }
  },
};
