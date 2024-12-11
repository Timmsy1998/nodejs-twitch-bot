const { resolvePath } = require("../../../pathHelper"); // Importing resolvePath from pathHelper.js
const { logInfo, logError } = require(resolvePath("logger.js")); // Adjusted path for logger
const config = require(resolvePath("global.js")); // Import global configuration

/**
 * Checks if a user has the required permissions to execute a command.
 *
 * @param {object} tags - The user tags associated with the message.
 * @param {string} requiredPermission - The required permission level ('Viewer', 'Moderator', 'Broadcaster').
 * @returns {boolean} - Whether the user has the required permissions.
 */
const checkPermissions = (tags, requiredPermission) => {
  try {
    const userPermissions = {
      broadcaster: tags.badges && tags.badges.broadcaster === "1",
      moderator: tags.mod,
      viewer: true, // All users are viewers by default
    };

    if (userPermissions[requiredPermission.toLowerCase()]) {
      logInfo(
        resolvePath("chatBot/logs"),
        `User ${tags.username} has the required ${requiredPermission} permissions.`
      );
      return true;
    } else {
      logInfo(
        resolvePath("chatBot/logs"),
        `User ${tags.username} does not have the required ${requiredPermission} permissions.`
      );
      return false;
    }
  } catch (error) {
    logError(
      resolvePath("chatBot/logs"),
      `Error checking permissions for ${tags.username}: ${error.message} ❌`
    );
    return false; // Fail-safe: deny access if an error occurs
  }
};

module.exports = checkPermissions;
