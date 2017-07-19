var asString = require("./util/template").asString;
var indent = require("./util/template").indent;

module.exports = function(manifest, globalName, prepareChunksId, entryChunksId, retryTemplate){
  var source = asString([
    "(function(manifest, retry){",
    indent([
      "function run(){",
      indent([
        `var prepareChunksId = ${JSON.stringify(prepareChunksId)};`,
        `var entryChunksId = ${JSON.stringify(entryChunksId)};`,
        `for(var i = 0; i < prepareChunksId.length; i+=1){`,
        `  ${globalName}[prepareChunksId[i]]();`,
        "}",
        `for(var j = 0; j < entryChunksId.length; j+=1){`,
        `  ${globalName}[entryChunksId[j]]();`,
        "}",
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
        "console.error(\"Runtime not ready! these assets are missing:\", JSON.stringify(missing, null, 2))",
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
    "function(__info__, __callback__){",
    indent([
      retryTemplate
    ]),
    "}",
    "/** retry load function end **/",
    ");",
  ]);

  return source;

}


