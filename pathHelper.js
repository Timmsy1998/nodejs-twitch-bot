const path = require("path");

const resolvePath = (relativePath) => {
  return path.resolve(__dirname, relativePath);
};

module.exports = { resolvePath };
