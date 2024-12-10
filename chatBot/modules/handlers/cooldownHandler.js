const { resolvePath } = require("../../../pathHelper"); // Importing resolvePath from pathHelper.js
const { logInfo, logError } = require(resolvePath("logger.js")); // Adjusted path for logger

// Creating a Map to store user command timestamps
const cooldowns = new Map();

/**
 * Handles command cooldowns.
 *
 * @param {object} client - The Twitch client instance.
 * @param {string} channel - The channel where the message was sent.
 * @param {string} commandName - The command name received from the message.
 * @param {string} user - The user who sent the message.
 * @param {number} cooldownTime - The cooldown period in milliseconds.
 * @returns {boolean} - Whether the command is on cooldown for the user.
 */
const handleCooldowns = (client, channel, commandName, user, cooldownTime) => {
  try {
    // Get the current timestamp
    const now = Date.now();

    // Initialize the cooldowns map for the command if it doesn't exist
    if (!cooldowns.has(commandName)) {
      cooldowns.set(commandName, new Map());
    }

    const timestamps = cooldowns.get(commandName);

    // Check if the user is on cooldown
    if (timestamps.has(user)) {
      const expirationTime = timestamps.get(user) + cooldownTime;

      if (now < expirationTime) {
        const timeLeft = Math.ceil((expirationTime - now) / 1000);
        client.say(
          channel,
          `@${user}, please wait ${timeLeft} more seconds before using the ${commandName} command again. 🕒`
        );
        logInfo(
          resolvePath("chatBot/logs"),
          `User ${user} tried to use ${commandName} command while on cooldown. Time left: ${timeLeft} seconds`
        );
        return true; // Command is on cooldown
      }
    }

    // Set the user's timestamp to the current time
    timestamps.set(user, now);
    logInfo(
      resolvePath("chatBot/logs"),
      `User ${user} used ${commandName} command. Cooldown started.`
    );
    return false; // Command is not on cooldown
  } catch (error) {
    logError(
      resolvePath("chatBot/logs"),
      `Error handling cooldown for ${commandName} command by ${user}: ${error.message} ❌`
    );
    return false; // Fail-safe: allow command execution if an error occurs
  }
};

module.exports = handleCooldowns;
