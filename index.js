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
      retryTemplate: undefined,
    }, options);

    if(!this.options.retryTemplate){
      this.options.retryTemplate = fs.readFileSync(path.resolve(__dirname, "./template/retry.js"), "utf8");
    }

    this.entryChunks = new Map();
    this.prepareChunks = new Map();


    this.plugin("bundle-ensure-webpack-plugin-manifest", (compilation) => {
      return this.getManifest(compilation);
    });
    this.plugin("bundle-ensure-webpack-plugin-render", (manifest, compilation) => {
      return this.makeStartupScript(compilation, manifest);
    });
  }

  registerChunk(chunk){
    if(chunk.hasEntryModule()){
      this.entryChunks.set(chunk.id, chunk);
    }else{
      this.prepareChunks.set(chunk.id, chunk);
    }
  }

  getManifest(compilation){
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

    //collect dlls
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
    this.prepareChunks.forEach((chunk, id) => {
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

  makeStartupScript(compilation, manifest){
    var options = this.options;
    var prepareChunksId = Array.from(this.prepareChunks.keys());
    var entryChunksId = Array.from(this.entryChunks.keys());
    var retryTemplate = options.retryTemplate;

    return createStartup(manifest, options.globalName, prepareChunksId, entryChunksId, retryTemplate);
  }

  apply(compiler){
    var options = this.options;

    compiler.plugin("compilation", (compilation) => {
      if(compilation.compiler !== compiler){//ignore child compiler
        return ;
      }

      compilation.mainTemplate.plugin("render", (source, chunk, hash) => {
        this.registerChunk(chunk);
        return wrapChunkSource(chunk, source, options.globalName);
      });

      compilation.chunkTemplate.plugin("render", (source, chunk, hash) => {
        this.registerChunk(chunk);
        return wrapChunkSource(chunk, source, options.globalName);
      });
    });

    compiler.plugin("after-compile", (compilation, callback) => {
      if(compilation.compiler !== compiler){//ignore child compiler
        return callback();
      }

      compilation.applyPlugins("bundle-ensure-webpack-plugin-created", this);
      var manifest = this.applyPluginsWaterfall("bundle-ensure-webpack-plugin-manifest", compilation);
      var startupScript = this.applyPluginsWaterfall("bundle-ensure-webpack-plugin-render", manifest, compilation);

      if(options.associateWithHtmlPlugin){
        compilation.plugin('html-webpack-plugin-alter-asset-tags', (htmlPluginData, callback) => {
          htmlPluginData.body.push({
            tagName: "script",
            closeTag: true,
            innerHTML: startupScript,
          })
          callback(null, htmlPluginData);
        });
      }
      callback();
    });
      

    /*
    compiler.plugin("emit", (compilation, callback) => {

      compilation.assets["startup.js"] = {
        source:() => startup,
        size:() => startup.length,
      };
      callback();
    });
    */
  }

}


module.exports = BundleEnsureWebpackPlugin;
