const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const BundleEnsureWebpackPlugin = require("../");

module.exports = {
  entry: {
    entry1: path.resolve(__dirname, "./entry1.js"),
    entry2: path.resolve(__dirname, "./entry2.js")
  },
  output: {
    filename: "[name]-[hash].js",
    path: path.resolve(__dirname, "./dist"),

    // Failed to load? the plugin will reload for you!
    publicPath: "http://example.com/"
  },
  externals: {
    jQuery: "jQuery"
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
          test: /lib/,
          minSize: 0
        }
      }
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ["common", "entry1"],
      filename: "index1.html"
    }),
    new HtmlWebpackPlugin({
      // Forgotten common? the plugin will also reload it.
      chunks: ["entry2"],
      filename: "index2.html"
    }),

    new BundleEnsureWebpackPlugin({
      // Provide a alternative publicPath for reload.
      publicPath: "./",
      // Provide urls for externals reload.
      externals: {
        jQuery: "https://code.jquery.com/jquery-3.2.1.min.js"
      },
      minify: false
    })
  ]
};
