const path = require("path");
const moduleAlias = require("module-alias");

function registerAliases() {
  moduleAlias.addAliases({
    "@src": path.resolve(__dirname, ".."),
    "@config": path.resolve(__dirname, "../config"),
    "@services": path.resolve(__dirname, "../services"),
    "@controllers": path.resolve(__dirname, "../controllers"),
  });
}

module.exports = {
  registerAliases,
};
