var path = require("path");
var BundleEnsureWebpackPlugin = require("../../");

module.exports = {
  entry: {
    index1:path.resolve(__dirname,"./index1.js"),
    index2:path.resolve(__dirname,"./index2.js"),
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "./dist"),
  },
  mode: "production",
  devtool: false,
  optimization: {
    minimize: false,
    splitChunks: {
      chunks: "all",
      minSize: 0,
      cacheGroups: {
        common: {
          name: "common",
          test: /commonLib/,
          minSize: 0,
        }
      }
    }
  },
  plugins:[
    new BundleEnsureWebpackPlugin({
      //for test
      retryTemplate:"window.retry(bundleInfo, callback);",
      emitStartup:true, 
    }),
  ]
};

