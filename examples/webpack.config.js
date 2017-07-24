var path = require("path");
var webpack = require("webpack");
var HtmlWebpackPlugin = require("html-webpack-plugin");
var BundleEnsureWebpackPlugin = require("../");

module.exports = {
  entry: {
    entry1: path.resolve(__dirname,"./entry1.js"),
    entry2: path.resolve(__dirname,"./entry2.js"),
  },
  output: {
    filename: "[name]-[chunkhash].js?hash=[hash]",
    path: path.resolve(__dirname, "./dist"),
    publicPath: "http://example.com/"
  },
  externals:{
    jQuery:"jQuery",
  },
  plugins:[
    new webpack.optimize.CommonsChunkPlugin({
      name: "common",
      filename: "commonChunk.js",
    }),

    new HtmlWebpackPlugin({
      chunks:["entry1"],
      filename: "index1.html"
    }),
    new HtmlWebpackPlugin({
      chunks:["common", "entry2"],
      filename: "index2.html"
    }),

    new BundleEnsureWebpackPlugin({
      publicPath:"./",
      externals:{
        jQuery:"https://code.jquery.com/jquery-3.2.1.min.js",
      }
    }),

  ]
};


