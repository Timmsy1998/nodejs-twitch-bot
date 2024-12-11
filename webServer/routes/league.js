const { resolvePath } = require("../../pathHelper");
const {
  getAccountByRiotId,
  getSummonerByPuuid,
  getRankedStats,
} = require(resolvePath("chatBot/modules/api/lolAPIwrapper")); // Corrected path for Riot API
const { logError, logInfo } = require(resolvePath("logger.js")); // Shared logger from the root
const config = require(resolvePath("global.js")); // Import shared global configuration
const lolAccounts = require(resolvePath("dataStorage/lolAccounts.json")); // Adjusted path for LoL accounts JSON

const setupLeagueRoutes = (app) => {
  // Route to fetch rank information
  app.get("/rank", async (req, res) => {
    const accountName = req.query.account;
    const accountTag = req.query.tag;

    // Find the specified account in the stored accounts
    const account = lolAccounts.accounts.find(
      (acc) =>
        acc.name.toLowerCase() === accountName.toLowerCase() &&
        acc.tag.toLowerCase() === accountTag.toLowerCase()
    );

    if (!account) {
      logError(
        "webServer/logs",
        `Account not found: ${accountName}#${accountTag}`
      );
      return res.status(404).json({ error: "Account not found" });
    }

    try {
      logInfo(
        "webServer/logs",
        `Fetching rank information for account: ${account.name}#${account.tag} in region: ${account.region}`
      );

      // Fetch account data
      const accountData = await getAccountByRiotId(
        account.name,
        account.tag,
        account.region
      );
      logInfo(
        "webServer/logs",
        `Account data fetched: ${JSON.stringify(accountData)}`
      );
      const summonerData = await getSummonerByPuuid(
        accountData.puuid,
        account.region
      );
      logInfo(
        "webServer/logs",
        `Summoner data fetched: ${JSON.stringify(summonerData)}`
      );

      // Fetch rank information
      const rankInfo = await getRankedStats(summonerData.id, account.region);
      logInfo(
        "webServer/logs",
        `Rank information fetched: ${JSON.stringify(rankInfo)}`
      );

      // Helper function to get rank icon URL
      const getRankIconUrl = (tier) => {
        const tierLower = tier.toLowerCase();
        return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/${tierLower}.png`;
      };

      // Default rank data structure
      const defaultRankData = {
        tier: "UNRANKED",
        rank: "",
        leaguePoints: "",
        wins: 0,
        losses: 0,
        iconUrl: getRankIconUrl("UNRANKED"),
        winLoss: "Wins: 0, Losses: 0",
        winRate: "Win Rate: 0%",
      };

      // Extract solo queue rank information
      const soloQueue =
        rankInfo.find((rank) => rank.queueType === "RANKED_SOLO_5x5") ||
        defaultRankData;
      const flexQueue =
        rankInfo.find((rank) => rank.queueType === "RANKED_FLEX_SR") ||
        defaultRankData;

      const response = {
        soloQueue: {
          ...soloQueue,
          iconUrl: getRankIconUrl(soloQueue.tier),
          winLoss: `Wins: ${soloQueue.wins}, Losses: ${soloQueue.losses}`,
          winRate: `Win Rate: ${
            soloQueue.wins + soloQueue.losses > 0
              ? (
                  (soloQueue.wins / (soloQueue.wins + soloQueue.losses)) *
                  100
                ).toFixed(2)
              : 0
          }%`,
        },
        flexQueue: {
          ...flexQueue,
          iconUrl: getRankIconUrl(flexQueue.tier),
          winLoss: `Wins: ${flexQueue.wins}, Losses: ${flexQueue.losses}`,
          winRate: `Win Rate: ${
            flexQueue.wins + flexQueue.losses > 0
              ? (
                  (flexQueue.wins / (flexQueue.losses + flexQueue.wins)) *
                  100
                ).toFixed(2)
              : 0
          }%`,
        },
      };

      logInfo("webServer/logs", `Response data: ${JSON.stringify(response)}`);
      res.json(response);
    } catch (error) {
      logError(
        "webServer/logs",
        `Error fetching League of Legends rank information: ${error.message}`
      );
      res.status(500).json({
        error: "Error fetching rank information",
        details: error.message,
      });
    }
  });
};

module.exports = setupLeagueRoutes;
