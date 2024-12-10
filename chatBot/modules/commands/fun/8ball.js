const { logError, logInfo } = require("../../../../logger.js"); // Adjusted to import logger
const { checkPermissions } = require("../../handlers/permissionHandler"); // Adjusted path for permission handler
const { handleCooldowns } = require("../../handlers/cooldownHandler"); // Adjusted path for cooldown handler

const COOLDOWN_TIME = 5000; // 5 seconds cooldown

const responses = [
  "Yes. 👍",
  "No. 👎",
  "Definitely. ✅",
  "Absolutely not. ❌",
  "Maybe. 🤷",
  "Ask again later. ⏳",
  "I'm not sure, and honestly, I don't care. 😒",
  "Why are you even asking me this? 🤔",
  "What do you think? 🤨",
  "Without a doubt. 💯",
  "Do you really want to know? 🤭",
  "Don't count on it. 🙅",
  "It's a mystery to everyone. 🕵️",
  "You bet! 💪",
  "Fat chance. 🤣",
  "Nah, not happening. 🚫",
  "You must be joking. 😂",
  "Absolutely yes! 🎉",
  "No way, José. 🙅‍♂️",
  "I wouldn't hold my breath. 😤",
  "Hell yes! 🔥",
  "Hell no! ❄️",
  "Are you f***ing serious? 🤬",
  "Not in a million years. 🌌",
  "Get real. 🙄",
  "As if. 😜",
  "Sure, why not? 😎",
  "In your dreams. 💤",
  "Go for it. 🚀",
  "Don't even think about it. 😡",
  "You wish. 🌠",
  "Not a chance. 🧐",
  "F*** yeah! 💥",
  "F*** no! 🚫",
  "Who the hell knows? 😵",
  "Ask someone who cares. 🙃",
  "Why the f*** not? 🤷",
  "Not a snowball's chance in hell. 🔥❄️",
  "Absolutely f***ing not. ❌",
  "You gotta be kidding me. 🤪",
  "Sure thing, buddy. 👍",
  "Nope, not today. 🙅‍♀️",
  "Does a bear s*** in the woods? 🐻💩",
  "Is the Pope Catholic? ⛪",
  "When pigs fly. 🐷✈️",
  "Over my dead body. 💀",
  "Only if you pay me. 💰",
  "Not even if you begged. 🙅‍♂️",
  "In your wildest dreams. 🌌",
  "Go ask your mom. 🤱",
  "Do I look like I care? 😤",
  "Why don't you figure it out? 🤨",
  "Not a f***ing chance. ❌",
  "You must be out of your mind. 🤯",
  "Yeah, and I'm the Queen of England. 🇬🇧",
  "Sure, and monkeys might fly out of my butt. 🙊🍑",
  "Only if hell freezes over. ❄️🔥",
  "Why don't you make like a tree and leave? 🌳🍃",
  "Go jump in a lake. 🏊‍♂️",
  "Not in this lifetime. ⏳",
  "You wish, pal. 🌠",
  "Get lost. 🚶‍♂️",
  "Don't hold your breath. 😤",
  "Yeah, right. 🤥",
  "Dream on. 💭",
  "Not if my life depended on it. 😵",
  "Ask me if I care. 🙃",
  "Go pound sand. 🏖️",
  "Not a snowball's chance in hell. 🔥❄️",
  "When hell freezes over. ❄️🔥",
  "Go take a hike. 🏞️",
  "Not in a million years. 🌌",
  "Why don't you take a long walk off a short pier? 🌉",
  "Go fly a kite. 🪁",
  "Not if you paid me. 💰",
  "Why don't you go play in traffic? 🚗",
  "Not in your wildest dreams. 🌌",
  "Go jump off a cliff. 🧗",
  "Not if you were the last person on earth. 🌎",
  "Why don't you go suck an egg? 🥚",
  "Absolutely! 🌟",
  "You got this! 💪",
  "It's your lucky day! 🍀",
  "Go for it, champ! 🏆",
  "The stars are aligned. ✨",
  "Today is your day! ☀️",
  "You're unstoppable. 🛡️",
  "Success is inevitable. 🏆",
  "Keep pushing, you're almost there! 🚀",
  "Nothing can stop you now. 🛡️",
  "Believe in yourself. 🌟",
  "You're on the right track. 🚉",
  "It's a yes from me. ✔️",
  "Count on it. 📆",
  "Victory is yours. 🏆",
  "You're destined for greatness. 🌟",
  "Good things are coming your way. 🌈",
  "You've got the green light. 🚦",
  "Make it happen! ✨",
];

module.exports = {
  name: "8ball",
  description: "Ask the Magic 8 Ball a question.",
  category: "Fun",
  aliases: ["!8ball"],

  /**
   * Executes the 8ball command.
   *
   * @param {object} client - The Twitch client instance.
   * @param {string} channel - The channel where the message was sent.
   * @param {object} tags - The user tags associated with the message.
   * @param {string} args - The command arguments.
   */
  async execute(client, channel, tags, args) {
    logInfo(`8ball command called by ${tags.username}.`);

    // Check if the user has the required permissions (Viewers have access by default)
    if (!checkPermissions(tags, "viewer")) {
      client.say(
        channel,
        `@${tags.username}, you do not have permission to use this command. 🚫`
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
      const question = args.trim();
      if (!question) {
        client.say(channel, `@${tags.username}, please ask a question. ❓`);
        return;
      }

      const randomIndex = Math.floor(Math.random() * responses.length);
      const answer = responses[randomIndex];
      logInfo(`8ball answer: ${answer}`);

      client.say(
        channel,
        `@${tags.username}, the Magic 8 Ball says: ${answer} 🎱`
      );
    } catch (error) {
      logError(`Error fetching 8ball answer: ${error.message} ❌`);
      client.say(
        channel,
        `@${tags.username}, there was an error getting the Magic 8 Ball response. ❌`
      );
    }
  },
};
