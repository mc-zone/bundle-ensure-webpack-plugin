var path = require("path");
var webpack = require("webpack");

module.exports = {
  entry:{
    commonLib:[
      path.resolve(__dirname,"./lib1.js"),
      path.resolve(__dirname,"./lib2.js"),
    ]
  },
  output: {
    filename: "[name].dll.js",
    path: path.resolve(__dirname, "./dist"),
    library: "[name]",
  },
  mode: "production",
  devtool: false,
  optimization: {
    minimize: false,
  },
  plugins:[
    new webpack.DllPlugin({
      context:__dirname,
      path: path.resolve(__dirname, "./dist/[name]-manifest.json"),
      name: "[name]",
    }),
  ]
};

