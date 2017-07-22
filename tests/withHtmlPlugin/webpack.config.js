var path = require("path");
var webpack = require("webpack");
var BundleEnsureWebpackPlugin = require("../../");
var HtmlWebpackPlugin = require("html-webpack-plugin");

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
      retryTemplate:"console.log(\"retry \" + bundleInfo.name);",
    }),

    new HtmlWebpackPlugin({
      filename: 'index1.html',
      chunks:["common", "index1"],
    }),

    //for test
    new HtmlWebpackPlugin({
      filename: 'index2-missingcommon.html',
      chunks:["index2"],
    }),
    //for test
    new HtmlWebpackPlugin({
      filename: 'index2-missingindex.html',
      template: path.resolve(__dirname, './template-missingindex.html'),
      chunks:["index2"],
      inject:false,
    }),
    //for test
    new HtmlWebpackPlugin({
      filename: 'index2-missingall.html',
      chunks:["index2"],
      inject:false,
    }),
    //for test
    new HtmlWebpackPlugin({
      filename: 'index-muti.html',
      chunks:["common", "index1", "index2"],
    }),
    //for test
    new HtmlWebpackPlugin({
      filename: 'index-muti-missingcommon.html',
      chunks:["index1", "index2"],
    }),
  ]
}


