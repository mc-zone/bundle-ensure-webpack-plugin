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
  }
};
