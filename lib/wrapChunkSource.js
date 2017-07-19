var ConcatSource = require("webpack-sources").ConcatSource;

module.exports = function(chunk, source, globalName){
  var newSource = new ConcatSource();
  newSource.add(`(typeof ${globalName} === "undefined" ? (${globalName}={}) : ${globalName})`);
  newSource.add(`${JSON.stringify([chunk.id])} = function(){`);
  newSource.add(source);
  newSource.add("};");

  return newSource;
}
