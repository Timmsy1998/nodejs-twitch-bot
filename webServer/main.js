const express = require("express");
const path = require("path");
const setupSpotifyRoutes = require("./routes/spotify");
const setupTwitchRoutes = require("./routes/twitch");
const setupLeagueRoutes = require("./routes/league");
const { logError, logInfo, logConsole } = require("../logger.js"); // Shared logger from the root
const config = require("../global.js"); // Shared globals from the root

const app = express();
const port = config.webServerPort || 3000; // Define the port from global config or fallback to 3000

// Log the startup of the express server
logConsole("webServer/logs", "Starting express server...");
logInfo("webServer/logs", "Starting express server...");

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "../public")));

// Middleware to log all incoming requests
app.use((req, res, next) => {
  const logMessage = `${req.method} ${req.url}`; // Construct a log message with the HTTP method and URL
  logConsole("webServer/logs", logMessage); // Log the message using the express logger
  logInfo("webServer/logs", logMessage); // Log the message using the info logger
  next(); // Pass the request to the next middleware or route handler
});

// Setup routes for different functionalities
setupSpotifyRoutes(app); // Setup Spotify-related routes
setupTwitchRoutes(app); // Setup Twitch-related routes
setupLeagueRoutes(app); // Setup League of Legends-related routes

// Start the server and listen on the defined port
const server = app.listen(port, () => {
  const logMessage = `Server listening at http://localhost:${port}`; // Construct a log message for the server start
  logConsole("webServer/logs", logMessage); // Log the message using the express logger
  logInfo("webServer/logs", logMessage); // Log the message using the info logger
});

// Export the server for testing or further customization
module.exports = server;
