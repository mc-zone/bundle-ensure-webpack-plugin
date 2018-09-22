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
    "(function(manifest, __retry_function__, window, global){",
    enableLog
      ? indent([
        "var emptyFunc = function(){};",
        "var log = typeof console !== 'undefined' ? console : { warn:emptyFunc, log:emptyFunc, error:emptyFunc };"
      ])
      : "",
    indent([
      "/*",
      " * Save status of all items",
      " * 0: loaded",
      " * 1: loading",
      " * undefined: missing",
      " */",
      `var statusStore = ${storeName} = ${storeName} || {};`,
      "var scripts = [].slice(document.getElementsByTagName('script'));",
      "var maxRetryTimes = 3;",
      "",
      "// Check if chunk item has loaded and exist",
      "function isExist(item){",
      indent([
        "var status = statusStore[item.id];",
        "if(status === 0) return true;",
        "if(item.isExternal){",
        indent([
          "switch(item.libraryTarget){",
          indent([
            "case \"var\":",
            "case \"this\":",
            "case \"window\":",
            indent(["if(window[item.name]) return true;", "break;"]),
            "case \"global\":",
            indent(["if(global[item.name]) return true;", "break;"]),
            "default:",
            indent([enableLog ? libraryTargetWarn : "", "return true;"])
          ]),
          "}"
        ]),
        "}",
        "return false;"
      ]),
      "}",
      "",
      "// reload the chunk item",
      "function retry(item) {",
      indent([
        "__retry_function__(",
        indent([
          "item,",
          "function __CALLBACK__(error, callback){",
          indent([
            "if(isExist(item)){",
            indent([
              "statusStore[item.id] = 0;",
              "callback && callback(true);"
            ]),
            "}else{",
            indent([
              "statusStore[item.id] = 2;",
              "callback && callback(false);"
            ]),
            "}",
            "check();"
          ]),
          "},",
          "scripts,",
          "function __GIVEUP__(){",
          indent([
            enableLog ? "log.warn('Giveup retry: ' + item.name);" : "",
            "statusStore[item.id] = undefined;",
            "item.retryTimes = maxRetryTimes;"
          ]),
          "}"
        ]),
        ");"
      ]),
      "}",
      "",
      "/* ",
      " * Get that if there are some deferred startup saved from previous bundles.",
      " * After the check function defined, if there are subsequent bundles,",
      " * they will invoke the function and pass the real startup.",
      " */",
      `var runners = ${checkerName} ? ${checkerName} : [];`,
      `var check = ${checkerName} = function(runner){`,
      indent([
        "if(runner){ runners.push(runner); }",
        "var ready = true, missing = [], missingMsg = [];",
        "for(var i = 0; i < manifest.length; i+=1){",
        indent([
          "var item =  manifest[i];",
          "var exist = isExist(item);",
          "if(exist || item.retryTimes === maxRetryTimes){ continue; }",
          "var status = statusStore[item.id];",
          "ready = false;",
          "if(status !== 1){",
          indent([
            "statusStore[item.id] = 1;",
            "item.retryTimes = (item.retryTimes || 0) + 1;",
            enableLog
              ? "log.error('Runtime not ready! the' + (item.isExternal ? ' external' : '') + ' chunk: ' + item.name + '(' + item.id + ') is missing.')"
              : null,
            "retry(item);"
          ]),
          "}"
        ]),
        "}",
        "",
        "if(!ready) return ;",
        `${storeName} = statusStore = null;`,
        "while(runners.length){ runners.pop().call(null); }"
      ]),
      "}",
      "",
      "check();"
    ]),
    `})(${JSON.stringify(manifest, null, 2)}`,
    ",",
    "/** retry load function **/",
    "function(__BUNDLE_INFO__, __CALLBACK__, __SCRIPTS__, __GIVEUP__){",
    indent([
      "var bundleInfo = __BUNDLE_INFO__;", // for compatibility
      "var callback = __CALLBACK__;", // for compatibility
      retryTemplate
    ]),
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
