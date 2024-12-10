const axios = require("axios");
const fs = require("fs");
const { resolvePath } = require("../../../../pathHelper"); // Importing resolvePath from pathHelper.js
const querystring = require("querystring");
const config = require(resolvePath("global.js")); // Import shared global configuration
const { logError, logInfo } = require(resolvePath("logger.js")); // Import shared logger

const setupSpotifyRoutes = (app) => {
  // Route to generate Spotify authorization URL
  app.get("/login", (req, res) => {
    const clientId = config.spotifyClientId;
    const redirectUri = config.spotifyRedirectUri;
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

    res.redirect(authUrl); // Redirect the user to Spotify's authorization page
  });

  // Spotify OAuth callback route
  app.get("/spotify-callback", async (req, res) => {
    const code = req.query.code;
    const redirectUri = config.spotifyRedirectUri;
    const clientId = config.spotifyClientId;
    const clientSecret = config.spotifyClientSecret;

    try {
      // Exchange authorization code for access and refresh tokens
      const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const accessToken = response.data.access_token;
      const refreshToken = response.data.refresh_token;
      const grantedScopes = response.data.scope.split(" ");

      // Store tokens globally
      global.spotifyAccessToken = accessToken;
      global.spotifyRefreshToken = refreshToken;

      // Update config with new tokens
      config.spotifyToken = accessToken;
      config.spotifyRefreshToken = refreshToken;
      fs.writeFileSync(
        resolvePath("global.js"),
        `module.exports = ${JSON.stringify(config, null, 2)};`
      );

      // Send a response with the tokens and granted scopes
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
      logInfo("Spotify access token received: " + accessToken);
      logInfo("Spotify refresh token received: " + refreshToken);

      startTokenRefreshScheduler(); // Start the token refresh scheduler
    } catch (error) {
      logError(
        "Error getting Spotify access token: " +
          (error.response ? error.response.data : error.message)
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

  // Route to fetch Spotify Now Playing information
  app.get("/spotify-now-playing", async (req, res) => {
    const spotifyAccessToken = global.spotifyAccessToken;

    if (!spotifyAccessToken) {
      return res.status(401).json({ error: "No Spotify token provided" });
    }

    try {
      const response = await axios.get(
        "https://api.spotify.com/v1/me/player/currently-playing",
        {
          headers: {
            Authorization: `Bearer ${spotifyAccessToken}`,
          },
        }
      );
      res.json(response.data);
    } catch (error) {
      logError("Error fetching Spotify Now Playing: " + error.response.data);
      res
        .status(500)
        .send(
          `Error fetching Spotify Now Playing: ${JSON.stringify(
            error.response.data
          )}`
        );
    }
  });

  // Route to refresh Spotify access token
  app.get("/refresh-token", async (req, res) => {
    await refreshSpotifyToken();
    res.sendStatus(200);
  });

  // Route to clear Spotify queue
  app.get("/clear-queue", async (req, res) => {
    const accessToken = global.spotifyAccessToken;

    if (!accessToken) {
      return res.status(401).json({ error: "No Spotify token provided" });
    }

    try {
      // Pause playback
      await axios.put(
        "https://api.spotify.com/v1/me/player/pause",
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Function to clear the queue
      const clearQueue = async () => {
        while (true) {
          // Get current playback state
          const playbackResponse = await axios.get(
            "https://api.spotify.com/v1/me/player",
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          // Check if there is a track currently playing
          if (!playbackResponse.data || !playbackResponse.data.item) {
            break;
          }

          // Skip to the next track
          await axios.post(
            "https://api.spotify.com/v1/me/player/next",
            {},
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          // Add a delay to ensure the next API is called properly
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      };

      // Clear the queue
      await clearQueue();

      res.status(200).send("Queue cleared.");
    } catch (error) {
      logError(
        "Error clearing Spotify queue: " +
          (error.response ? error.response.data : error.message)
      );
      res.status(500).json({ error: "Error clearing queue." });
    }
  });
};

// Function to refresh Spotify access token
async function refreshSpotifyToken() {
  const refreshToken = config.spotifyRefreshToken;
  const clientId = config.spotifyClientId;
  const clientSecret = config.spotifyClientSecret;

  if (!refreshToken) {
    logError("No refresh token available");
    return;
  }

  try {
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
    global.spotifyAccessToken = newAccessToken; // Save the new access token

    // Update the config file with the new access token
    config.spotifyToken = newAccessToken;
    fs.writeFileSync(
      resolvePath("global.js"),
      `module.exports = ${JSON.stringify(config, null, 2)};`
    );

    logInfo("Spotify access token refreshed: " + newAccessToken);
  } catch (error) {
    logError("Error refreshing Spotify access token: " + error.response.data);
  }
}

// Scheduler to refresh Spotify token every 50 minutes
function startTokenRefreshScheduler() {
  setInterval(async () => {
    logInfo("Refreshing Spotify token...");
    await refreshSpotifyToken();
  }, 50 * 60 * 1000); // 50 minutes
}

// Start the token refresh scheduler on server startup
startTokenRefreshScheduler();

module.exports = setupSpotifyRoutes;
