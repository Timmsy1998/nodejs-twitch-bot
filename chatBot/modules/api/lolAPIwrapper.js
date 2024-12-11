const axios = require("axios");
const { resolvePath } = require("../../../pathHelper"); // Importing resolvePath from pathHelper.js
const config = require(resolvePath("global.js")); // Importing global configurations
const { logError, logInfo } = require(resolvePath("logger.js")); // Importing logger

// Mapping for short and long regions used in Riot API
const regionMap = {
  euw: "euw1",
  na: "na1",
  eune: "eun1",
  kr: "kr",
  jp: "jp1",
  oce: "oc1",
  br: "br1",
  lan: "la1",
  las: "la2",
  ru: "ru",
  tr: "tr1",
};

const longRegionMap = {
  euw: "europe",
  na: "americas",
  eune: "europe",
  kr: "asia",
  jp: "asia",
  oce: "americas",
  br: "americas",
  lan: "americas",
  las: "americas",
  ru: "europe",
  tr: "europe",
};

/**
 * Creates an instance of Axios configured for the Riot API.
 *
 * @param {string} region - The region for the API request (e.g., 'euw', 'na').
 * @param {string} service - The Riot API service (e.g., 'summoner', 'match').
 * @param {string} version - The API version (default is 'v1').
 * @returns {object} - The configured Axios instance.
 */
const createRiotApiInstance = (region, service, version = "v1") => {
  const riotRegion = regionMap[region.toLowerCase()];
  if (!riotRegion) {
    throw new Error(`Unsupported region: ${region}`);
  }

  return axios.create({
    baseURL: `https://${riotRegion}.api.riotgames.com/lol/${service}/${version}`,
    headers: {
      "X-Riot-Token": config.RIOT_API_KEY,
    },
  });
};

/**
 * Creates an instance of Axios configured for the Riot API with long regions.
 *
 * @param {string} region - The region for the API request (e.g., 'euw', 'na').
 * @param {string} service - The Riot API service (e.g., 'account', 'match').
 * @param {string} version - The API version (default is 'v1').
 * @returns {object} - The configured Axios instance.
 */
const createRiotApiInstanceLong = (region, service, version = "v1") => {
  const riotRegion = longRegionMap[region.toLowerCase()];
  if (!riotRegion) {
    throw new Error(`Unsupported region: ${region}`);
  }

  return axios.create({
    baseURL: `https://${riotRegion}.api.riotgames.com/riot/${service}/${version}`,
    headers: {
      "X-Riot-Token": config.RIOT_API_KEY,
    },
  });
};

/**
 * Fetches account data by Riot ID.
 *
 * @param {string} name - The Riot ID name.
 * @param {string} tag - The Riot ID tag.
 * @param {string} region - The region for the API request.
 * @returns {object} - The account data.
 */
