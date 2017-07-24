"use strict";

var Tapable = require("tapable");
var util = require("./util/compilation");
var createStartup = require("./createStartup");
var wrapChunkSource = require("./wrapChunkSource");
var templateFactory = require("./templateFactory");

class BundleEnsureWebpackPlugin extends Tapable {
  constructor(options){
    super();
    this.options = Object.assign({
      storeName: "window.__WPE__",
      windowName: "window",
      globalName: "window",
      retryTemplate: "default",
      externals: {}, //retry externals url
      publicPath: "", //retry publicPath
      appendTime: true, //append timestamp to retry url querystring
      associateWithHtmlPlugin: true,
      emitStartup: false,
      minify: true,
      enableLog: true,
      startupFilename:"[name].startup.js",
    }, options || {});

    this.entryChunks = null;
    this.prepareChunks = null;


    this.plugin("count-entry-manifest", (init, entrypoint, compilation) => {
      return this.getManifestForEntry(entrypoint, compilation);
    });
    this.plugin("render-startup", (init, manifest, entrypoints, compilation) => {
      return this.renderStartupScript(compilation, manifest);
    });
  }

  initRegistry(){
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

  findEntrypointsInHtml(chunks, compilation){
    var includeEntryChunksId = new Set();
    chunks.forEach(chunk => {
      if(this.entryChunks.has(chunk.id)){
        includeEntryChunksId.add(chunk.id);
      }
    });
    var entrypoints = new Map();
    for(var entryName in compilation.entrypoints){
      var entrypoint = compilation.entrypoints[entryName];
      var entrypointChunksId = entrypoint.chunks.map(chunk => chunk.id);
      if(entrypointChunksId.find(id => includeEntryChunksId.has(id)) !== undefined){
        entrypoints.set(entryName, entrypoint);
      }
    }
    return entrypoints;
  }

  getManifestForEntry(entrypoint, compilation){
    var manifest = [];

    //collect all externals
    var externals = util.getUsedExternals(compilation);
    externals.forEach((external,name) => {
      manifest.push({
        isExternal:true,
        name:name,
        libraryTarget:external.type,
        _priority:1,
      });
    });

    //collect chunks
    var needChunksId = new Set(entrypoint.chunks.map(chunk => chunk.id));
    this.prepareChunks.forEach((chunk, id) => {
      if(!needChunksId.has(id)) return ;
      var filename = chunk.files[0];
      manifest.push({
        isChunk:true,
        id:id,
        name:chunk.name,
        filename:filename,
        _priority:5,
      });
    });
    this.entryChunks.forEach((chunk, id) => {
      if(!needChunksId.has(id)) return ;
      var filename = chunk.files[0];
      manifest.push({
        isChunk:true,
        id:id,
        name:chunk.name,
        filename:filename,
        _priority:10,
      });
    });

    return manifest;
  }

  mergeManifest(manifestList){
    var mergeMap = new Map(); 
    manifestList.forEach(manifest => {
      manifest.forEach(chunk => {
        if(chunk.isChunk){
          mergeMap.set(chunk.id, chunk);
        }else{
          mergeMap.set(`external ${chunk.name}`, chunk);
        }
      });
    });

    return Array.from(mergeMap.values()).sort((a, b) => a._priority - b._priority);
  }

  renderRetryTemplate(compilation){
    var options = this.options;
    var publicPath = options.publicPath || util.getPublicPath(compilation);

    return templateFactory(options.retryTemplate, publicPath, options.externals, options.appendTime);
  }

  renderStartupScript(compilation, manifest){
    var options = this.options;
    var jsonpFunctionName = util.getJsonpFunctionName(compilation);

    //remove useless
    manifest.forEach(item => {
      delete item._priority;
    });

    var retryTemplate = this.renderRetryTemplate(compilation);

    return createStartup(
      manifest,
      jsonpFunctionName,
      options.storeName,
      options.windowName,
      options.globalName,
      retryTemplate,
      options.minify,
      options.enableLog
    );
  }

  emitStartupScript(compilation, script, entryName){
    var outputFilename = this.getScriptOutputFilename(entryName);
    compilation.assets[outputFilename] = {
      source: () => script,
      size: () => Buffer.byteLength(script),
    };
  }

  getScriptOutputFilename(entryName){
    var filename = this.options.startupFilename;
    filename = filename.replace("[name]", entryName);
    return filename;
  }

  apply(compiler){
    var options = this.options;

    compiler.plugin("compilation", compilation => {
      if(compilation.compiler !== compiler){//ignore child compiler
        return ;
      }

      this.initRegistry();

      var jsonpFunction = util.getJsonpFunctionName(compilation);
      compilation.mainTemplate.plugin("render", (source, chunk, hash) => {
        this.registerChunk(chunk);
        return wrapChunkSource(chunk, source, options.storeName, jsonpFunction);
      });

      compilation.chunkTemplate.plugin("render", (source, chunk, hash) => {
        this.registerChunk(chunk);
        return wrapChunkSource(chunk, source, options.storeName, jsonpFunction);
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

      /*
       * using with html-webpack-plugin
       * take care of using muti entrypoints in one page.
       * should filter out entrypoints through the entry chunks which are included in page.
       */
      if(options.associateWithHtmlPlugin){
        var startupScript;
        compilation.plugin("html-webpack-plugin-alter-asset-tags", (htmlPluginData, callback) => {
          var entrypointsMap = this.findEntrypointsInHtml(htmlPluginData.chunks, compilation);
          var manifests = [];
          entrypointsMap.forEach((point, entryName) => {
            manifests.push(entryManifests.get(entryName));
          });
          var manifest = this.mergeManifest(manifests);
          var entrypoints = Array.from(entrypointsMap.values());
          startupScript = this.applyPluginsWaterfall("render-startup", true, manifest, entrypoints, compilation);

          // can't use tag insert because if user set "inject:false" it will not work.
          // so we have to force inject it by modify the html later, otherwise we have no way to pass it.
          // unless we could add args into html-plugin's template render function.
          /*
          htmlPluginData.body.push({
            tagName: "script",
            closeTag: true,
            innerHTML: startupScript,
          })
          */
          callback(null, htmlPluginData);
        });
        compilation.plugin("html-webpack-plugin-after-html-processing", (htmlPluginData, callback) => {
          htmlPluginData.html = htmlPluginData.html.replace(
            /(<\/body\s*>)/,
            `<script type="text/javascript">${startupScript}</script>$1`
          );
          callback(null, htmlPluginData);
        });
      }

      /*
       * emit startup script to assets. not recommended.
       * the script should be inserted inline to avoid load failure.
       * unless using other way such as server rendering.
       */
      if(options.emitStartup){
        compiler.plugin("emit", (compilation, callback) => {
          entryManifests.forEach((manifest, entryName) => {
            var entrypoint = compilation.entrypoints[entryName];
            var startupScript = this.applyPluginsWaterfall("render-startup", true, manifest, [entrypoint], compilation);
            this.emitStartupScript(compilation, startupScript, entryName);
          });
          callback();
        });
      }
      callback();
    });
  }
}


module.exports = BundleEnsureWebpackPlugin;
