const axios = require("axios");
const fs = require("fs");
const path = require("path");
const config = require("../../../../global.js"); // Adjusted to import global configurations
const { logError, logInfo } = require("../../../../logger.js"); // Adjusted to import logger

/**
 * Refreshes the Spotify access token using the refresh token.
 *
 * @returns {string} - The new Spotify access token.
 * @throws {Error} - Throws an error if the refresh token is not available or the API request fails.
 */
const refreshSpotifyToken = async () => {
  const refreshToken = config.spotifyRefreshToken;
  const clientId = config.spotifyClientId;
  const clientSecret = config.spotifyClientSecret;

  if (!refreshToken) {
    logError("No refresh token available. ❌");
    throw new Error("No refresh token available");
  }

  try {
    // Sending a request to Spotify's API to refresh the access token
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const newAccessToken = response.data.access_token;
    global.spotifyAccessToken = newAccessToken;

    // Updating the config file with the new access token
    config.spotifyToken = newAccessToken;
    fs.writeFileSync(
      path.join(__dirname, "../../../../global.js"),
      `module.exports = ${JSON.stringify(config, null, 2)};`
    );

    logInfo(`Spotify access token refreshed: ${newAccessToken} 🔄`);
    return newAccessToken;
  } catch (error) {
    logError(
      `Error refreshing Spotify access token: ${
        error.response ? JSON.stringify(error.response.data) : error.message
      } ❌`
    );
    throw error;
  }
};

module.exports = refreshSpotifyToken;
