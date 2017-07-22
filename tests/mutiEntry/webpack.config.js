var path = require("path");
var webpack = require("webpack");
var BundleEnsureWebpackPlugin = require("../../");

module.exports = {
  entry: {
    index1:path.resolve(__dirname,'./index1.js'),
    index2:path.resolve(__dirname,'./index2.js'),
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, './dist'),
  },
  plugins:[
    new webpack.optimize.CommonsChunkPlugin({
      name: "common",
      filename: "common.bundle.js",
    }),
    new BundleEnsureWebpackPlugin({
      //for test
      retryTemplate:"window.retry(bundleInfo, callback);",
      emitStartup:true, 
    }),
  ]
}

