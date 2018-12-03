const ConcatSource = require("webpack-sources").ConcatSource;

module.exports = function(chunk, source, storeName, windowName) {
  const newSource = new ConcatSource();
  newSource.add(
    `!((${storeName} = ${storeName} || {})[${JSON.stringify(chunk.id)}] = 0);`
  );
  newSource.add("\n");
  newSource.add(source);

  return newSource;
};
