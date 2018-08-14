var path = require("path");
var BundleEnsureWebpackPlugin = require("../../");

module.exports = {
  entry: path.resolve(__dirname,"./index.js"),
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "./dist"),
  },
  mode: "production",
  plugins:[
    new BundleEnsureWebpackPlugin({
      //for test
      retryTemplate:"window.retry(bundleInfo, callback);",
      emitStartup:true, 
    }),
  ]
};
