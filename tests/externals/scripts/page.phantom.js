var fs = require("fs");
var page = require("webpage").create();

var htmlPath = fs.absolute("tests/externals/dist/index.html");

page.onConsoleMessage = function(msg, lineNum, sourceId) {
  console.log(msg);
};

page.open("file://" + htmlPath, function(status) {
  phantom.exit();
});


