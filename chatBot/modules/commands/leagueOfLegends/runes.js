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
const { getAccountByRiotId, getCurrentGameInfo } = require(resolvePath(
  "chatBot/modules/api/lolAPIwrapper"
)); // Adjusted path for Riot API

const accountsFilePath = resolvePath("dataStorage/lolAccounts.json");

const COOLDOWN_TIME = 30000; // 30 seconds cooldown

const perkNames = {
  8005: "Press the Attack",
  8008: "Lethal Tempo",
  8021: "Fleet Footwork",
  8010: "Conqueror",
  9101: "Overheal",
  9111: "Triumph",
  8009: "Presence of Mind",
  9104: "Legend: Alacrity",
  9105: "Legend: Tenacity",
  9103: "Legend: Bloodline",
  8014: "Coup de Grace",
  8017: "Cut Down",
  8299: "Last Stand",
  8124: "Predator",
  8128: "Dark Harvest",
  9923: "Hail of Blades",
  8126: "Cheap Shot",
  8139: "Taste of Blood",
  8143: "Sudden Impact",
  8136: "Zombie Ward",
  8120: "Ghost Poro",
  8138: "Eyeball Collection",
  8135: "Ravenous Hunter",
  8134: "Ingenious Hunter",
  8105: "Relentless Hunter",
  8106: "Ultimate Hunter",
  8351: "Glacial Augment",
  8360: "Unsealed Spellbook",
  8358: "Master Key",
  8359: "Hextech Flashtraption",
  8306: "Perfect Timing",
  8304: "Future's Market",
  8313: "Minion Dematerializer",
  8321: "Biscuit Delivery",
  8316: "Magical Footwear",
  8345: "Cosmic Insight",
  8347: "Approach Velocity",
  8410: "Celestial Body",
  8352: "Time Warp Tonic",
  8214: "Summon Aery",
  8229: "Arcane Comet",
  8230: "Phase Rush",
  8224: "Nullifying Orb",
  8226: "Manaflow Band",
  8243: "Nimbus Cloak",
  8210: "Transcendence",
  8234: "Celerity",
  8319: "Absolute Focus",
  8233: "Scorch",
  8237: "Waterwalking",
  8232: "Gathering Storm",
  8437: "Grasp of the Undying",
  8439: "Aftershock",
  8465: "Guardian",
  8446: "Demolish",
  8463: "Font of Life",
  8401: "Shield Bash",
  8429: "Conditioning",
  8444: "Second Wind",
  8473: "Bone Plating",
  8451: "Overgrowth",
  8453: "Revitalize",
  8242: "Unflinching",
  5001: "Health Scaling",
  5002: "Armor",
  5003: "Magic Resist",
  5005: "Attack Speed",
  5007: "CDR Scaling",
  5008: "Adaptive Force",
};

const formatRunes = (runes) => {
  const primaryStyle = perkNames[runes.perkStyle];
  const subStyle = perkNames[runes.perkSubStyle];
  const perkNamesList = runes.perkIds.map((id) => perkNames[id] || id);

  return `
**Primary Style:** ${primaryStyle}
  - ${perkNamesList.slice(0, 4).join("\n  - ")}

**Sub Style:** ${subStyle}
  - ${perkNamesList.slice(4, 6).join("\n  - ")}

**Stat Shards:**
  - ${perkNamesList.slice(6).join("\n  - ")}
  `;
};

module.exports = {
  name: "runes",
  description:
    "Displays the current rune page of the first account that is in a live game.",
  keywords: ["runes", "current runes"],
  category: "League of Legends",
  modOnly: false,
  broadcasterOnly: false,

  /**
   * Executes the runes command.
   *
   * @param {object} client - The Twitch client instance.
   * @param {string} channel - The channel where the message was sent.
   * @param {object} tags - The user tags associated with the message.
   * @param {string} args - The command arguments.
   */
  async execute(client, channel, tags, args) {
    const commandName = "runes";

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

          const gameInfo = await getCurrentGameInfo(
            accountData.puuid,
            account.region
          );
          logInfo(`Game info: ${JSON.stringify(gameInfo)}`);

          if (gameInfo && gameInfo.gameId) {
            const participant = gameInfo.participants.find(
              (p) => p.puuid === accountData.puuid
            );

            if (participant) {
              const runes = participant.perks;
              logInfo(`Current runes: ${JSON.stringify(runes)}`);

              const formattedRunes = formatRunes(runes);
              client.say(
                channel,
                `@${tags.username}, current runes for ${account.name}#${account.tag} (${account.region}) in a live game:\n${formattedRunes}`
              );
              return; // Exit the loop after finding the first account in a live game
            }
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

      client.say(
        channel,
        `@${tags.username}, no accounts are currently in a live game.`
      );
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
