const path = require("path");
const webpack = require("webpack");
const BundleEnsureWebpackPlugin = require("../../");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: path.resolve(__dirname, "./index.js"),
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "./dist")
  },
  externals: {
    jquery: "jQuery",
    lodash: "commonjs lodash"
  },
  mode: "production",
  devtool: false,
  optimization: {
    minimize: false
  },
  plugins: [
    new webpack.DllReferencePlugin({
      context: __dirname,
      manifest: require("./dist/commonLib-manifest.json")
    }),
    new BundleEnsureWebpackPlugin({
      //for test
      minify: false,
      retryTemplate: "window.retry(bundleInfo, callback);",
      emitStartup: true
    }),
    //for test
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "./externals.template.html")
    })
  ]
};
