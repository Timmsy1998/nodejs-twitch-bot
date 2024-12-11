const path = require("path");

/**
 * Resolves a path relative to the directory containing this helper file.
 * @param {string} relativePath - The relative path to resolve.
 * @returns {string} The resolved absolute path.
 */
const resolvePath = (relativePath) => {
  return path.resolve(__dirname, relativePath);
};

module.exports = {
  resolvePath,
};
