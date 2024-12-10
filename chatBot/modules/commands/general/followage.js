const axios = require("axios");
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

const followageFilePath = resolvePath("dataStorage/followage.json");

const getFollowDateFromFile = (username) => {
  if (fs.existsSync(followageFilePath)) {
    const data = fs.readFileSync(followageFilePath, "utf8");
    const followageData = JSON.parse(data);
    return followageData.followers[username]
      ? followageData.followers[username].follow_date
      : null;
  }
  return null;
};

const storeFollowDateToFile = (username, followDate) => {
  let followageData = { followers: {} };
  if (fs.existsSync(followageFilePath)) {
    followageData = JSON.parse(fs.readFileSync(followageFilePath, "utf8"));
  }
  followageData.followers[username] = {
    follow_date: followDate,
    status: "active",
  };
  fs.writeFileSync(followageFilePath, JSON.stringify(followageData, null, 2));
};

const COOLDOWN_TIME = 5000; // 5 seconds cooldown

module.exports = {
  name: "followage",
  description: "Displays how long a user has been following.",
  aliases: ["!followage", "!following"],
  category: "General",

  /**
   * Executes the followage command.
   *
   * @param {object} client - The Twitch client instance.
   * @param {string} channel - The channel where the message was sent.
   * @param {object} tags - The user tags associated with the message.
   * @param {string} args - The command arguments.
   */
  async execute(client, channel, tags, args) {
    const username = args[0] || tags.username;
    logInfo(
      `Followage command called by ${tags.username} for user ${username}.`
    );

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

    if (username.toLowerCase() === config.broadcasterUsername.toLowerCase()) {
      client.say(
        channel,
        `You can't follow yourself, numnuts. Don't have an ego. 😜`
      );
      logInfo(
        `Followage command executed by ${tags.username}: Attempt to check own followage.`
      );
      return;
    }

    let followDate = getFollowDateFromFile(username);

    if (followDate) {
      const now = new Date();
      const followage = Math.floor(
        (now - new Date(followDate)) / (1000 * 60 * 60 * 24)
      ); // Followage in days
      client.say(
        channel,
        `@${username} has been following for ${followage} days.`
      );
      logInfo(
        `Followage command executed by ${tags.username}: ${followage} days for ${username}`
      );
    } else {
      try {
        const userResponse = await axios.get(
          `https://api.twitch.tv/helix/users?login=${username}`,
          {
            headers: {
              "Client-ID": config.clientId,
              Authorization: `Bearer ${config.broadcasterToken}`,
            },
          }
        );

        if (userResponse.data.data.length > 0) {
          const userId = userResponse.data.data[0].id;

          const followResponse = await axios.get(
            `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${config.broadcasterId}&user_id=${userId}`,
            {
              headers: {
                "Client-ID": config.clientId,
                Authorization: `Bearer ${config.broadcasterToken}`,
              },
            }
          );

          if (followResponse.data.data.length > 0) {
            followDate = followResponse.data.data[0].followed_at;
            storeFollowDateToFile(username, followDate);

            const now = new Date();
            const followage = Math.floor(
              (now - new Date(followDate)) / (1000 * 60 * 60 * 24)
            ); // Followage in days
            client.say(
              channel,
              `@${username} has been following for ${followage} days.`
            );
            logInfo(
              `Followage command executed by ${tags.username}: ${followage} days for ${username}`
            );
          } else {
            client.say(channel, `@${username} is not following the channel.`);
            logInfo(
              `Followage command executed by ${tags.username}: ${username} is not following.`
            );
          }
        } else {
          client.say(
            channel,
            `@${tags.username}, the username "${username}" was not found.`
          );
          logError(
            `Followage command executed by ${tags.username}: Username "${username}" not found.`
          );
        }
      } catch (error) {
        logError(
          `Error fetching followage: ${
            error.response
              ? JSON.stringify(error.response.data, null, 2)
              : error.message
          } ❌`
        );
        client.say(
          channel,
          `@${tags.username}, there was an error fetching the followage. ❌`
        );
      }
    }
  },
};
