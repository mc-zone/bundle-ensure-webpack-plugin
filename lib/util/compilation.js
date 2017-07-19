
module.exports = {
  getPublicPath: function(compilation){
    var publicPath = compilation.mainTemplate.getPublicPath({hash: compilation.hash}) || '';
    if (publicPath.length && !/\/$/.test(publicPath)){
      publicPath += '/';
    }
    return publicPath;
  },

  getUsedDll: function(compilation){
    var usedDll = new Set();
    compilation.modules.forEach(module => {
      if(module.constructor.name == "DelegatedModule" && module.sourceRequest.startsWith("dll-reference ")){
        var dllName = module.sourceRequest.replace("dll-reference ", "");
        usedDll.add(dllName);
      }
    });

    return usedDll;
  },
}
