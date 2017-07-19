var fs = require("fs");
var path = require("path");
var util = require("./lib/util/compilation");
var createStartup = require("./lib/createStartup");
var wrapChunkSource = require("./lib/wrapChunkSource");

class BundleEnsureWebpackPlugin {
  constructor(options={}){
    this.options = options;

    this.globalName = options.globalName || "window.__WPE__";
    this.retryTemplate = options.retryTemplate || fs.readFileSync(path.resolve(__dirname, "./template/retry.js"), "utf8");

    this.entryChunks = new Map();
    this.prepareChunks = new Map();
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

  apply(compiler){
    compiler.plugin("compilation", (compilation) => {
      if(compilation.compiler === compiler){
        compilation.mainTemplate.plugin("render", (source, chunk, hash) => {
          this.registerChunk(chunk);
          return wrapChunkSource(chunk, source, this.globalName);
        });

        compilation.chunkTemplate.plugin("render", (source, chunk, hash) => {
          this.registerChunk(chunk);
          return wrapChunkSource(chunk, source, this.globalName);
        });
      }
    });

    compiler.plugin("emit", (compilation, callback) => {
      var manifest = this.getManifest(compilation);
      var prepareChunksId = Array.from(this.prepareChunks.keys());
      var entryChunksId = Array.from(this.entryChunks.keys());
      var retryTemplate = this.retryTemplate;

      var startup = createStartup(manifest, this.globalName, prepareChunksId, entryChunksId, retryTemplate);

      compilation.assets["startup.js"] = {
        source:() => startup,
        size:() => startup.length,
      };
      callback();
    });
  }

}


module.exports = BundleEnsureWebpackPlugin;
