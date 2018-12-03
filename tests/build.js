const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const rimraf = require("rimraf");
const only = process.argv[2];

function webpackBuild(configPath, cb) {
  webpack(require(configPath), function(err, stats) {
    if (err) {
      console.error(err.stack || err);
      if (err.details) {
        console.error(err.details);
      }
      return;
    }
    if (stats.hasErrors()) {
      stats.toJson().errors.forEach(console.error);
      return;
    }
    console.log(
      stats.toString({
        chunks: false,
        modules: false,
        colors: true
      }) + "\n"
    );
    cb && cb();
  });
}

fs.readdir(__dirname, function(err, list) {
  if (err) throw err;
  const dirs = list
    .filter(name => !/\./.test(name))
    .filter(name => !only || name.indexOf(only) !== -1);

  dirs.forEach(function(dir) {
    rimraf(path.resolve(__dirname, dir, "./dist"), err => {
      if (err) {
        return console.error(err);
      }
      const buildConfig = path.resolve(__dirname, dir, "webpack.config.js");
      const prebuildConfig = path.resolve(
        __dirname,
        dir,
        "webpack.prebuild.config.js"
      );
      if (fs.existsSync(prebuildConfig)) {
        webpackBuild(prebuildConfig, function() {
          webpackBuild(buildConfig);
        });
      } else {
        webpackBuild(buildConfig);
      }
    });
  });
});
