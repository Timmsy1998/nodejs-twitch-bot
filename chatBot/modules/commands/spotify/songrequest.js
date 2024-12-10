const axios = require("axios");
const { resolvePath } = require("../../../../pathHelper"); // Importing resolvePath from pathHelper.js
const config = require(resolvePath("global.js")); // Adjusted to import global configurations
const { logError, logInfo } = require(resolvePath("logger.js")); // Adjusted to import logger
const refreshSpotifyToken = require(resolvePath(
  "chatBot/modules/utils/refreshSpotifyToken"
)); // Adjusted path for Spotify token refresh utility
const { checkPermissions } = require(resolvePath(
  "chatBot/modules/handlers/permissionHandler"
)); // Adjusted path for permission handler
const { handleCooldowns } = require(resolvePath(
  "chatBot/modules/handlers/cooldownHandler"
)); // Adjusted path for cooldown handler

const requestedSongsCache = new Map();
const CACHE_EXPIRY_TIME = 300000; // 5 minutes

/**
 * Sends a song request to Spotify.
 *
 * @param {string} accessToken - The Spotify access token.
 * @param {string} query - The search query.
 * @param {string} cacheKey - The cache key for the request.
 * @param {string} channel - The channel where the message was sent.
 * @param {object} client - The Twitch client instance.
 */
const songRequest = async (accessToken, query, cacheKey, channel, client) => {
  const searchParams = {
    q: query,
    type: "track",
    limit: 1,
  };

  logInfo("Sending search request to Spotify.");
  const searchResponse = await axios.get("https://api.spotify.com/v1/search", {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: searchParams,
  });

  logInfo(`Spotify search response: ${JSON.stringify(searchResponse.data)}`);

  if (searchResponse.data.tracks.items.length > 0) {
    const track = searchResponse.data.tracks.items[0];
    const trackUri = track.uri;
    const trackName = track.name;
    const artistName = track.artists.map((artist) => artist.name).join(", ");

    await addToQueue(
      accessToken,
      trackUri,
      trackName,
      artistName,
      cacheKey,
      channel,
      client
    );
  } else {
    client.say(channel, `Track not found: ${query}. ❌`);
  }
};

/**
 * Adds a track to the Spotify queue.
 *
 * @param {string} accessToken - The Spotify access token.
 * @param {string} trackUri - The URI of the track.
 * @param {string} trackName - The name of the track.
 * @param {string} artistName - The name of the artist.
 * @param {string} cacheKey - The cache key for the request.
 * @param {string} channel - The channel where the message was sent.
 * @param {object} client - The Twitch client instance.
 */
