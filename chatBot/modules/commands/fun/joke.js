const { resolvePath } = require("../../../../pathHelper"); // Importing resolvePath from pathHelper.js
const { logError, logInfo } = require(resolvePath("logger.js")); // Adjusted to import logger
const { checkPermissions } = require(resolvePath(
  "chatBot/modules/handlers/permissionHandler"
)); // Adjusted path for permission handler
const { handleCooldowns } = require(resolvePath(
  "chatBot/modules/handlers/cooldownHandler"
)); // Adjusted path for cooldown handler

const COOLDOWN_TIME = 5000; // 5 seconds cooldown

const jokes = [
  // General and Dad Jokes
  "Why don't scientists trust atoms? Because they make up everything! 🤣",
  "Why did the scarecrow win an award? Because he was outstanding in his field! 🌾",
  "I told my wife she was drawing her eyebrows too high. She looked surprised. 😲",
  "Did you hear about the mathematician who’s afraid of negative numbers? He will stop at nothing to avoid them. 🧮",
  "Why don’t skeletons fight each other? They don’t have the guts. 💀",
  "I'm reading a book on anti-gravity. It's impossible to put down! 📚",
  "What do you call fake spaghetti? An impasta. 🍝",
  "Why did the bicycle fall over? Because it was two-tired! 🚲",
  "I would tell you a joke about an elevator, but it's an uplifting experience. 🚀",
  "Why was the math book sad? It had too many problems. 📖",
  "Parallel lines have so much in common. It’s a shame they’ll never meet. ➖➖",
  "Why don't some couples go to the gym? Because some relationships don't work out. 💪",
  "How do you organize a space party? You planet. 🌌",
  "I told my computer I needed a break, and now it won’t stop sending me Kit Kats. 🍫",
  "Why did the golfer bring two pairs of pants? In case he got a hole in one. ⛳",
  "Why don’t you ever see elephants hiding in trees? Because they’re so good at it. 🐘",
  "Why do cows have hooves instead of feet? Because they lactose. 🐄",
  "What do you call a bear with no teeth? A gummy bear. 🧸",
  "Why was the big cat disqualified from the race? Because it was a cheetah. 🐆",
  "Why don't eggs tell jokes? They'd crack each other up. 🥚",
  "I asked the librarian if the library had any books on paranoia. She whispered, 'They're right behind you.' 📚",
  "Why was the sand wet? Because the sea weed. 🌊",
  "Why don't some fish play piano? Because you can't tuna fish. 🎹",
  "I’d tell you a chemistry joke, but I know I wouldn’t get a reaction. 🧪",
  "Why are ghosts bad at lying? Because you can see right through them. 👻",
  "What’s orange and sounds like a parrot? A carrot! 🥕",
  "Why don’t crabs donate to charity? Because they’re shellfish. 🦀",
  "Why was the computer cold? It left its Windows open. 💻",
  "Why do ducks have tail feathers? To cover their butt quacks. 🦆",
  "Why do bananas have to put on sunscreen before they go to the beach? Because they might peel! 🍌",
  "Why did the tomato turn red? Because it saw the salad dressing! 🍅",
  "Why don't we ever tell secrets on a farm? Because the potatoes have eyes and the corn has ears! 🥔🌽",
  "Why did the music teacher need a ladder? To reach the high notes. 🎼",
  "What do you call cheese that isn't yours? Nacho cheese. 🧀",
  "Why did the coffee file a police report? It got mugged. ☕",
  "How does a penguin build its house? Igloos it together. 🐧",
  "Why did the belt go to jail? For holding up a pair of pants. 👖",
  "Why did the invisible man turn down the job offer? He couldn't see himself doing it. 👻",
  "What’s brown and sticky? A stick. 🌳",
  "I would avoid the sushi if I was you. It’s a little fishy. 🍣",
  "Want to hear a joke about construction? I'm still working on it. 🏗️",
  "I used to be a baker, but I couldn’t make enough dough. 🍞",
  "What do you call an alligator in a vest? An investigator. 🐊",
  "Why don’t scientists trust stairs? Because they’re always up to something. 🧗‍♂️",
  "Why did the cookie cry? Because his mother was a wafer so long. 🍪",
  "What’s a skeleton’s least favorite room in the house? The living room. 🏠💀",
  "How do you make a tissue dance? Put a little boogie in it. 🤧",
  "What do you call fake noodles? An impasta. 🍝",
  "Did you hear about the circus fire? It was in tents. 🎪",
  "What did the buffalo say to his son when he left for college? Bison. 🦬",
  "Why did the coach go to the bank? To get his quarterback. 🏈",
  "How does a snowman get around? By riding an “icicle.” ⛄🚴‍♂️",

  // British Jokes
  "Why did the British student bring a ladder to school? Because he wanted to go to high school! 🎓",
  "How do you know the British Museum is old? It has so many ancient artifacts that even the dust is on display. 🏛️",
  "Why do British people love tea? Because it's steamy and hot, like their weather isn't! ☕",
  "Why don’t the British make good chefs? Because they can’t handle the heat! 🍳",
  "Why did the British man cross the road? To get to the chip shop on the other side. 🍟",
  "Why did the British man go to the dentist? To get his “t” fixed. 🦷",
  "Why did the queen go to the dentist? To get her crown checked! 👑",
  "Why are British people always calm? Because they drink a lot of “calmomile” tea. 🌼",

  // League of Legends Jokes
  "Why did the ADC bring a ladder to the game? To climb the ELO ladder! 🪜",
  "Why don't junglers play hide and seek? Because good luck hiding from a Rengar main! 😈",
  "Why did Yasuo go to school? To learn how to get a real job. 😂",
  "Why don’t League players ever get lost? Because they always have their map awareness. 🗺️",
  "Why was the minion sad? Because it couldn’t get a last hit. 😢",
  "Why did the support carry the ADC? Because they needed a carry-van! 🚌",
  "Why did Teemo cross the road? To step on his own shroom. 🍄",
  "Why is Zed so good at gardening? Because he has shadow clones to do all the work! 🥷",

  // Gaming Jokes
  "Why did the gamer cross the road? To get to the next level. 🎮",
  "Why do gamers hate nature? Too many bugs. 🦟",
  "Why did Mario break up with Princess Peach? Because she found someone a-peel-ing. 🍑",
  "Why did the console gamer throw his controller? He couldn’t handle the resolution. 🎮",
  "Why don’t gamers play hide and seek? Because good luck hiding from a wallhacker! 🕵️",
  "Why did the scarecrow become a gamer? Because he was outstanding in his field. 🌾",
  "Why do gamers always look up to the sky? Because they're always looking for lag compensation. 🌐",
  "Why was the gamer good at math? Because he could multi-play. ➗",
  "Why did the PC gamer stay home from the party? He didn’t want to be a console-table loser. 💻",

  // Rude/Vulgar Jokes
  "Why don't oysters donate to charity? Because they are shellfish bastards. 🦪",
  "Why don't scientists trust atoms? Because they make up all the bullshit. 🤣",
  "Why did the scarecrow win an award? Because he was outstanding in his damn field! 🌾",
  "Why did the golfer bring two pairs of pants? In case he got a hole in one, dumbass. ⛳",
  "Why don’t skeletons fight each other? They don’t have the guts, those spineless wimps. 💀",
  "Why did the tomato turn red? Because it saw the salad dressing, you perv! 🍅",
  "Why do cows have hooves instead of feet? Because they lactose, you idiot. 🐄",
  "Why did the coffee file a police report? It got mugged, you moron. ☕",
  "Why did the bicycle fall over? Because it was two-tired of your shit! 🚲",
  "Why don’t you ever see elephants hiding in trees? Because they’re so damn good at it. 🐘",
];

module.exports = {
  name: "joke",
  description: "Get a random joke.",
  category: "Fun",
  aliases: ["!joke", "!jotd"],

  /**
   * Executes the joke command.
   *
   * @param {object} client - The Twitch client instance.
   * @param {string} channel - The channel where the message was sent.
   * @param {object} tags - The user tags associated with the message.
   * @param {string} args - The command arguments.
   */
  async execute(client, channel, tags, args) {
    logInfo(`Joke command called by ${tags.username}.`);

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
      // Get a random joke
      const randomIndex = Math.floor(Math.random() * jokes.length);
      const joke = jokes[randomIndex];
      logInfo(`Joke: ${joke}`);

      client.say(channel, `@${tags.username}, here's your joke: ${joke} 😂`);
    } catch (error) {
      logError(`Error fetching joke: ${error.message} ❌`);
      client.say(
        channel,
        `@${tags.username}, there was an error getting the joke. ❌`
      );
    }
  },
};
