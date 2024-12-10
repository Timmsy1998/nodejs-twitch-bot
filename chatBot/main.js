const tmi = require("tmi.js");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const config = require("../global.js"); // Importing configurations from global.js
const { logError, logInfo, logConsole } = require("../logger.js"); // Importing logger
const { resolvePath } = require("../pathHelper"); // Importing resolvePath from pathHelper.js

const onConnectedHandler = require(resolvePath(
  "chatBot/modules/events/connected"
));
const createMessageHandler = require(resolvePath(
  "chatBot/modules/events/message"
));

const logDir = resolvePath("chatBot/logs"); // Directory for chatBot logs
logConsole(logDir, "Bot is starting... 🚀");

const client = new tmi.Client({
  options: { debug: true },
  connection: { reconnect: true, secure: true },
  identity: { username: config.botUsername, password: config.botToken },
  channels: [config.broadcasterUsername],
});

client.commands = new Map();

const loadCommands = (dir) => {
  const fullPath = resolvePath(path.join("chatBot", dir));
  if (!fs.existsSync(fullPath)) {
    logError(logDir, `Directory not found: ${fullPath}`);
    return;
  }

  fs.readdirSync(fullPath).forEach((file) => {
    const filePath = path.join(fullPath, file);
    const stat = fs.lstatSync(filePath);
    if (stat.isDirectory()) {
      loadCommands(path.join(dir, file));
    } else if (file.endsWith(".js")) {
      try {
        logInfo(logDir, `Attempting to load command: ${filePath} 🚀`);
        const command = require(filePath);
        client.commands.set(command.name, command);
        logInfo(logDir, `Loaded command: ${command.name} ✅`);
      } catch (error) {
        logError(logDir, `Failed to load command ${file}: ${error.message} ❌`);
      }
    }
  });
};

// Command directories categorized
const commandDirs = [
  "modules/commands/general",
  "modules/commands/spotify",
  "modules/commands/fun",
  "modules/commands/moderation",
  "modules/commands/broadcaster",
  "modules/commands/leagueOfLegends",
];
commandDirs.forEach(loadCommands);

client.on("connected", onConnectedHandler);
client.on("message", createMessageHandler(client));

client.connect().catch((error) => {
  logError(logDir, `Connection error: ${error.message} ❌`);
});

// Function to check if the channel is live
const isChannelLive = async () => {
  try {
    const response = await axios.get(
      `https://api.twitch.tv/helix/streams?user_id=${config.broadcasterId}`,
      {
        headers: {
          "Client-ID": config.clientId,
          Authorization: `Bearer ${config.broadcasterToken}`,
        },
      }
    );
    return response.data.data.length > 0;
  } catch (error) {
    logError(logDir, `Error checking stream status: ${error.message} ❌`);
    return false;
  }
};

// Auto-run !discord command every 30 minutes if the channel is live
const discordCommand = client.commands.get("discord");
if (discordCommand) {
  setInterval(async () => {
    const isLive = await isChannelLive();
    if (isLive) {
      discordCommand.execute(client, config.broadcasterUsername);
    } else {
      logInfo(
        logDir,
        "Channel is not live, skipping auto-run of !discord command. ⏸️"
      );
    }
  }, 30 * 60 * 1000); // 30 minutes in milliseconds
}

process.on("uncaughtException", (error) => {
  logError(logDir, `Uncaught Exception: ${error.message} ❌`);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logError(logDir, `Unhandled Rejection: ${reason} ❌`);
});

module.exports = client;
