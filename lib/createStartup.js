var fs = require("fs");
var path = require("path");
var UglifyJS = require("uglify-js");
var asString = require("./util/template").asString;
var indent = require("./util/template").indent;

var libraryTargetWarn = fs.readFileSync(path.resolve(__dirname, "../template/startup/libraryTargetWarn.js"), "utf8");
var pushMissingMsg = fs.readFileSync(path.resolve(__dirname, "../template/startup/pushMissingMsg.js"), "utf8");
var missingError = fs.readFileSync(path.resolve(__dirname, "../template/startup/missingError.js"), "utf8");

module.exports = function(manifest, jsonpFunctionName, storeName, windowName, globalName, retryTemplate, minify, enableLog){
  var source = asString([
    "(function(manifest, retry, window, global){",
    indent([
      enableLog ? "var log = typeof console !== \"undefined\" ? console : {}" : "",
      "function run(){",
      indent([
        "for(var i = 0; i < manifest.length; i+=1){",
        indent([
          "var chunk = manifest[i];",
          "if(!chunk.isChunk) continue; ",
          `${storeName}[chunk.id].call(window, window["${jsonpFunctionName}"]);`,
        ]),
        "}"
      ]),
      "}",
      "",
      "function check(){",
      indent([
        "var ready = true, missing = [], misssingMsg = [];",
        "for(var i = 0, item; item = manifest[i]; i+=1){",
        indent([
          `if(item.isChunk && typeof ${storeName} !== "undefined" && ${storeName}[item.id]){ continue; }`,
          "if(item.isExternal){",
          indent([
            "switch(item.libraryTarget){",
            indent([
              "case \"var\":",
              "case \"this\":",
              "case \"window\":",
              indent([
                "if(window[item.name]){ continue; }",
                "break;"
              ]),
              "case \"global\":",
              indent([
                "if(global[item.name]){ continue; }",
                "break;"
              ]),
              "default:",
              indent([
                enableLog ? libraryTargetWarn : "",
                "continue;",
              ]),
            ]),
            "}"
          ]),
          "}",
          "ready = false;",
          "missing.push(item);",
          enableLog ? pushMissingMsg : "",
        ]),
        "}",
        "",
        "if(ready){ return run(); }",
        "",
        enableLog ? missingError : "",
        "var retrySuccessed = 0;",
        "for(var i = 0; i < missing.length; i += 1){",
        indent([
          "retry(missing[i], function(){",
          indent([
            "if(++retrySuccessed == missing.length){ check(); }",
          ]),
          "});",
        ]),
        "}",
      ]),
      "}",
      "",
      "check();",
    ]),
    `})(${JSON.stringify(manifest, null, 2)}`,
    ",",
    "/** retry load function **/",
    "function(bundleInfo, callback){",
    indent([
      retryTemplate
    ]),
    "}",
    "/** retry load function end **/",
    `, ${windowName}, ${globalName});`,
  ]);

  if(minify){
    var result = UglifyJS.minify(source);
    if(result.error){
      throw result.error;
    }
    return result.code;
  }else{
    return source;
  }
};
