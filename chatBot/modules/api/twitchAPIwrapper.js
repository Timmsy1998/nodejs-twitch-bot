const axios = require("axios");
const { resolvePath } = require("../../../../pathHelper"); // Importing resolvePath from pathHelper.js
const config = require(resolvePath("global.js")); // Importing global configurations
const { logError, logInfo } = require(resolvePath("logger.js")); // Importing logger

/**
 * Creates an Axios instance configured for the Twitch API.
 *
 * @param {string} accessToken - The access token for the Twitch API.
 * @returns {object} - The configured Axios instance.
 */
const createTwitchApi = (accessToken) => {
  return axios.create({
    baseURL: "https://api.twitch.tv/helix",
    headers: {
      "Client-ID": config.clientId,
      Authorization: `Bearer ${accessToken}`,
    },
  });
};

// Create an Axios instance for the broadcaster
const broadcasterTwitchApi = createTwitchApi(config.broadcasterToken);

/**
 * Fetches the game ID for a given game name.
 *
 * @param {string} gameName - The name of the game.
 * @returns {string|null} - The game ID or null if not found.
 */
const getGameId = async (gameName) => {
  try {
    const response = await broadcasterTwitchApi.get(
      `/games?name=${encodeURIComponent(gameName)}`
    );
    if (response.data.data.length > 0) {
      logInfo(`Fetched game ID for ${gameName}: ${response.data.data[0].id}`);
      return response.data.data[0].id;
    } else {
      logInfo(`No game ID found for ${gameName}`);
      return null;
    }
  } catch (error) {
    logError(
      `Error fetching game ID: ${
        error.response ? JSON.stringify(error.response.data) : error.message
      } ❌`
    );
    return null;
  }
};

/**
 * Updates the channel information.
 *
 * @param {object} data - The data to update the channel with.
 * @returns {object} - The updated channel data.
 */
const updateChannelInfo = async (data) => {
  try {
    const response = await broadcasterTwitchApi.patch(
      `/channels?broadcaster_id=${config.broadcasterId}`,
      data
    );
    logInfo(`Updated channel info: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    logError(
      `Error updating channel info: ${
        error.response ? JSON.stringify(error.response.data) : error.message
      } ❌`
    );
    throw error;
  }
};

/**
 * Fetches the current game being played on the channel.
 *
 * @returns {string} - The current game name.
 */
const getCurrentGame = async () => {
  try {
    const response = await broadcasterTwitchApi.get(
      `/channels?broadcaster_id=${config.broadcasterId}`
    );
    if (response.data.data.length > 0) {
      logInfo(`Current game: ${response.data.data[0].game_name}`);
      return response.data.data[0].game_name;
    } else {
      logInfo(`No current game found.`);
      return "Unknown Game";
    }
  } catch (error) {
    logError(
      `Error fetching current game: ${
        error.response ? JSON.stringify(error.response.data) : error.message
      } ❌`
    );
    return "Unknown Game";
  }
};

module.exports = {
  getGameId,
  updateChannelInfo,
  getCurrentGame,
};
