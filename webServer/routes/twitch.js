const path = require("path");
const { logError, logInfo } = require("../../logger.js"); // Shared logger from the root

const setupTwitchRoutes = (app) => {
  // Twitch OAuth callback route
  app.get("/callback", (req, res) => {
    logInfo("Received OAuth callback request"); // Log the callback request
    res.sendFile(path.join(__dirname, "../public/callback.html")); // Serve the callback.html from the public folder
  });

  // Token route for Twitch
  app.get("/token", (req, res) => {
    const accessToken = req.query.access_token;
    res.send("Access token received. You can close this window now.");
    logInfo(`Twitch access token received: ${accessToken}`); // Log the received access token
    global.twitchAccessToken = accessToken;
  });
};

module.exports = setupTwitchRoutes;