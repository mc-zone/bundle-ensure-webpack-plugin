const path = require("path");

module.exports = {
  getPublicPath: function(compilation) {
    var publicPath =
      compilation.mainTemplate.getPublicPath({ hash: compilation.hash }) || "";
    if (publicPath.length && !/\/$/.test(publicPath)) {
      publicPath += "/";
    }
    return publicPath;
  },

  getJsonpFunctionName(compilation) {
    return compilation.outputOptions.jsonpFunction;
  },

  getUsedExternals(compilation) {
    var usedExternals = new Map();
    compilation.modules.forEach(module => {
      if (
        module.constructor.name == "ExternalModule" &&
        module.reasons.length
      ) {
        var name = module.request;
        usedExternals.set(name, module);
      }
    });

    // complete all Dlls
    compilation.options.plugins.forEach(plugin => {
      if (plugin.constructor.name === "DllReferencePlugin") {
        const dllOption = plugin.options;
        if (
          dllOption &&
          dllOption.manifest &&
          !usedExternals.has(dllOption.manifest.name)
        ) {
          usedExternals.set(dllOption.manifest.name, {
            externalType: dllOption.sourceType
          });
        }
      }
    });
    return usedExternals;
  },

  getChunkMainAssetFilename(chunk, compilationOrStats) {
    const compilation = compilationOrStats.compilation || compilationOrStats;
    const fileNameTemplate = compilation.options.output.filename;
    let realFileName = compilation.getPath(fileNameTemplate, {
      chunk: chunk,
      noChunkHash: false,
      contentHashType: "javascript"
    });

    if (!realFileName || !compilation.assets[realFileName]) {
      const allFiles = chunk.files;
      const getExt = p => path.extname(p).replace(/\?.*$/, "");
      const originExt = getExt(fileNameTemplate);
      realFileName =
        allFiles.find(file => {
          return (
            getExt(file).startsWith(originExt) && file.indexOf(chunk.name) > -1
          );
        }) || "";
    }

    return realFileName.replace(/\?.*$/, "");
  }
};
