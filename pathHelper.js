const path = require("path");

// Function to resolve paths relative to the root directory
const resolvePath = (relativePath) => {
  return path.resolve(__dirname, relativePath);
};

module.exports = { resolvePath };