const getAccountByRiotId = async (name, tag, region) => {
  try {
    const riotApi = createRiotApiInstanceLong(region, "account", "v1");
    const encodedName = encodeURIComponent(name);
    const encodedTag = encodeURIComponent(tag);
    logInfo(`Fetching account data for ${name}#${tag} in region ${region}`);
    const response = await riotApi.get(
      `/accounts/by-riot-id/${encodedName}/${encodedTag}`
    );
    logInfo(`Received account data: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    logError(
      `Error fetching account data by Riot ID: ${
        error.response ? JSON.stringify(error.response.data) : error.message
      }`
    );
    throw error;
  }
};

/**
 * Fetches summoner data by PUUID.
 *
 * @param {string} puuid - The PUUID of the summoner.
 * @param {string} region - The region for the API request.
 * @returns {object} - The summoner data.
 */
const getSummonerByPuuid = async (puuid, region) => {
  try {
    const riotApi = createRiotApiInstance(region, "summoner", "v4");
    logInfo(`Fetching summoner data for PUUID: ${puuid} in region ${region}`);
    const response = await riotApi.get(`/summoners/by-puuid/${puuid}`);
    logInfo(
      `Received summoner data by PUUID: ${JSON.stringify(response.data)}`
    );
    return response.data;
  } catch (error) {
    logError(
      `Error fetching summoner data by PUUID: ${
        error.response ? JSON.stringify(error.response.data) : error.message
      }`
    );
    throw error;
  }
};

/**
 * Fetches ranked stats for a summoner.
 *
 * @param {string} summonerId - The ID of the summoner.
 * @param {string} region - The region for the API request.
 * @returns {object} - The ranked stats.
 */
const getRankedStats = async (summonerId, region) => {
  try {
    const riotApi = createRiotApiInstance(region, "league", "v4");
    logInfo(
      `Fetching ranked stats for summoner ID: ${summonerId} in region ${region}`
    );
    const response = await riotApi.get(`/entries/by-summoner/${summonerId}`);
    logInfo(`Received ranked stats: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    logError(
      `Error fetching ranked stats: ${
        error.response ? JSON.stringify(error.response.data) : error.message
      }`
    );
    throw error;
  }
};

/**
 * Fetches current runes for a summoner.
 *
 * @param {string} summonerId - The ID of the summoner.
 * @param {string} region - The region for the API request.
 * @returns {object} - The current runes.
 */
const getRunesBySummonerId = async (summonerId, region) => {
  try {
    const riotApi = createRiotApiInstance(region, "spectator", "v5"); // Ensuring the correct endpoint
    logInfo(
      `Fetching current runes for summoner ID: ${summonerId} in region ${region}`
    );
    const response = await riotApi.get(
      `/active-games/by-summoner/${summonerId}`
    );
    logInfo(`Received current runes: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    logError(
      `Error fetching current runes: ${
        error.response ? JSON.stringify(error.response.data) : error.message
      }`
    );
    throw error;
  }
};

/**
 * Fetches current game info for a summoner.
 *
 * @param {string} puuid - The PUUID of the summoner.
 * @param {string} region - The region for the API request.
 * @returns {object|null} - The current game info or null if not in a game.
 */
const getCurrentGameInfo = async (puuid, region) => {
  try {
    const riotApi = createRiotApiInstance(region, "spectator", "v5");
    logInfo(
      `Fetching current game info for PUUID: ${puuid} in region ${region}`
    );
    const response = await riotApi.get(`/active-games/by-summoner/${puuid}`);
    logInfo(`Received current game info: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      logInfo(`PUUID ${puuid} is not in a game.`);
      return null; // Summoner is not in a game
    }
    logError(
      `Error fetching current game info: ${
        error.response ? JSON.stringify(error.response.data) : error.message
      }`
    );
    throw error;
  }
};

/**
 * Fetches match IDs for a summoner.
 *
 * @param {string} puuid - The PUUID of the summoner.
 * @param {string} region - The region for the API request.
 * @param {number} start - The start index for the match list.
 * @param {number} count - The number of matches to fetch.
 * @returns {array} - The list of match IDs.
 */
const getMatchesByPuuid = async (puuid, region, start = 0, count = 20) => {
  try {
    const riotApi = createRiotApiInstanceLong(region, "match", "v5");
    logInfo(
      `Fetching matches for PUUID: ${puuid} in region ${region} from ${start} to ${count}`
    );
    const response = await riotApi.get(
      `/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`
    );
    logInfo(`Received matches by PUUID: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    logError(
      `Error fetching matches by PUUID: ${
        error.response ? JSON.stringify(error.response.data) : error.message
      }`
    );
    throw error;
  }
};

/**
 * Fetches match details for a match ID.
 *
 * @param {string} matchId - The ID of the match.
 * @param {string} region - The region for the API request.
 * @returns {object} - The match details.
 */
const getMatchDetails = async (matchId, region) => {
  try {
    const riotApi = createRiotApiInstanceLong(region, "match", "v5");
    logInfo(
      `Fetching match details for match ID: ${matchId} in region ${region}`
    );
    const response = await riotApi.get(`/matches/${matchId}`);
    logInfo(`Received match details: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    logError(
      `Error fetching match details: ${
        error.response ? JSON.stringify(error.response.data) : error.message
      }`
    );
    throw error;
  }
};

module.exports = {
  getAccountByRiotId,
  getSummonerByPuuid,
  getRankedStats,
  getRunesBySummonerId,
  getCurrentGameInfo,
  getMatchesByPuuid,
  getMatchDetails,
};
