const fs = require("fs");
const path = require("path");

const logMessage = (logDir, logType, message) => {
  // Resolve the log directory correctly
  const logDirPath = path.resolve(__dirname, logDir);
  if (!fs.existsSync(logDirPath)) {
    fs.mkdirSync(logDirPath, { recursive: true });
  }

  const logFilePath = path.join(logDirPath, `${logType}.log`);
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - ${logType.toUpperCase()}: ${message}\n`;

  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) throw err;
  });
};

// General log functions for different log types
const logError = (logDir, message) => logMessage(logDir, "error", message);
const logInfo = (logDir, message) => logMessage(logDir, "info", message);
const logConsole = (logDir, message) => logMessage(logDir, "console", message);

module.exports = {
  logError,
  logInfo,
  logConsole,
};
