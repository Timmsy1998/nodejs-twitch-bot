const axios = require("axios");
const fs = require("fs");
const { resolvePath } = require("../../../../pathHelper"); // Importing resolvePath from pathHelper.js
const config = require(resolvePath("global.js")); // Adjusted to import global configurations
const { logError, logInfo } = require(resolvePath("logger.js")); // Adjusted to import logger
const { checkPermissions } = require(resolvePath(
  "chatBot/modules/handlers/permissionHandler"
)); // Adjusted path for permission handler
const { handleCooldowns } = require(resolvePath(
  "chatBot/modules/handlers/cooldownHandler"
)); // Adjusted path for cooldown handler
const {
  getAccountByRiotId,
  getSummonerByPuuid,
  getRankedStats,
} = require(resolvePath("chatBot/modules/api/lolAPIwrapper")); // Adjusted path for Riot API

const accountsFilePath = resolvePath("dataStorage/lolAccounts.json");

const COOLDOWN_TIME = 30000; // 30 seconds cooldown

const rankTiers = {
  IRON: 1,
  BRONZE: 2,
  SILVER: 3,
  GOLD: 4,
  PLATINUM: 5,
  DIAMOND: 6,
  MASTER: 7,
  GRANDMASTER: 8,
  CHALLENGER: 9,
};

const divisionIndex = ["IV", "III", "II", "I"];

const rankOrder = (tier, rank) => {
  if (!rankTiers[tier]) return -1;
  return (rankTiers[tier] - 1) * 4 + divisionIndex.indexOf(rank);
};

module.exports = {
  name: "rank",
  description: "Displays the rank and LP of the highest elo account.",
  aliases: ["!rank", "!myrank"],
  keywords: ["rank", "what rank are you"],
  category: "League of Legends",

  /**
   * Executes the rank command.
   *
   * @param {object} client - The Twitch client instance.
   * @param {string} channel - The channel where the message was sent.
   * @param {object} tags - The user tags associated with the message.
   * @param {string} args - The command arguments.
   */
  async execute(client, channel, tags, args) {
    const commandName = "rank";

    // Check if the user has the required permissions (Viewers have access by default)
    if (!checkPermissions(tags, "viewer")) {
      client.say(
        channel,
        `@${tags.username}, you don't have permission to use this command. 🚫`
      );
      return;
    }

    // Check if the command is on cooldown for the user
    if (
      handleCooldowns(client, channel, this.name, tags.username, COOLDOWN_TIME)
    ) {
      return; // Exit if the command is on cooldown
    }

    try {
      const accountsData = JSON.parse(
        fs.readFileSync(accountsFilePath, "utf8")
      );
      let highestRank = null;

      for (const account of accountsData.accounts) {
        logInfo(
          `Fetching data for account: ${account.name}#${account.tag} (${account.region})`
        );

        try {
          const accountData = await getAccountByRiotId(
            account.name,
            account.tag,
            account.region
          );
          logInfo(`Account data: ${JSON.stringify(accountData)}`);

          const summonerData = await getSummonerByPuuid(
            accountData.puuid,
            account.region
          );
          logInfo(`Summoner data: ${JSON.stringify(summonerData)}`);

          const rankedStats = await getRankedStats(
            summonerData.id,
            account.region
          );
          logInfo(`Ranked stats: ${JSON.stringify(rankedStats)}`);

          if (rankedStats.length > 0) {
            const { tier, rank, leaguePoints } = rankedStats[0];
            const currentRank = {
              account: `${account.name}#${account.tag}`,
              tier,
              rank,
              leaguePoints,
              region: account.region,
              rankOrder: rankOrder(tier, rank),
            };

            if (
              !highestRank ||
              currentRank.rankOrder > highestRank.rankOrder ||
              (currentRank.rankOrder === highestRank.rankOrder &&
                leaguePoints > highestRank.leaguePoints)
            ) {
              highestRank = currentRank;
            }
          }
        } catch (error) {
          logError(
            `Error fetching data for account: ${account.name}#${account.tag} (${account.region})`
          );
          logError(
            `API Error: ${
              error.response
                ? JSON.stringify(error.response.data)
                : error.message
            }`
          );
        }
      }

      if (highestRank) {
        client.say(
          channel,
          `@${tags.username}, the highest elo account is ${highestRank.account} (${highestRank.region}) at ${highestRank.tier} ${highestRank.rank} with ${highestRank.leaguePoints} LP.`
        );
      } else {
        client.say(
          channel,
          `@${tags.username}, no ranked data found for the accounts.`
        );
      }
    } catch (error) {
      logError(
        `Error fetching rank data: ${
          error.response ? JSON.stringify(error.response.data) : error.message
        }`
      );
      client.say(
        channel,
        `@${tags.username}, there was an error fetching the rank data. ❌`
      );
    }
  },
};
