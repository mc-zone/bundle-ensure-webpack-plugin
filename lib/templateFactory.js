var fs = require("fs");
var path = require("path");
var templateDir = path.resolve(__dirname, "../template/retry/");

module.exports = function(setting) {
  var template;
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
