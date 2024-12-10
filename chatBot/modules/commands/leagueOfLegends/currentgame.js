const axios = require("axios");
const fs = require("fs");
const path = require("path");
const config = require("../../../../global.js"); // Adjusted to import global configurations
const { logError, logInfo } = require("../../../../logger.js"); // Adjusted to import logger
const { checkPermissions } = require("../../handlers/permissionHandler"); // Adjusted path for permission handler
const { handleCooldowns } = require("../../handlers/cooldownHandler"); // Adjusted path for cooldown handler
const {
  getAccountByRiotId,
  getSummonerByPuuid,
  getCurrentGameInfo,
  getRankedStats,
} = require("../../api/lolAPIwrapper"); // Adjusted path for Riot API

const accountsFilePath = path.join(
  __dirname,
  "../../../../dataStorage/lolAccounts.json"
);

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

const unrankedScore = -1; // Adjusting to ensure unranked is handled

const getRankName = (score) => {
  if (score === unrankedScore) return "UNRANKED";
  const tiers = Object.keys(rankTiers);
  const tierIndex = Math.floor(score / 4);
  const rankIndex = score % 4;
  if (tierIndex < 0 || tierIndex >= tiers.length) return "UNRANKED";
  return `${tiers[tierIndex]} ${divisionIndex[rankIndex]}`;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = {
  name: "currentgame",
  description: "Displays the average rank of Timmsy's Current Game.",
  keywords: ["current game", "game status"],
  category: "League of Legends",

  /**
   * Executes the currentgame command.
   *
   * @param {object} client - The Twitch client instance.
   * @param {string} channel - The channel where the message was sent.
   * @param {object} tags - The user tags associated with the message.
   * @param {string} args - The command arguments.
   */
  async execute(client, channel, tags, args) {
    const commandName = "currentgame";

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
      let foundGame = false;

      for (const account of accountsData.accounts) {
        logInfo(
          `Checking if account is in a game: ${account.name} - ${account.tag} (${account.region})`
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

          const gameInfo = await getCurrentGameInfo(
            summonerData.puuid,
            account.region
          );
          logInfo(`Game info: ${JSON.stringify(gameInfo)}`);

          if (gameInfo && gameInfo.gameId) {
            foundGame = true;
            const teamRanks = { blue: [], red: [] };

            for (const participant of gameInfo.participants) {
              const summonerName =
                participant.summonerName || participant.summonerId;
              logInfo(`Checking participant: ${summonerName}`);

              await delay(200); // Add a delay between API calls

              const rankedStats = await getRankedStats(
                participant.summonerId,
                account.region
              );
              logInfo(
                `Ranked stats for ${summonerName}: ${JSON.stringify(
                  rankedStats
                )}`
              );

              let rankScore;
              if (rankedStats.length > 0) {
                const soloQueue = rankedStats.find(
                  (rank) => rank.queueType === "RANKED_SOLO_5x5"
                ) || {
                  tier: "UNRANKED",
                  rank: "IV",
                };
                rankScore = rankOrder(soloQueue.tier, soloQueue.rank);
              } else {
                rankScore = unrankedScore;
              }

              logInfo(`Rank score for ${summonerName}: ${rankScore}`);

              if (participant.teamId === 100) {
                teamRanks.blue.push(rankScore);
              } else {
                teamRanks.red.push(rankScore);
              }
            }

            const blueTeamAvg =
              teamRanks.blue.reduce((a, b) => a + b, 0) / teamRanks.blue.length;
            const redTeamAvg =
              teamRanks.red.reduce((a, b) => a + b, 0) / teamRanks.red.length;
            const gameAvg =
              teamRanks.blue.concat(teamRanks.red).reduce((a, b) => a + b, 0) /
              (teamRanks.blue.length + teamRanks.red.length);

            logInfo(`Blue Team Avg Score: ${blueTeamAvg}`);
            logInfo(`Red Team Avg Score: ${redTeamAvg}`);
            logInfo(`Game Avg Score: ${gameAvg}`);

            const blueTeamRank = getRankName(Math.round(blueTeamAvg));
            const redTeamRank = getRankName(Math.round(redTeamAvg));
            const gameRank = getRankName(Math.round(gameAvg));

            logInfo(`Blue Team Rank: ${blueTeamRank}`);
            logInfo(`Red Team Rank: ${redTeamRank}`);
            logInfo(`Game Rank: ${gameRank}`);

            client.say(
              channel,
              `@${tags.username}, Blue Team Average Rank: ${blueTeamRank} || Red Team Average Rank: ${redTeamRank} || Average Game Rank: ${gameRank}`
            );

            setCooldown(commandName, COOLDOWN_TIME);
            return; // Exit the loop after finding the first account in a live game
          }
        } catch (error) {
          logError(
            `Error checking account: ${account.name} - ${account.tag} (${account.region})`
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

      if (!foundGame) {
        client.say(
          channel,
          `@${tags.username}, no accounts are currently in a live game.`
        );
      }
    } catch (error) {
      logError(
        `Error checking accounts: ${
          error.response ? JSON.stringify(error.response.data) : error.message
        }`
      );
      client.say(
        channel,
        `@${tags.username}, there was an error checking the accounts.`
      );
    }
  },
};
