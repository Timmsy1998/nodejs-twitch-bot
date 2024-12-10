const fs = require("fs");
const { exec } = require("child_process");
const inquirer = require("inquirer");
const axios = require("axios");
const express = require("express");
const bodyParser = require("body-parser");
const qs = require("qs");
const { resolvePath } = require("./pathHelper");

// Directory for dataStorage
const dataStorageDir = resolvePath("dataStorage");

// Files to be created in dataStorage with initial content
const filesToCreate = {
  "followage.json": {
    followers: {},
  },
  "lolAccounts.json": {
    accounts: [],
  },
  "quotes.json": {
    quotes: [],
  },
};

// Ensure dataStorage directory exists
if (!fs.existsSync(dataStorageDir)) {
  fs.mkdirSync(dataStorageDir, { recursive: true });
}

// Create necessary files in dataStorage with initial content
Object.entries(filesToCreate).forEach(([file, content]) => {
  const filePath = path.join(dataStorageDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf8");
    console.log(`Created ${file}`);
  } else {
    console.log(`${file} already exists`);
  }
});

// Function to run npm install in specified directories
const runNpmInstall = async (dir) => {
  return new Promise((resolve, reject) => {
    console.log(`Running npm install in ${dir}...`);
    exec("npm install", { cwd: resolvePath(dir) }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running npm install in ${dir}: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`npm install stderr in ${dir}: ${stderr}`);
      }
      console.log(`npm install stdout in ${dir}: ${stdout}`);
      resolve();
    });
  });
};

// Function to install pm2 globally
const installPM2 = () => {
  return new Promise((resolve, reject) => {
    console.log("Installing pm2 globally...");
    exec("npm install -g pm2", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error installing pm2: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`pm2 install stderr: ${stderr}`);
      }
      console.log(`pm2 install stdout: ${stdout}`);
      resolve();
    });
  });
};

// Function to start the Express server with pm2
const startExpressServer = async () => {
  console.log("Starting Express server with pm2...");
  exec(
    'pm2 start webServer/main.js --name "webServer"',
    (error, stdout, stderr) => {
      if (error) {
        console.error(`Error starting Express server: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Express server start stderr: ${stderr}`);
      }
      console.log(`Express server start stdout: ${stdout}`);
      collectEnvVariables();
    }
  );
};

// Run npm install in all directories, install pm2 globally, and start the Express server
const setup = async () => {
  try {
    await installPM2();
    const directoriesToInstall = [".", "chatBot", "webServer"];
    for (const dir of directoriesToInstall) {
      await runNpmInstall(dir);
    }
    startExpressServer();
  } catch (error) {
    console.error(`Setup error: ${error.message}`);
  }
};

// Start the setup process
setup();