const addToQueue = async (
  accessToken,
  trackUri,
  trackName,
  artistName,
  cacheKey,
  channel,
  client
) => {
  try {
    logInfo("Fetching current queue.");
    const queueResponse = await axios.get(
      "https://api.spotify.com/v1/me/player/queue",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    logInfo(`Queue response status: ${queueResponse.status}`);
    const tracksInQueue = queueResponse.data.queue.map((t) => t.uri);

    if (tracksInQueue.includes(trackUri)) {
      client.say(
        channel,
        `Track is already in the queue: ${trackName} by ${artistName}.`
      );
    } else {
      logInfo("Sending request to add track to queue.");
      const addQueueResponse = await axios.post(
        `https://api.spotify.com/v1/me/player/queue?uri=${trackUri}`,
        null,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      logInfo(`Add to queue response status: ${addQueueResponse.status}`);

      if (addQueueResponse.status === 204 || addQueueResponse.status === 200) {
        client.say(
          channel,
          `Track added to queue: ${trackName} by ${artistName}. 🎶`
        );
        requestedSongsCache.set(cacheKey, Date.now());
      } else {
        throw new Error(
          `Unexpected response status: ${addQueueResponse.status}`
        );
      }
    }
  } catch (error) {
    if (
      error.response &&
      error.response.status === 404 &&
      error.response.data.reason === "NO_ACTIVE_DEVICE"
    ) {
      client.say(
        channel,
        `No active Spotify device found. Please make sure Spotify is open and active on a device. ❌`
      );
      logError("No active Spotify device found.");
    } else {
      throw error;
    }
  }
};

/**
 * Extracts the track ID from a Spotify URL.
 *
 * @param {string} url - The Spotify URL.
 * @returns {string|null} - The extracted track ID or null if not found.
 */
const extractTrackId = (url) => {
  const match = url.match(/track\/(\w+)/);
  return match ? match[1] : null;
};

/**
 * Fetches track information from Spotify by track ID.
 *
 * @param {string} accessToken - The Spotify access token.
 * @param {string} trackId - The ID of the track.
 * @returns {object} - The track information.
 */
const getTrackInfo = async (accessToken, trackId) => {
  const trackResponse = await axios.get(
    `https://api.spotify.com/v1/tracks/${trackId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const track = trackResponse.data;
  return {
    trackUri: track.uri,
    trackName: track.name,
    artistName: track.artists.map((artist) => artist.name).join(", "),
  };
};

/**
 * Checks if the channel is currently live.
 *
 * @returns {boolean} - Whether the channel is live.
 */
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
    logError(`Error checking stream status: ${error} ❌`);
    return false;
  }
};

module.exports = {
  name: "songrequest",
  description: "Request a song to be added to the Spotify queue.",
  aliases: ["!songrequest", "!sr", "!song", "!request"],
  keywords: ["can you play", "please play"],
  category: "Spotify",

  /**
   * Executes the song request command.
   *
   * @param {object} client - The Twitch client instance.
   * @param {string} channel - The channel where the message was sent.
   * @param {object} tags - The user tags associated with the message.
   * @param {string} args - The command arguments.
   */
  async execute(client, channel, tags, args) {
    logInfo("Executing songrequest command.");

    // Check if the user has the required permissions (Viewers have access by default)
    if (!checkPermissions(tags, "viewer")) {
      client.say(
        channel,
        `@${tags.username}, you do not have permission to use this command. 🚫`
      );
      return;
    }

    // Check if the command is on cooldown for the user
    if (handleCooldowns(client, channel, this.name, tags.username, 5000)) {
      return; // Exit if the command is on cooldown
    }

    const username = tags["username"];

    try {
      const isLive = await isChannelLive();
      if (!isLive) {
        client.say(
          channel,
          `@${tags.username}, song requests are only available when the streamer is live.`
        );
        return;
      }

      let query = args.trim();
      logInfo(`Received query: ${query}`);

      const cacheKey = query.toLowerCase();

      if (requestedSongsCache.has(cacheKey)) {
        const lastRequestedTime = requestedSongsCache.get(cacheKey);
        const currentTime = Date.now();
        if (currentTime - lastRequestedTime < CACHE_EXPIRY_TIME) {
          client.say(
            channel,
            `This song has been requested recently. Please try again later.`
          );
          return;
        }
      }

      try {
        if (query.startsWith("https://open.spotify.com/track/")) {
          const trackId = extractTrackId(query);
          logInfo(`Extracted track ID: ${trackId}`);

          if (!trackId) {
            client.say(channel, "Invalid Spotify URL.");
            return;
          }

          const trackInfo = await getTrackInfo(config.spotifyToken, trackId);
          await addToQueue(
            config.spotifyToken,
            trackInfo.trackUri,
            trackInfo.trackName,
            trackInfo.artistName,
            cacheKey,
            channel,
            client
          );
        } else {
          await songRequest(
            config.spotifyToken,
            query,
            cacheKey,
            channel,
            client
          );
        }
      } catch (error) {
        if (
          error.response &&
          (error.response.status === 401 ||
            error.response.data.error.message === "The access token expired")
        ) {
          const newAccessToken = await refreshSpotifyToken();
          if (query.startsWith("https://open.spotify.com/track/")) {
            const trackId = extractTrackId(query);
            const trackInfo = await getTrackInfo(newAccessToken, trackId);
            await addToQueue(
              newAccessToken,
              trackInfo.trackUri,
              trackInfo.trackName,
              trackInfo.artistName,
              cacheKey,
              channel,
              client
            );
          } else {
            await songRequest(newAccessToken, query, cacheKey, channel, client);
          }
        } else {
          throw error;
        }
      }
    } catch (error) {
      if (error.response) {
        logError(
          `Error response from Spotify API: ${
            error.response.status
          } - ${JSON.stringify(error.response.data)} ❌`
        );
        client.say(
          channel,
          `Error processing request: ${
            error.response.status
          } - ${JSON.stringify(error.response.data)} ❌`
        );
      } else {
        logError("Error processing request:", error);
        client.say(channel, "Error processing request. ❌");
      }
    }
  },
};
