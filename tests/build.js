var fs = require("fs");
var path = require("path");
var webpack = require("webpack");

fs.readdir(__dirname, function(err, list){
  if(err) throw err;
  var dirs = list.filter(name => !/\./.test(name));

  dirs.forEach(function(dir){
    webpack(require(path.resolve(__dirname, dir, "webpack.config.js")), function(err, stats){
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
    }); 
  });
});
