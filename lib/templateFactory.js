var fs = require("fs");
var path = require("path");
var templateDir = path.resolve(__dirname, "../template/retry/");

module.exports = function(setting, publicPath, externals, appendTime){
  var template;
  switch(setting){
    case "default":
      template = fs.readFileSync(path.resolve(templateDir, "default.js"), "utf8");
      break;
    default:
      template = setting;
  }

  template = template.replace(/__PUBLIC_PATH__/g, JSON.stringify(publicPath));
  template = template.replace(/__EXTERNALS__/g, JSON.stringify(externals));
  template = template.replace(/__APPEND_TIMESTAMP__/g, !!appendTime);

  return template;
};
