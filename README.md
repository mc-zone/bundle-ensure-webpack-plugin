# bundle-ensure-webpack-plugin [![Build Status](https://travis-ci.org/mc-zone/bundle-ensure-webpack-plugin.svg?branch=master)](https://travis-ci.org/mc-zone/bundle-ensure-webpack-plugin) [![npm version](https://badge.fury.io/js/bundle-ensure-webpack-plugin.svg)](http://badge.fury.io/js/bundle-ensure-webpack-plugin) 

ensure bundle installed and make retry-able before startup.


## Purpose

We know that webpack don't care about how bundle/script loaded, and our entry bundle will be execute immediatly.

So if we have muti chunks (commonChunks) or other bundles (externals, Dlls) on the page, meanwhile **one of them failed to load, the entry will stil be execute and failure**.

We have no chance to detect or reload the missing bundle by webpack itself. Unless we use an entire of script load system (sunch like requireJS) to load all of them in application.

**the `bundle-ensure-webpack-plugin` is what I made for solve this problem:**

- make a wrap to each chunks, prevent the immediate execution.

- count entry's chunk manifest which includes commonChunks, externals, dlls, inline to the page (auto associate with html-webpack-plugin) with startup code.

- check first and ensure all these things are installed before run the entry.

- make a retry/reload hook in runtime for each missing item.

If you are using quite a few split-bundles or externals to one page(with webpack) and have a strong demand for load/reload guarantee (For example, serving for some regions which have weak-network or hijacked frequently). you could try this plugin.


## Useage

Just put the plugin in your webpack.config.js
```diff
module.exports = {
  entry: "./entry.js",
  output: {
    filename: "[name].js"
    path: path.resolve(__dirname, "./dist"),
    publicPath:"https://cdn1.com/", 
  },
  plugins:[
    new webpack.optimize.CommonsChunkPlugin({
      name: "common",
      filename: "commonChunk.js",
    }),

    new HtmlWebpackPlugin(),

+    new BundleEnsureWebpackPlugin({
+      // Provide a alternative publicPath for chunk reload.
+      publicPath:"https://cdn2.com/", 
+    }),
  ]
};
```

Also can check dlls/externals and reload them when they were lost.

```diff
module.exports = {
  //...
  externals:{
    jQuery:"jQuery",
  },
  plugins:[
    //...
    new webpack.DllReferencePlugin({
      name: "myDll",
      manifest: require("./dist/myDll-manifest.json")
    }),

+    new BundleEnsureWebpackPlugin({
+      // Provide urls for externals reload when lost.
+      externals:{
+        myDll: "https://cdn2.com/dist/myDll.js",
+        jQuery: "https://code.jquery.com/jquery-3.2.1.min.js", 
+      }
+    }),
  ]
};
```

Work fine with muti page(muti html-webpack-plugin):

```diff
module.exports = {
  entry: {
    entry1: path.resolve(__dirname,"./entry1.js"),
    entry2: path.resolve(__dirname,"./entry2.js"),
  },
  //...

  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: "common",
      filename: "commonChunk.js",
    }),

    new HtmlWebpackPlugin({
      chunks:["common", "entry1"],
      filename: "index1.html",
    }),
    new HtmlWebpackPlugin({
      chunks:["common", "entry2"], 
      filename: "index2.html",
    }),

+    new webpack.optimize.CommonsChunkPlugin({
+      publicPath:"https://cdn2.com/", 
+    }),
  ]
};
```

See [examples](/examples/).

## Options

- **externals**: Object. provide reload url for each external.

- **publicPath**: String. provide a alternative publicPath for chunk reload.

- **appendTime**: default is `true`, when retry, append timestamp to url's querystring, to avoid cache.

- **associateWithHtmlPlugin**: default is `true`, auto inline the startup code with [`html-webpack-plugin`](https://github.com/jantimon/html-webpack-plugin).

- **retryTemplate**: String. default is `"default"`, can pass a plain javascript code snippet as your own retry handler which will be compiled into startup code.(See the [retry template](/template/retry/))

_ **emitStartup**: default is `false`, output the startup code of each entrypoint to disk. the startup code should be inline to the page to avoid load failure. So this option is not recommended to use unless you are using other way who need it such as server rendering.
- **startupFilename**: String. default is `[name].startup.js`. Only work when `emitStartup` enabled. (files will be output to your `webpackOptions.output.path`).

## License

MIT.
