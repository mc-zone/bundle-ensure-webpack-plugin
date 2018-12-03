const path = require("path");
const BundleEnsureWebpackPlugin = require("../../");

module.exports = {
  entry: path.resolve(__dirname, "./index.js"),
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "./dist")
  },
  mode: "production",
  plugins: [
    new BundleEnsureWebpackPlugin({
      retryTemplate: ";",
      polyfill: ";(function(){ window.test_output('polyfill excuted!'); })();",
      minify: false,
      emitStartup: true
    })
  ]
};
