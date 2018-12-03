const asString = require("./util/template").asString;
const indent = require("./util/template").indent;

module.exports = (source, chunk, hash, checkerName) => {
  const startupCode = asString([
    `if(typeof ${checkerName} === "function"){`,
    indent([`${checkerName}(__webpack_origin_startup__);`]),
    "}else{",
    indent([
      `(${checkerName} = ${checkerName} || []).push(__webpack_origin_startup__);`
    ]),
    "}"
  ]);

  /*
   * pushDeferred is combined with cehckDeferred, can't wrap them
   * just override it and let it excuted
   */
  if (/checkDeferredModules/.test(source)) {
    return asString([
      "var __webpack_origin_startup__ = checkDeferredModules;",
      "checkDeferredModules = function(){",
      indent([startupCode]),
      "};",
      source
    ]);
  } else {
    return asString([
      "var __webpack_origin_startup__ = function(){",
      indent([source]),
      "};",
      startupCode
    ]);
  }
};
