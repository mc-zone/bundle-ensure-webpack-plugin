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
  retryTemplate,
  manifest,
  jsonpFunctionName,
  publicPath,
  {
    storeName,
    checkerName,
    windowName,
    globalName,
    minify,
    enableLog,
    externals,
    appendTime
  } = {}
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
      " * 2: load failed",
      " * undefined: missing",
      " */",
      "var STATUS_LOADED = 0;",
      "var STATUS_LOADING = 1;",
      "var STATUS_LOAD_FAILED = 2;",
      "var STATUS_MISSING = undefined;",
      `var statusStore = ${storeName} = ${storeName} || {};`,
      "var scripts = [].slice.call(document.getElementsByTagName('script'));",
      "var maxRetryTimes = 3;",
      "",
      "// Check if chunk item has loaded and exist",
      "function isExist(item){",
      indent([
        "var status = statusStore[item.id];",
        "if(status === STATUS_LOADED) return true;",
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
          "function __CALLBACK__(callback){",
          indent([
            "if(isExist(item)){",
            indent([
              "statusStore[item.id] = STATUS_LOADED;",
              "callback && callback(true);"
            ]),
            "}else{",
            indent([
              "statusStore[item.id] = STATUS_LOAD_FAILED;",
              "callback && callback(false);"
            ]),
            "}",
            "check();"
          ]),
          "},",
          "scripts,",
          "function __GIVEUP__(){",
          indent([
            enableLog
              ? "log.warn('[Bundle Ensure Plugin] Giveup retry: ' + item.name);"
              : "",
            "statusStore[item.id] = STATUS_MISSING;",
            "item.retryTimes = maxRetryTimes;"
          ]),
          "},",
          `${JSON.stringify(publicPath)},`,
          `${JSON.stringify(externals)},`,
          `${!!appendTime}`
        ]),
        ");"
      ]),
      "}",
      "",
      "/* ",
      " * to make startup calls deferred, the startup at previous bundles",
      ` * had been wrapped (in ${checkerName}) in advance.`,
      " * Here we get them and redefine the wrapper to the check function instead.",
      " * If other subsequent bundles arrived and executed,",
      " * they will invoke the check function, and we can also get original startup.",
      " * We won't invoke any startup calls until all checks done.",
      " */",
      `var runners = ${checkerName} ? ${checkerName} : [];`,
      `var check = ${checkerName} = function(runner){`,
      indent([
        "if(!runners){",
        indent([
          enableLog
            ? "log.log('[Bundle Ensure Plugin] Check had finished, skip');"
            : "",
          "if(runner){ runner.call(window); }",
          "return ;"
        ]),
        "}",
        "if(runner){ runners.push(runner); }",
        enableLog ? "log.log('[Bundle Ensure Plugin] Trigger check');" : "",
        "var needWait = false, notFoundItemsName = [];",
        "for(var i = 0; i < manifest.length; i+=1){",
        indent([
          "var item = manifest[i];",
          "var exist = isExist(item);",
          "if(exist){ continue; }",
          "var status = statusStore[item.id];",
          "if(status === STATUS_LOADING){",
          indent(["needWait = true;"]),
          "}else if(!item.retryTimes || item.retryTimes < maxRetryTimes){",
          indent([
            "needWait = true;",
            "statusStore[item.id] = STATUS_LOADING;",
            "item.retryTimes = (item.retryTimes || 0) + 1;",
            enableLog
              ? "log.error('[Bundle Ensure Plugin] Runtime not ready! the' + (item.isExternal ? ' external' : '') + ' chunk: ' + item.name + '(' + item.id + ') is missing.')"
              : "",
            "retry(item);"
          ]),
          "}else{",
          indent(["notFoundItemsName.push(item.name);"]),
          "}"
        ]),
        "}",
        "",
        "if(needWait) return ;",
        "if(notFoundItemsName.length){",
        enableLog
          ? indent([
            "log.warn('[Bundle Ensure Plugin] WARNING: Some bundles still not found after reload: ' + ",
            "notFoundItemsName.join(', ')",
            ");"
          ])
          : "",
        "}else{",
        enableLog
          ? indent(["log.log('[Bundle Ensure Plugin] All bundles ready!');"])
          : "",
        "}",
        enableLog
          ? "log.log('[Bundle Ensure Plugin] Invoking startups...');"
          : "",
        "while(runners.length){ runners.pop().call(null); }",
        "runners = null;"
      ]),
      "}",
      "",
      "check();"
    ]),
    `})(${JSON.stringify(manifest, null, 2)}`,
    ",",
    "/** retry load function **/",
    "function(__BUNDLE_INFO__, __CALLBACK__, __SCRIPTS__, __GIVEUP__, __PUBLIC_PATH__, __EXTERNALS__, __APPEND_TIMESTAMP__){",
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
