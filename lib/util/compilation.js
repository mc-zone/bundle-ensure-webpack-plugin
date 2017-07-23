module.exports = {
  getPublicPath: function(compilation){
    var publicPath = compilation.mainTemplate.getPublicPath({hash: compilation.hash}) || "";
    if(publicPath.length && !/\/$/.test(publicPath)){
      publicPath += "/";
    }
    return publicPath;
  },

  getUsedExternals: function(compilation){
    var usedExternals = new Map();
    compilation.modules.forEach(module => {
      if(module.constructor.name == "ExternalModule" && module.reasons.length){
        var name = module.request;
        usedExternals.set(name, module);
      }
    });

    return usedExternals;
  },
};
