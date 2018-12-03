"use strict";

const { Tapable, SyncHook, SyncWaterfallHook } = require("tapable");
const util = require("./util/compilation");
const createStartup = require("./createStartup");
const modifyStartup = require("./modifyStartup");
const wrapChunkSource = require("./wrapChunkSource");
const templateFactory = require("./templateFactory");

class BundleEnsureWebpackPlugin extends Tapable {
  constructor(options) {
    super();
    this.options = Object.assign(
      {
        storeName: "window.__WP_CHUNKS__",
        checkerName: "window.__WP_CHUNKS_CHECK__",
        windowName: "window",
        globalName: "window",
        retryTemplate: "default",
        polyfill: "",
        externals: {}, //retry externals url
        publicPath: "", //retry publicPath
        appendTime: true, //append timestamp to retry url querystring
        associateWithHtmlPlugin: true,
        emitStartup: false,
        minify: true,
        enableLog: true,
        startupFilename: "[name].startup.js"
      },
      options || {}
    );

    this.entryChunks = null;
    this.prepareChunks = null;

    this.hooks = {
      countEntryManifest: new SyncWaterfallHook([
        "init",
        "entrypoint",
        "compilation"
      ]),
      renderStartup: new SyncWaterfallHook([
        "init",
        "manifest",
        "entrypoints",
        "compilation"
      ])
    };

    this.hooks.countEntryManifest.tap(
      "BundleEnsureWebpackPlugin",
      (init, entrypoint, compilation) => {
        return this.getManifestForEntry(entrypoint, compilation);
      }
    );
    this.hooks.renderStartup.tap(
      "BundleEnsureWebpackPlugin",
      (init, manifest, entrypoints, compilation) => {
        return this.renderStartupScript(compilation, manifest);
      }
    );
  }

  initRegistry() {
    this.entryChunks = new Map();
    this.prepareChunks = new Map();
  }

  registerChunk(chunk) {
    if (chunk.hasEntryModule()) {
      this.entryChunks.set(chunk.id, chunk);
    } else {
      this.prepareChunks.set(chunk.id, chunk);
    }
  }

  findEntrypointsInHtml(chunks, compilation) {
    const includeEntryChunksId = new Set();
    chunks.forEach(chunk => {
      if (this.entryChunks.has(chunk.id)) {
        includeEntryChunksId.add(chunk.id);
      }
    });
    const entrypoints = new Map();
    compilation.entrypoints.forEach((entrypoint, entryName) => {
      const entrypointChunksId = entrypoint.chunks.map(chunk => chunk.id);
      if (
        entrypointChunksId.find(id => includeEntryChunksId.has(id)) !==
        undefined
      ) {
        entrypoints.set(entryName, entrypoint);
      }
    });
    return entrypoints;
  }

  getManifestForEntry(entrypoint, compilation) {
    const manifest = [];

    //collect all externals
    const externals = util.getUsedExternals(compilation);
    externals.forEach((external, name) => {
      manifest.push({
        isExternal: true,
        id: `external ${name}`,
        name: name,
        libraryTarget: external.externalType,
        _priority: 1
      });
    });

    //collect chunks
    const needChunksId = new Set(entrypoint.chunks.map(chunk => chunk.id));
    this.prepareChunks.forEach((chunk, id) => {
      if (!needChunksId.has(id)) return;
      const filename = util.getChunkMainAssetFilename(chunk, compilation);
      manifest.push({
        isChunk: true,
        id: id,
        name: chunk.name,
        filename: filename,
        _priority: 5
      });
    });
    this.entryChunks.forEach((chunk, id) => {
      if (!needChunksId.has(id)) return;
      const filename = util.getChunkMainAssetFilename(chunk, compilation);
      manifest.push({
        isChunk: true,
        id: id,
        name: chunk.name,
        filename: filename,
        _priority: 10
      });
    });

    return manifest;
  }

  mergeManifest(manifestList) {
    const mergeMap = new Map();
    manifestList.forEach(manifest => {
      manifest.forEach(chunk => {
        if (chunk.isChunk) {
          mergeMap.set(chunk.id, chunk);
        } else {
          mergeMap.set(`external ${chunk.name}`, chunk);
        }
      });
    });

    return Array.from(mergeMap.values()).sort(
      (a, b) => a._priority - b._priority
    );
  }

  renderStartupScript(compilation, manifest) {
    const options = this.options;
    const jsonpFunctionName = util.getJsonpFunctionName(compilation);
    const publicPath = options.publicPath || util.getPublicPath(compilation);

    //remove useless
    manifest.forEach(item => {
      delete item._priority;
    });

    return createStartup(
      templateFactory(options.retryTemplate),
      manifest,
      jsonpFunctionName,
      publicPath,
      options
    );
  }

