const fs = require("fs");
const path = require("path");
const templateDir = path.resolve(__dirname, "../template/retry/");

module.exports = function(setting) {
  let template;
  switch (setting) {
    case "default":
      template = fs.readFileSync(
        path.resolve(templateDir, "default.js"),
        "utf8"
      );
      break;
    default:
      template = setting;
  }

  return template;
};
