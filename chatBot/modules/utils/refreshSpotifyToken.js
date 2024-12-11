const axios = require("axios");
const fs = require("fs");
const { resolvePath } = require("../../../pathHelper"); // Importing resolvePath from pathHelper.js
const config = require(resolvePath("global.js")); // Importing global configurations
const { logError, logInfo } = require(resolvePath("logger.js")); // Importing logger

/**
 * Function to update .env file
 * @param {Object} newEnv - An object containing the new environment variables
 */
const updateEnv = (newEnv) => {
  const envPath = resolvePath("../../../../.env"); // Adjust the path to your .env file
  const envContent = fs.readFileSync(envPath, "utf-8");
  const envLines = envContent.split("\n");

  const updatedEnvLines = envLines.map((line) => {
    const [key, value] = line.split("=");
    if (newEnv[key]) {
      return `${key}=${newEnv[key]}`;
    }
    return line;
  });

  fs.writeFileSync(envPath, updatedEnvLines.join("\n"), "utf-8");
};

/**
 * Refreshes the Spotify access token using the refresh token.
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

    // Updating the .env file with the new access token
    updateEnv({
      SPOTIFY_TOKEN: newAccessToken,
    });

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
