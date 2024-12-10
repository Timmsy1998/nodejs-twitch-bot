module.exports = {
  apps: [
    {
      name: "chatBot",
      script: "chatBot/main.js",
      watch: true,
    },
    {
      name: "webServer",
      script: "webServer/main.js",
      watch: true,
    },
  ],
};
