const axios = require("axios");
const querystring = require("querystring");
const { resolvePath } = require("../../pathHelper"); // Importing path resolution helper
const config = require(resolvePath("global.js")); // Import shared global configuration
const { logError, logInfo } = require(resolvePath("logger.js")); // Import shared logger
const refreshSpotifyToken = require(resolvePath(
  "chatBot/modules/utils/refreshSpotifyToken"
)); // Importing the refresh token function
const fs = require("fs");

/**
 * Updates the Spotify config file with new tokens
 * @param {object} newTokens - The new Spotify tokens to update
 */
const updateSpotifyConfig = (newTokens) => {
  const spotifyConfigPath = resolvePath("config/spotifyConfig.js");
  const currentConfig = require(spotifyConfigPath);
  const updatedConfig = {
    ...currentConfig,
    ...newTokens,
  };
  const content = `module.exports = ${JSON.stringify(updatedConfig, null, 2)};`;
  fs.writeFileSync(spotifyConfigPath, content, "utf8");
};

/**
 * Sets up Spotify-related routes for the Express application.
 * @param {object} app - The Express application instance.
 */
const setupSpotifyRoutes = (app) => {
  /**
   * GET /login
   * Redirects the user to Spotify's authorization page.
   */
  app.get("/login", (req, res) => {
    const clientId = config.SPOTIFY_CLIENT_ID;
    const redirectUri = config.SPOTIFY_REDIRECT_URI;
    const scopes = [
      "streaming",
      "user-read-email",
      "user-read-private",
      "user-read-playback-state",
      "user-read-currently-playing",
      "user-modify-playback-state",
      "user-library-read",
      "user-library-modify",
      "user-top-read",
      "user-follow-read",
      "user-follow-modify",
      "playlist-read-private",
      "playlist-read-collaborative",
      "playlist-modify-private",
      "playlist-modify-public",
    ].join(" ");

    // Construct the authorization URL
    const authUrl = `https://accounts.spotify.com/authorize?${querystring.stringify(
      {
        response_type: "code",
        client_id: clientId,
        scope: scopes,
        redirect_uri: redirectUri,
      }
    )}`;

    // Redirect the user to Spotify's authorization page
    res.redirect(authUrl);
  });

  /**
   * GET /spotify-callback
   * Handles the callback from Spotify's authorization, exchanges authorization code for access and refresh tokens, and updates the Spotify config file.
   */
  app.get("/spotify-callback", async (req, res) => {
    const code = req.query.code;
    const redirectUri = config.SPOTIFY_REDIRECT_URI;
    const clientId = config.SPOTIFY_CLIENT_ID;
    const clientSecret = config.SPOTIFY_CLIENT_SECRET;

    try {
      // Exchange authorization code for access and refresh tokens
      const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const accessToken = response.data.access_token;
      const refreshToken = response.data.refresh_token;
      const grantedScopes = response.data.scope.split(" ");

      // Update the Spotify config file with new tokens
      updateSpotifyConfig({
        SPOTIFY_TOKEN: accessToken,
        SPOTIFY_REFRESH_TOKEN: refreshToken,
      });

      // Respond with the tokens and granted scopes
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Spotify OAuth Callback</title>
        </head>
        <body>
            <h1>Spotify OAuth Token</h1>
            <p>${
              accessToken
                ? `Access Token: ${accessToken}`
                : "No access token found"
            }</p>
            <p>${
              refreshToken
                ? `Refresh Token: ${refreshToken}`
                : "No refresh token found"
            }</p>
            <h2>Granted Scopes:</h2>
            <ul>${grantedScopes
              .map((scope) => `<li>${scope}</li>`)
              .join("")}</ul>
        </body>
        </html>
      `);

      logInfo(
        "webServer/logs",
        `Spotify access token received: ${accessToken}`
      );
      logInfo(
        "webServer/logs",
        `Spotify refresh token received: ${refreshToken}`
      );

      startTokenRefreshScheduler();
    } catch (error) {
      logError(
        "webServer/logs",
        `Error getting Spotify access token: ${
          error.response ? JSON.stringify(error.response.data) : error.message
        }`
      );
      res
        .status(500)
        .send(
          `Error getting Spotify access token: ${
            error.response ? JSON.stringify(error.response.data) : error.message
          }`
        );
    }
  });

  /**
   * GET /spotify-now-playing
   * Retrieves the currently playing track from Spotify. Refreshes the access token if expired.
   */
  app.get("/spotify-now-playing", async (req, res) => {
    try {
      let spotifyAccessToken = config.SPOTIFY_TOKEN;
      logInfo(
        "webServer/logs",
        `Spotify access token used: ${spotifyAccessToken}`
      );

      const response = await fetchNowPlayingData(spotifyAccessToken);

      if (response.status === 401) {
        // Access token has expired, refresh it
        const newAccessToken = await refreshSpotifyToken();
        spotifyAccessToken = newAccessToken;
        updateSpotifyConfig({ SPOTIFY_TOKEN: newAccessToken }); // Update the Spotify config with the new access token
        const retryResponse = await fetchNowPlayingData(spotifyAccessToken);
        res.json(retryResponse.data);
      } else if (response.status === 200) {
        // Successfully retrieved data
        res.json(response.data);
      } else {
        throw new Error("Failed to fetch Now Playing data");
      }
    } catch (error) {
      logError(
        "webServer/logs",
        `Error fetching Spotify Now Playing: ${
          error.response ? JSON.stringify(error.response.data) : error.message
        }`
      );
      res
        .status(500)
        .send(
          `Error fetching Spotify Now Playing: ${
            error.response ? JSON.stringify(error.response.data) : error.message
          }`
        );
    }
  });

  /**
   * GET /refresh-token
   * Refreshes the Spotify access token and updates the Spotify config file.
   */
  app.get("/refresh-token", async (req, res) => {
    const newAccessToken = await refreshSpotifyToken();
    updateSpotifyConfig({ SPOTIFY_TOKEN: newAccessToken }); // Update the Spotify config with the new access token
    res.sendStatus(200);
  });
};

/**
 * Fetches the currently playing track from Spotify.
 * @param {string} accessToken - The Spotify access token.
 * @returns {object} The response from Spotify API.
 */
const fetchNowPlayingData = async (accessToken) => {
  try {
    const response = await axios.get(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    return response;
  } catch (error) {
    return error.response;
  }
};

/**
 * Starts a scheduler to refresh the Spotify access token every 50 minutes.
 */
function startTokenRefreshScheduler() {
  setInterval(async () => {
    logInfo("webServer/logs", "Refreshing Spotify token...");
    const newAccessToken = await refreshSpotifyToken();
    updateSpotifyConfig({ SPOTIFY_TOKEN: newAccessToken }); // Update the Spotify config with the new access token
  }, 50 * 60 * 1000); // Refresh token every 50 minutes
}

startTokenRefreshScheduler();

// Export the setup function to initialize Spotify routes
module.exports = setupSpotifyRoutes;