// Function to collect environment variables from the user
const collectEnvVariables = async () => {
  console.log("Collecting environment variables...");

  const initialQuestions = [
    // Prompt for Twitch Bot Username
    {
      type: "input",
      name: "BOT_USERNAME",
      message: "Enter your Twitch Bot Username:",
    },
    // Prompt for Twitch Client ID
    {
      type: "input",
      name: "CLIENT_ID",
      message:
        "Enter your Twitch Client ID (from the Twitch Developer Dashboard):",
    },
    // Prompt for Twitch Broadcaster Username
    {
      type: "input",
      name: "BROADCASTER_USERNAME",
      message: "Enter your Twitch Broadcaster Username:",
    },
    // Prompt for Redirect URI
    {
      type: "input",
      name: "REDIRECT_URI",
      message:
        "Enter your Redirect URI (default: http://localhost:3000/callback):",
      default: "http://localhost:3000/callback",
    },
    // Prompt for Riot API Key (optional)
    {
      type: "input",
      name: "RIOT_API_KEY",
      message: "Enter your Riot API Key (optional):",
      default: "",
    },
    // Prompt for Spotify Redirect URI
    {
      type: "input",
      name: "SPOTIFY_REDIRECT_URI",
      message:
        "Enter your Spotify Redirect URI (default: http://localhost:3000/spotify-callback):",
      default: "http://localhost:3000/spotify-callback",
    },
    // Prompt for Spotify Client ID (optional)
    {
      type: "input",
      name: "SPOTIFY_CLIENT_ID",
      message: "Enter your Spotify Client ID (optional):",
      default: "",
    },
    // Prompt for Spotify Client Secret (optional)
    {
      type: "input",
      name: "SPOTIFY_CLIENT_SECRET",
      message: "Enter your Spotify Client Secret (optional):",
      default: "",
    },
  ];

  // Collect initial answers
  const initialAnswers = await inquirer.prompt(initialQuestions);

  // Prompt for Twitch Bot Token after Client ID has been provided
  const tokenQuestions = [
    {
      type: "input",
      name: "BOT_TOKEN",
      message: "Enter your Twitch Bot Token:",
    },
  ];

  // Collect token answers
  const tokenAnswers = await inquirer.prompt(tokenQuestions);

  // Combine initial and token answers into one object
  const answers = { ...initialAnswers, ...tokenAnswers };

  // Retrieve Broadcaster ID and Token using the provided Client ID and Redirect URI
  const { CLIENT_ID, REDIRECT_URI, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } =
    answers;
  const twitchAuthUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=token&scope=channel:read:subscriptions+channel:manage:broadcast+chat:edit+chat:read`;

  console.log(
    `\nPlease authorize the application by visiting the following URL: ${twitchAuthUrl}`
  );
  console.log(
    "After authorizing, please enter the access token provided in the URL.\n"
  );

  // Prompt for Broadcaster Token after authorization
  const tokenQuestion = [
    {
      type: "input",
      name: "BROADCASTER_TOKEN",
      message: "Enter the access token:",
    },
  ];

  // Collect Broadcaster Token answer
  const tokenAnswer = await inquirer.prompt(tokenQuestion);

  let spotifyTokens = {
    SPOTIFY_TOKEN: "",
    SPOTIFY_REFRESH_TOKEN: "",
  };

  // If Spotify Client ID and Secret are provided, proceed with Spotify token collection
  if (SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET) {
    const spotifyAuthUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${answers.SPOTIFY_REDIRECT_URI}&scope=user-read-playback-state user-modify-playback-state user-read-currently-playing`;

    console.log(
      `\nPlease authorize the application by visiting the following URL: ${spotifyAuthUrl}`
    );
    console.log(
      "After authorizing, please enter the authorization code provided in the URL.\n"
    );

    // Prompt for Spotify authorization code
    const spotifyCodeQuestion = [
      {
        type: "input",
        name: "SPOTIFY_CODE",
        message: "Enter the authorization code:",
      },
    ];

    // Collect Spotify authorization code answer
    const spotifyCodeAnswer = await inquirer.prompt(spotifyCodeQuestion);

    try {
      // Exchange authorization code for Spotify tokens
      const spotifyResponse = await axios({
        method: "post",
        url: "https://accounts.spotify.com/api/token",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        data: new URLSearchParams({
          grant_type: "authorization_code",
          code: spotifyCodeAnswer.SPOTIFY_CODE,
          redirect_uri: answers.SPOTIFY_REDIRECT_URI,
          client_id: SPOTIFY_CLIENT_ID,
          client_secret: SPOTIFY_CLIENT_SECRET,
        }),
      });

      // Store Spotify tokens in the object
      spotifyTokens = {
        SPOTIFY_TOKEN: spotifyResponse.data.access_token,
        SPOTIFY_REFRESH_TOKEN: spotifyResponse.data.refresh_token,
      };
    } catch (error) {
      console.error(`Error fetching Spotify tokens: ${error.message}`);
    }
  }

  // Prepare content for .env file
  const envContent = `
# Twitch Configuration
BOT_USERNAME=${answers.BOT_USERNAME}
BOT_TOKEN=${answers.BOT_TOKEN}
CLIENT_ID=${answers.CLIENT_ID}
BROADCASTER_USERNAME=${answers.BROADCASTER_USERNAME}
BROADCASTER_TOKEN=${tokenAnswer.BROADCASTER_TOKEN}
REDIRECT_URI=${answers.REDIRECT_URI}

# Riot Games API Configuration
RIOT_API_KEY=${answers.RIOT_API_KEY}

# Spotify Configuration
SPOTIFY_REDIRECT_URI=${answers.SPOTIFY_REDIRECT_URI}
SPOTIFY_CLIENT_ID=${answers.SPOTIFY_CLIENT_ID}
SPOTIFY_CLIENT_SECRET=${answers.SPOTIFY_CLIENT_SECRET}
SPOTIFY_TOKEN=${spotifyTokens.SPOTIFY_TOKEN}
SPOTIFY_REFRESH_TOKEN=${spotifyTokens.SPOTIFY_REFRESH_TOKEN}
  `;

  // Write the .env file with collected environment variables
  fs.writeFileSync(resolvePath(".env"), envContent.trim(), "utf8");
  console.log(".env file has been created successfully!");

  // Fetch Broadcaster ID using the provided token
  try {
    const response = await axios.get("https://api.twitch.tv/helix/users", {
      headers: {
        "Client-ID": CLIENT_ID,
        Authorization: `Bearer ${tokenAnswer.BROADCASTER_TOKEN}`,
      },
    });

    const broadcasterId = response.data.data[0].id;
    console.log(`Broadcaster ID: ${broadcasterId}`);

    // Update the .env file with the Broadcaster ID
    const updatedEnvContent =
      envContent.trim() + `\nBROADCASTER_ID=${broadcasterId}`;
    fs.writeFileSync(resolvePath(".env"), updatedEnvContent, "utf8");
    console.log("Broadcaster ID has been added to the .env file successfully!");
  } catch (error) {
    console.error(`Error fetching Broadcaster ID: ${error.message}`);
  }
};

// Start running npm install process
setup();
