var fs = require("fs");
var path = require("path");
var webpack = require("webpack");

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
  var dirs = list.filter(name => !/\./.test(name));

  dirs.forEach(function(dir){
    var buildConfig = path.resolve(__dirname, dir, "webpack.config.js");
    var prebuildConfig = path.resolve(__dirname, dir, "webpack.prebuild.config.js");
    try{
      fs.statSync(prebuildConfig);
    }catch(e){
      prebuildConfig = null;
    }
    if(prebuildConfig){
      webpackBuild(prebuildConfig, function(){
        webpackBuild(buildConfig);
      });
    }else{
      webpackBuild(buildConfig);
    }
  });
});
