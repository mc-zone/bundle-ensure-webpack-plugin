var asString = require("./util/template").asString;
var indent = require("./util/template").indent;

module.exports = function(manifest, globalName, jsonpFunctionName, retryTemplate){
  var source = asString([
    "(function(manifest, retry){",
    indent([
      "function run(){",
      indent([
        "for(var i = 0; i < manifest.length; i+=1){",
        indent([
          "var chunk = manifest[i];",
          "if(!chunk.isChunk) continue; ",
          `${globalName}[chunk.id].call(window, window["${jsonpFunctionName}"]);`,
        ]),
        "}"
      ]),
      "}",
      "",
      "function check(){",
      indent([
        "var ready = true, missing = [];",
        "for(var i = 0, item; item = manifest[i]; i+=1){",
        indent([
          "if(!(",
          indent([
            "(item.isDll && window[item.name]) || ",
            `(item.isChunk && typeof ${globalName} !== "undefined" && ${globalName}[item.id])`,
          ]),
          ")){",
          indent([
            "ready = false;",
            "missing.push(item);",
          ]),
          "}",
        ]),
        "}",
        "",
        "if(ready){ return run(); }",
        "",
        "console.error(\"Runtime not ready! these chunk/bundles are missing:\", JSON.stringify(missing, null, 2))",
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
    `})(${JSON.stringify(manifest, null, 2)},`,
    "/** retry load function **/",
    "function(bundleInfo, callback){",
    indent([
      retryTemplate
    ]),
    "}",
    "/** retry load function end **/",
    ");",
  ]);

  return source;
};
