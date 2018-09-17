var fs = require("fs");
var path = require("path");
var UglifyJS = require("uglify-js");
var asString = require("./util/template").asString;
var indent = require("./util/template").indent;

var libraryTargetWarn = fs.readFileSync(
  path.resolve(__dirname, "../template/startup/libraryTargetWarn.js"),
  "utf8"
);

module.exports = function(
  manifest,
  jsonpFunctionName,
  storeName,
  checkerName,
  windowName,
  globalName,
  retryTemplate,
  minify,
  enableLog
) {
  var source = asString([
    "(function(manifest, retry, window, global){",
    indent([
      enableLog
        ? "var log = typeof console !== \"undefined\" ? console : {};"
        : "",
      "/*",
      " * Create initial status of all items",
      " * 0: loaded",
      " * 1: loading",
      " * 2: missing",
      " */",
      `var store = ${storeName} = ${storeName} || {};`,
      "var missingChunksMap = {};",
      "for(var i = 0, item; item = manifest[i]; i+=1){",
      indent([
        "if(store[item.id] === 0){ continue; }",
        "store[item.id] = 2;",
        "missingChunksMap[item.id] = item;"
      ]),
      "}",
      "",
      "// Check if all are loaded and run",
      `var runners = ${checkerName} ? ${checkerName} : [];`,
      `var check = ${checkerName} = function(runner){`,
      indent([
        "if(runner){ runners.push(runner); }",
        "var ready = true, missing = [], missingMsg = [];",
        "for(var id in store){",
        indent([
          "var status = store[id];",
          "var item = missingChunksMap[id];",
          "if(status === 0){ continue; }",
          "if(item && item.isExternal){",
          indent([
            "switch(item.libraryTarget){",
            indent([
              "case \"var\":",
              "case \"this\":",
              "case \"window\":",
              indent([
                "if(window[item.name]){",
                indent(["store[item.id] = 0;", "continue;"]),
                "}",
                "break;"
              ]),
              "case \"global\":",
              indent([
                "if(global[item.name]){",
                indent(["store[item.id] = 0;", "continue;"]),
                "}",
                "break;"
              ]),
              "default:",
              indent([
                enableLog ? libraryTargetWarn : "",
                "store[item.id] = 0;",
                "continue;"
              ])
            ]),
            "}"
          ]),
          "}",
          "ready = false;",
          "if(status !== 1){",
          indent([
            "store[item.id] = 1;",
            enableLog
              ? "log.error('Runtime not ready! the' + (item.isExternal ? ' external' : '') + ' chunk: ' + item.name + '(' + item.id + ') is missing.')"
              : null,
            "retry(item, check);"
          ]),
          "}"
        ]),
        "}",
        "",
        "if(ready){",
        indent([
          `${storeName} = store = missingChunksMap = null;`,
          "while(runners.length){ runners.pop().call(null); }",
          "return ;"
        ]),
        "}",
        ""
      ]),
      "}",
      "",
      "check();"
    ]),
    `})(${JSON.stringify(manifest, null, 2)}`,
    ",",
    "/** retry load function **/",
    "function(bundleInfo, callback){",
    indent([retryTemplate]),
    "}",
    "/** retry load function end **/",
    `, ${windowName}, ${globalName});`
  ]);

  if (minify) {
    var result = UglifyJS.minify(source);
    if (result.error) {
      throw result.error;
    }
    return result.code;
  } else {
    return source;
  }
};
