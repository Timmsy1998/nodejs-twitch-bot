const fs = require("fs");
const path = require("path");

/**
 * Logs a message to a specified directory and log file.
 * @param {string} logDir - The directory to save the log file.
 * @param {string} logType - The type of log (e.g., 'error', 'info', 'console').
 * @param {string} message - The log message.
 */
const logMessage = (logDir, logType, message) => {
  const logDirPath = path.resolve(__dirname, logDir);
  if (!fs.existsSync(logDirPath)) {
    fs.mkdirSync(logDirPath, { recursive: true });
  }

  const logFilePath = path.join(logDirPath, `${logType}.log`);
  const timestamp = new Date().toISOString();
  const sanitizedMessage = message.replace(/[<>:"/\\|?*\x00-\x1F]/g, ""); // Remove invalid characters
  const logEntry = `${timestamp} - ${logType.toUpperCase()}: ${sanitizedMessage}\n`;

  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) throw err;
  });
};

/**
 * Logs an error message.
 * @param {string} logDir - The directory to save the log file.
 * @param {string} message - The log message.
 */
const logError = (logDir, message) => logMessage(logDir, "error", message);

/**
 * Logs an info message.
 * @param {string} logDir - The directory to save the log file.
 * @param {string} message - The log message.
 */
const logInfo = (logDir, message) => logMessage(logDir, "info", message);

/**
 * Logs a console message.
 * @param {string} logDir - The directory to save the log file.
 * @param {string} message - The log message.
 */
const logConsole = (logDir, message) => logMessage(logDir, "console", message);

module.exports = {
  logError,
  logInfo,
  logConsole,
};
