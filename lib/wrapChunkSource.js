var ConcatSource = require("webpack-sources").ConcatSource;

module.exports = function(chunk, source, globalName, jsonpFunctionName){
  var newSource = new ConcatSource();
  newSource.add("(function(window){");
  newSource.add(`(typeof ${globalName} === "undefined" ? (${globalName}={}) : ${globalName})`);
  newSource.add(`${JSON.stringify([chunk.id])} = function(${jsonpFunctionName}){`);
  newSource.add(source);
  newSource.add("}");
  newSource.add("})(window)");

  return newSource;
};
