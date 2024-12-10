const path = require("path");

/**
 * Resolves a path relative to the root of the project.
 * @param {string} relativePath - The path to resolve.
 * @returns {string} The resolved path.
 */
const resolvePath = (relativePath) => {
  return path.resolve(__dirname, relativePath);
};

module.exports = {
  resolvePath,
};
