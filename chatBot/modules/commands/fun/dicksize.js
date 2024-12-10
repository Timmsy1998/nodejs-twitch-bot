const { logError, logInfo } = require("../../../../logger.js"); // Adjusted to import logger
const { checkPermissions } = require("../../handlers/permissionHandler"); // Adjusted path for permission handler
const { handleCooldowns } = require("../../handlers/cooldownHandler"); // Adjusted path for cooldown handler

const COOLDOWN_TIME = 5000; // 5 seconds cooldown

const ranks = [
  "Tiny Twig 🌱",
  "Little Sprout 🌿",
  "Average Stick 🌳",
  "Decent Branch 🌴",
  "Impressive Log 🪵",
  "Mighty Trunk 🌳",
  "Colossal Canopy 🌲",
];

module.exports = {
  name: "dicksize",
  description: "Get your dick size in cm with a funny rank.",
  category: "Fun",
  aliases: ["!dicksize"],

  /**
   * Executes the dicksize command.
   *
   * @param {object} client - The Twitch client instance.
   * @param {string} channel - The channel where the message was sent.
   * @param {object} tags - The user tags associated with the message.
   * @param {string} args - The command arguments.
   */
  async execute(client, channel, tags, args) {
    logInfo(`dicksize command called by ${tags.username}.`);

    // Check if the user has the required permissions (Viewers have access by default)
    if (!checkPermissions(tags, "viewer")) {
      client.say(
        channel,
        `@${tags.username}, you do not have permission to use this command. 🚫`
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
      // Generate a random dick size
      const size = (Math.random() * 24 + 1).toFixed(1); // Random size between 1 and 25 cm
      let rank;

      if (size < 5) {
        rank = ranks[0]; // Tiny Twig
      } else if (size < 8) {
        rank = ranks[1]; // Little Sprout
      } else if (size < 12) {
        rank = ranks[2]; // Average Stick
      } else if (size < 15) {
        rank = ranks[3]; // Decent Branch
      } else if (size < 18) {
        rank = ranks[4]; // Impressive Log
      } else if (size < 20) {
        rank = ranks[5]; // Mighty Trunk
      } else {
        rank = ranks[6]; // Colossal Canopy
      }

      logInfo(`dick size: ${size} cm, Rank: ${rank}`);
      client.say(
        channel,
        `@${tags.username}, your dick size is ${size} cm. Rank: ${rank} 😏`
      );
    } catch (error) {
      logError(`Error fetching dick size: ${error.message} ❌`);
      client.say(
        channel,
        `@${tags.username}, there was an error getting your dick size. ❌`
      );
    }
  },
};
