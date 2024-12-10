const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

module.exports = {
  botUsername: process.env.BOT_USERNAME,
  botToken: process.env.BOT_TOKEN,
  clientId: process.env.CLIENT_ID,
  broadcasterUsername: process.env.BROADCASTER_USERNAME,
  broadcasterId: process.env.BROADCASTER_ID,
  broadcasterToken: process.env.BROADCASTER_TOKEN,
  redirectUri: process.env.REDIRECT_URI,
  riotApiKey: process.env.RIOT_API_KEY,
  spotifyRedirectUri: process.env.SPOTIFY_REDIRECT_URI,
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID,
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  spotifyToken: process.env.SPOTIFY_TOKEN,
  spotifyRefreshToken: process.env.SPOTIFY_REFRESH_TOKEN,
};
