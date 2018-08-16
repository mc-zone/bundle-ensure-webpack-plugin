var path = require("path");
var BundleEnsureWebpackPlugin = require("../../");
var HtmlWebpackPlugin = require("html-webpack-plugin");

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
      retryTemplate:"console.log(\"retry \" + bundleInfo.name);",
    }),

    new HtmlWebpackPlugin({
      filename: "index1.html",
      chunks:["common", "index1"],
    }),

    //for test
    new HtmlWebpackPlugin({
      filename: "index2-missingcommon.html",
      chunks:["index2"],
    }),
    //for test
    new HtmlWebpackPlugin({
      filename: "index2-missingindex.html",
      template: path.resolve(__dirname, "./template-missingindex.html"),
      chunks:["index2"],
      inject:false,
    }),
    //for test
    new HtmlWebpackPlugin({
      filename: "index2-missingall.html",
      chunks:["index2"],
      inject:false,
    }),
    //for test
    new HtmlWebpackPlugin({
      filename: "index-muti.html",
      chunks:["common", "index1", "index2"],
    }),
    //for test
    new HtmlWebpackPlugin({
      filename: "index-muti-missingcommon.html",
      chunks:["index1", "index2"],
    }),
  ]
};


