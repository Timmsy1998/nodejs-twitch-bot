const { resolvePath } = require("../../../../pathHelper"); // Importing resolvePath from pathHelper.js
const { logError, logInfo } = require(resolvePath("logger.js")); // Adjusted to import logger
const { checkPermissions } = require(resolvePath(
  "chatBot/modules/handlers/permissionHandler"
)); // Adjusted path for permission handler
const { handleCooldowns } = require(resolvePath(
  "chatBot/modules/handlers/cooldownHandler"
)); // Adjusted path for cooldown handler

const COOLDOWN_TIME = 5000; // 5 seconds cooldown

module.exports = {
  name: "commands",
  description: "Displays all available commands for viewers.",
  aliases: ["!commands", "!help"],
  category: "General",

  /**
   * Executes the commands command.
   *
   * @param {object} client - The Twitch client instance.
   * @param {string} channel - The channel where the message was sent.
   * @param {object} tags - The user tags associated with the message.
   * @param {string} args - The command arguments.
   */
  async execute(client, channel, tags, args) {
    logInfo(`Commands command called by ${tags.username}.`);

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
      const commandCategories = {
        General: [],
        Spotify: [],
        Fun: [],
        Moderation: [],
        Broadcaster: [],
        LeagueOfLegends: [],
      };

      client.commands.forEach((command) => {
        // Skip commands that are for mods or broadcasters only
        if (!command.modOnly && !command.broadcasterOnly) {
          const category = command.category || "General";
          if (!commandCategories[category]) {
            commandCategories[category] = [];
          }
          commandCategories[category].push(`!${command.name}`);
        }
      });

      const sortedCategories = Object.keys(commandCategories)
        .filter(
          (category) => category !== "Moderation" && category !== "Broadcaster"
        )
        .sort();

      let combinedMessage = sortedCategories
        .map((category) => {
          const sortedCommands = commandCategories[category].sort().join(", ");
          return `${category}: ${sortedCommands}`;
        })
        .join(" • ");

      // Ensure the message length is within the Twitch chat limit of 255 characters
      if (combinedMessage.length > 255) {
        combinedMessage = combinedMessage.slice(0, 252) + "...";
      }

      client.say(
        channel,
        `@${tags.username}, here are the available commands: ${combinedMessage}`
      );
      logInfo(`Displayed available commands to ${tags.username}.`);
    } catch (error) {
      logError(`Error displaying commands: ${error.message} ❌`);
      client.say(
        channel,
        `@${tags.username}, there was an error displaying the commands. ❌`
      );
    }
  },
};
