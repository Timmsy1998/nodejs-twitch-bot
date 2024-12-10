# Twitch Bot Project

![Node.js](https://img.shields.io/badge/Node.js-23.1.0-green)
![npm](https://img.shields.io/badge/npm-9.1.0-orange)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)

Welcome to the Twitch Bot Project! This project is designed to enhance your Twitch streaming experience by integrating various functionalities such as Spotify playback, League of Legends rank information, and more.

## Features

- **Twitch Integration**: Connects to your Twitch channel and interacts with viewers.
- **Spotify Integration**: Displays the current playing song and manages Spotify playback.
- **League of Legends Integration**: Provides rank information and other game stats.
- **Express Web Server**: Serves as the backend for various web functionalities.

## Prerequisites

- Node.js (v23.1.0 or higher)
- npm (Node Package Manager)
- pm2 (Process Manager for Node.js)

## Dependencies

- dotenv
- twitchbot
- inquirer
- axios
- express
- body-parser
- qs
- concurrently

## Setup Instructions

### 1. Clone the Repository

First, clone the repository to your local machine:

```sh
git clone https://github.com/Timmsy1998/nodejs-twitch-bot.git
cd nodejs-twitch-bot
```

### 2. Install Dependencies

Install the required dependencies:

```sh
npm run setup
```

This will install all the necessary dependencies in the root, `chatBot`, and `webServer` directories, and also install `pm2` globally.

### 3. Configure Environment Variables

The setup script will guide you through the process of setting up your environment variables and creating the `.env` file. Make sure to have your Twitch and Spotify credentials ready.

### 4. Start the Bot and Web Server

Use the following command to start the chatbot and web server:

```sh
npm run start
```

This command will use `pm2` to start the bot and web server as defined in `workspaceStart.config.js`.

## Directory Structure

Here is a detailed directory structure of the project:

```plaintext
twitchBot/
├── chatBot/
│   ├── logs/                       # Directory for chatbot logs
│   ├── modules/                    # Modules for chatbot functionalities
│   │   ├── api/                    # API wrappers for external services
│   │   │   ├── lolAPIwrapper.js    # Riot Games API wrapper
│   │   │   ├── twitchAPIwrapper.js # Twitch API wrapper
│   │   ├── commands/               # Commands for the chatbot
│   │   │   ├── broadcaster/        # Broadcaster-specific commands
│   │   │   │   ├── clearquotes.js
│   │   │   │   ├── restart.js
│   │   │   ├── fun/                # Fun commands
│   │   │   │   ├── 8ball.js
│   │   │   │   ├── addquote.js
│   │   │   │   ├── clip.js
│   │   │   │   ├── joke.js
│   │   │   │   ├── quote.js
│   │   │   ├── general/            # General commands
│   │   │   │   ├── commands.js
│   │   │   │   ├── discord.js
│   │   │   │   ├── followage.js
│   │   │   │   ├── uptime.js
│   │   │   ├── leagueOfLegends/    # League of Legends commands
│   │   │   │   ├── currentgame.js
│   │   │   │   ├── rank.js
│   │   │   │   ├── runes.js
│   │   │   ├── moderation/         # Moderation commands
│   │   │   │   ├── delquote.js
│   │   │   │   ├── runq.js
│   │   │   │   ├── setGame.js
│   │   │   │   ├── setTitle.js
│   │   │   ├── spotify/            # Spotify commands
│   │   │       ├── songrequest.js
│   │   ├── events/                 # Event handlers for the chatbot
│   │   │   ├── connected.js        # Handler for connection events
│   │   │   ├── message.js          # Handler for message events
│   │   ├── handlers/               # Handlers for various chatbot tasks
│   │   │   ├── aliasHandler.js
│   │   │   ├── commandHandler.js
│   │   │   ├── cooldownHandler.js
│   │   │   ├── keywordHandler.js
│   │   │   ├── permissionHandler.js
│   │   ├── utils/                  # Utility functions
│   │       ├── refreshSpotifyToken.js
│   ├── node_modules/
│   ├── templates/
│   │   ├── exampleCommand.js
│   ├── main.js
│   ├── package-lock.json
│   ├── package.json
├── webServer/
│   ├── logs/                       # Directory for webserver logs
│   │   ├── console.log
│   │   ├── info.log
│   ├── node_modules/
│   ├── public/                     # Public static files
│   │   ├── callback.html           # OAuth callback page
│   │   ├── leagueRank.html         # League rank overlay
│   │   ├── now-playing.html        # Now playing overlay
│   ├── routes/                     # Routes for the web server
│   │   ├── league.js               # Routes for League of Legends integration
│   │   ├── spotify.js              # Routes for Spotify integration
│   │   ├── twitch.js               # Routes for Twitch integration
│   ├── main.js                     # Main entry point for the web server
│   ├── package-lock.json
│   ├── package.json
├── dataStorage/
│   ├── followage.json              # Stored followage data
│   ├── lolAccounts.json            # Stored League of Legends account data
│   ├── quotes.json                 # Stored quotes
├── node_modules/
├── global.js                       # Global configuration loader
├── LICENSE                         # License file
├── logger.js                       # Shared logging utility
├── .env                            # Environment variables
├── .gitignore                      # Git ignore file
├── package-lock.json               # NPM lock file
├── package.json                    # NPM package file
├── setup.js                        # Setup script for initializing the project
├── workspaceStart.config.js        # PM2 configuration for starting the project
```

## Contributing

Feel free to fork this repository and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**Enjoy your enhanced Twitch streaming experience!** 🚀