  emitStartupScript(compilation, script, entryName) {
    const outputFilename = this.getScriptOutputFilename(entryName);
    compilation.assets[outputFilename] = {
      source: () => script,
      size: () => Buffer.byteLength(script)
    };
  }

  getScriptOutputFilename(entryName) {
    let filename = this.options.startupFilename;
    filename = filename.replace("[name]", entryName);
    return filename;
  }

  apply(compiler) {
    const options = this.options;

    compiler.hooks.compilation.tap("BundleEnsureWebpackPlugin", compilation => {
      if (compilation.compiler !== compiler) {
        //ignore child compiler
        return;
      }
      compilation.hooks.bundleEnsureWebpackPluginCreated = new SyncHook([
        "pluginInstance"
      ]);

      this.initRegistry();

      compilation.mainTemplate.hooks.startup.tap(
        "BundleEnsureWebpackPlugin",
        (source, chunk, hash) => {
          return modifyStartup(source, chunk, hash, options.checkerName);
        }
      );

      compilation.mainTemplate.hooks.render.tap(
        "BundleEnsureWebpackPlugin",
        (source, chunk, hash) => {
          if (!chunk.isOnlyInitial()) {
            return source;
          }
          this.registerChunk(chunk);
          return wrapChunkSource(
            chunk,
            source,
            options.storeName,
            options.windowName
          );
        }
      );

      compilation.chunkTemplate.hooks.render.tap(
        "BundleEnsureWebpackPlugin",
        (source, chunk, hash) => {
          if (!chunk.isOnlyInitial()) {
            return source;
          }
          this.registerChunk(chunk);
          return wrapChunkSource(
            chunk,
            source,
            options.storeName,
            options.windowName
          );
        }
      );
    });

    compiler.hooks.afterCompile.tapAsync(
      "BundleEnsureWebpackPlugin",
      (compilation, callback) => {
        if (compilation.compiler !== compiler) {
          //ignore child compiler
          return callback();
        }

        compilation.hooks.bundleEnsureWebpackPluginCreated.call(this);

        const entryManifests = new Map();
        compilation.entrypoints.forEach((entrypoint, entryName) => {
          const manifest = this.hooks.countEntryManifest.call(
            true,
            entrypoint,
            compilation
          );
          entryManifests.set(entryName, manifest);
        });

        /*
         * using with html-webpack-plugin
         * take care of using multi entrypoints in one page.
         * should filter out entrypoints through the entry chunks which are included in page.
         */
        if (options.associateWithHtmlPlugin) {
          let startupScript;
          const {
            htmlWebpackPluginAlterAssetTags,
            htmlWebpackPluginAfterHtmlProcessing
          } = compilation.hooks;
          htmlWebpackPluginAlterAssetTags &&
            htmlWebpackPluginAlterAssetTags.tapAsync(
              "BundleEnsureWebpackPlugin",
              (htmlPluginData, callback) => {
                const entrypointsMap = this.findEntrypointsInHtml(
                  htmlPluginData.chunks,
                  compilation
                );
                const manifests = [];
                entrypointsMap.forEach((point, entryName) => {
                  manifests.push(entryManifests.get(entryName));
                });
                const manifest = this.mergeManifest(manifests);
                const entrypoints = Array.from(entrypointsMap.values());
                startupScript = this.hooks.renderStartup.call(
                  true,
                  manifest,
                  entrypoints,
                  compilation
                );

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
              }
            );
          htmlWebpackPluginAfterHtmlProcessing &&
            htmlWebpackPluginAfterHtmlProcessing.tapAsync(
              "BundleEnsureWebpackPlugin",
              (htmlPluginData, callback) => {
                htmlPluginData.html = htmlPluginData.html.replace(
                  /(<\/body\s*>)/,
                  `<script type="text/javascript">${startupScript}</script>$1`
                );
                callback(null, htmlPluginData);
              }
            );
        }

        /*
         * emit startup script to assets. not recommended.
         * the script should be inserted inline to avoid load failure.
         * unless using other way such as server rendering.
         */
        if (options.emitStartup) {
          compiler.hooks.emit.tapAsync(
            "BundleEnsureWebpackPlugin",
            (compilation, callback) => {
              entryManifests.forEach((manifest, entryName) => {
                const entrypoint = compilation.entrypoints.get(entryName);
                const startupScript = this.hooks.renderStartup.call(
                  true,
                  manifest,
                  [entrypoint],
                  compilation
                );
                this.emitStartupScript(compilation, startupScript, entryName);
              });
              callback();
            }
          );
        }
        callback();
      }
    );
  }
}

module.exports = BundleEnsureWebpackPlugin;
