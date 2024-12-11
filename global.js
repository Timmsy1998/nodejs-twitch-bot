const botConfig = require("./config/botConfig");
const lolConfig = require("./config/lolConfig");
const serverConfig = require("./config/serverConfig");
const spotifyConfig = require("./config/spotifyConfig");
const twitchConfig = require("./config/twitchConfig");

module.exports = {
  ...botConfig,
  ...lolConfig,
  ...serverConfig,
  ...spotifyConfig,
  ...twitchConfig,
};
