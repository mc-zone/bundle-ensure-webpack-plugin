var fs = require("fs");
var path = require("path");
var Tapable = require("tapable");
var util = require("./lib/util/compilation");
var createStartup = require("./lib/createStartup");
var wrapChunkSource = require("./lib/wrapChunkSource");

class BundleEnsureWebpackPlugin extends Tapable {
  constructor(options={}){
    super();
    this.options = Object.assign({
      globalName: "window.__WPE__",
      associateWithHtmlPlugin: true,
      emitStartup: false,
      startupFilename:"[name].startup.js",
      retryTemplate: undefined,
    }, options);

    if(typeof this.options.retryTemplate === "undefined"){
      this.options.retryTemplate = fs.readFileSync(path.resolve(__dirname, "./template/retry.js"), "utf8");
    }

    this.entryChunks = new Map();
    this.prepareChunks = new Map();


    this.plugin("count-entry-manifest", (init, entrypoint, compilation) => {
      return this.getManifestForEntry(entrypoint, compilation);
    });
    this.plugin("render-entry-startup", (init, manifest, entrypoint, compilation) => {
      return this.renderStartupScript(compilation, manifest);
    });
  }

  registerChunk(chunk){
    if(chunk.hasEntryModule()){
      this.entryChunks.set(chunk.id, chunk);
    }else{
      this.prepareChunks.set(chunk.id, chunk);
    }
  }

  getManifestForEntry(entrypoint, compilation){
    var options = this.options;
    var publicPath = util.getPublicPath(compilation);
    var manifest = [];

    var defaultDllPublicPath;
    if(typeof options.dllPublicPath == "string"){
      defaultDllPublicPath = options.dllPublicPath;
    }else{
      defaultDllPublicPath = publicPath;
    }
    if (defaultDllPublicPath.length && !/\/$/.test(defaultDllPublicPath)){
      defaultDllPublicPath += '/';
    }

    //collect all dlls
    var dllSet = util.getUsedDll(compilation);
    dllSet.forEach(name => {
      var dllUrl;
      if(typeof options.dllPublicPath == "object" && options.dllPublicPath[name]){
        dllUrl = options.dllPublicPath[name];
      }else{
        dllUrl = defaultDllPublicPath + name + ".js";
      }
      manifest.push({
        isDll:true,
        name:name,
        url:dllUrl,
        priority:1,
      });
    });

    //collect chunks
    var needChunksId = new Set(entrypoint.chunks.map(chunk => chunk.id));
    this.prepareChunks.forEach((chunk, id) => {
      if(!needChunksId.has(id)) return ;
      var chunkUrl = publicPath + chunk.files[0]; 
      manifest.push({
        isChunk:true,
        id:id,
        name:chunk.name,
        url:chunkUrl,
        priority:5,
      });
    });
    this.entryChunks.forEach((chunk, id) => {
      if(!needChunksId.has(id)) return ;
      var chunkUrl = publicPath + chunk.files[0]; 
      manifest.push({
        isChunk:true,
        id:id,
        name:chunk.name,
        url:chunkUrl,
        priority:10,
      });
    });

    return manifest;
  }

  renderStartupScript(compilation, manifest){
    var options = this.options;
    var retryTemplate = options.retryTemplate;
    var jsonpFunction = this.getJsonpFunctionName(compilation);

    return createStartup(manifest, options.globalName, jsonpFunction, retryTemplate);
  }

  emitStartupScript(compilation, scripts){
    scripts.forEach((script, entryName) => {
      var outputFilename = this.getScriptOutputFilename(entryName);
      compilation.assets[outputFilename] = {
        source: () => script,
        size: () => Buffer.byteLength(script),
      };
    });
  }

  getScriptOutputFilename(entryName){
    var filename = this.options.startupFilename;
    filename = filename.replace("[name]", entryName);
    return filename;
  }

  getJsonpFunctionName(compilation){
    return compilation.outputOptions.jsonpFunction;
  }

  apply(compiler){
    var options = this.options;

    compiler.plugin("compilation", (compilation) => {
      if(compilation.compiler !== compiler){//ignore child compiler
        return ;
      }

      var jsonpFunction = this.getJsonpFunctionName(compilation);
      compilation.mainTemplate.plugin("render", (source, chunk, hash) => {
        this.registerChunk(chunk);
        return wrapChunkSource(chunk, source, options.globalName, jsonpFunction);
      });

      compilation.chunkTemplate.plugin("render", (source, chunk, hash) => {
        this.registerChunk(chunk);
        return wrapChunkSource(chunk, source, options.globalName, jsonpFunction);
      });
    });

    compiler.plugin("after-compile", (compilation, callback) => {
      if(compilation.compiler !== compiler){//ignore child compiler
        return callback();
      }

      compilation.applyPlugins("bundle-ensure-webpack-plugin-created", this);

      var entryManifests = new Map();
      for(var entryName in compilation.entrypoints){
        var entrypoint = compilation.entrypoints[entryName];
        var manifest = this.applyPluginsWaterfall("count-entry-manifest", true, entrypoint, compilation);
        entryManifests.set(entryName, manifest);
      }

      var entryScripts = new Map();
      entryManifests.forEach((manifest, entryName) => {
        var entrypoint = compilation.entrypoints[entryName];
        var startupScript = this.applyPluginsWaterfall("render-entry-startup", true, manifest, entrypoint, compilation);
        entryScripts.set(entryName, startupScript);
      });

      if(options.associateWithHtmlPlugin){
        //TODO filter by include entry chunks
        compilation.plugin('html-webpack-plugin-alter-asset-tags', (htmlPluginData, callback) => {
          htmlPluginData.body.push({
            tagName: "script",
            closeTag: true,
            innerHTML: startupScript,
          })
          callback(null, htmlPluginData);
        });
      }

      if(options.emitStartup){
        compiler.plugin("emit", (compilation, callback) => {
          this.emitStartupScript(compilation, entryScripts);
          callback();
        });
      }
      callback();
    });
  }
}


module.exports = BundleEnsureWebpackPlugin;
