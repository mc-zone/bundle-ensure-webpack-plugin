var fs = require("fs");
var path = require("path");
var webpack = require("webpack");
var rimraf = require("rimraf");
const only = process.argv[2];

function webpackBuild(configPath, cb){
  webpack(require(configPath), function(err, stats){
    if(err){
      console.error(err.stack || err);
      if (err.details) {
        console.error(err.details);
      }
      return;
    }
    if(stats.hasErrors()) {
      return console.error(stats.toJson().errors);
    }
    console.log(stats.toString({
      chunks: false,
      modules: false,
      colors:true
    }) + "\n");
    cb && cb();
  }); 
}

fs.readdir(__dirname, function(err, list){
  if(err) throw err;
  var dirs = list.filter(name => !/\./.test(name)).filter(name => !only || name.indexOf(only) !== -1);

  dirs.forEach(function(dir){
    rimraf(path.resolve(__dirname, dir, "./dist"), (err) => {
      if(err){
        return console.error(err);
      }
      var buildConfig = path.resolve(__dirname, dir, "webpack.config.js");
      var prebuildConfig = path.resolve(__dirname, dir, "webpack.prebuild.config.js");
      if(fs.existsSync(prebuildConfig)){
        webpackBuild(prebuildConfig, function(){
          webpackBuild(buildConfig);
        });
      }else{
        webpackBuild(buildConfig);
      }
    });
  });
});

