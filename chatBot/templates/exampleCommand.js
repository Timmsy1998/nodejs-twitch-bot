const {
  axios,
  logError,
  logInfo,
  config,
  setCooldown,
  isOnCooldown,
  fs,
  path,
} = require("../utils/globals");

module.exports = {
  name: "exampleCommand",
  description: "A template for creating new commands",
  aliases: ["!example", "!ex"],
  keywords: ["example", "template", "command"],
  category: "League of Legends",
  async execute(client, channel, tags, args) {
    logInfo(`Executing exampleCommand for ${tags.username}`);

    try {
      // Command Logic Here

      // Example: Responding to a user message
      const userMessage = args.trim();
      if (!userMessage) {
        client.say(channel, "Please provide a message.");
        return;
      }

      // Example: Performing an API request
      const response = await axios.get("https://api.example.com/data", {
        params: {
          query: userMessage,
        },
      });

      const data = response.data;
      client.say(channel, `Received data: ${data.result}`);

      // Example: Handling errors
    } catch (error) {
      logError(`Error executing exampleCommand:`, error);
      client.say(channel, "An error occurred while processing your request.");
    }
  },
};
