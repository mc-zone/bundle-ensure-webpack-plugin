# bundle-ensure-webpack-plugin [![Build Status](https://travis-ci.org/mc-zone/bundle-ensure-webpack-plugin.svg?branch=master)](https://travis-ci.org/mc-zone/bundle-ensure-webpack-plugin) [![npm version](https://badge.fury.io/js/bundle-ensure-webpack-plugin.svg)](http://badge.fury.io/js/bundle-ensure-webpack-plugin) 

Ensure bundle installed and make it retry-able before startup.


## Purpose

We know that webpack don't care about how bundle/script loaded, and our entry bundle will be **execute immediately**.

Assume there were muti chunks (commonChunks/splitedChunks) or other bundles (externals, Dlls) on the page:

```HTML
<script src="./dll/common.bundle.js"></script>
<script src="./commonChunk.bundle.js"></script>
<script src="./entry.bundle.js"></script>
```

Meanwhile if **one of them failed to load, the entry will still be executed and end with throw exception**:

![image](https://user-images.githubusercontent.com/4403937/27761817-fbd0b6c6-5e96-11e7-8c5e-1fdbc411c0ab.png)

![image](https://user-images.githubusercontent.com/4403937/27761025-18deef90-5e87-11e7-8a63-5c10612acf36.png)

[A issue on webpack](https://github.com/webpack/webpack/issues/5197).

We have no chance to detect or reload the missing bundle on webpack. Unless we use an entire of script load system (such as requireJS) to load all of them in the application, but it's too heavy, at least to me.

### So the `bundle-ensure-webpack-plugin` is what I made for solve this problem: ###

- make a wrap to each chunk, prevent the immediate execution. (Compile-time)

- output entry's chunk manifest which includes common chunks, externals, dlls, then inline to the page (auto-associate with html-webpack-plugin) along with startup code. (Compile-time)

- check first and ensure all of these things have existed before running the entry. (Run-time)

- make a hook to retry/reload each missing item. (Run-time)

If you are using quite a few split-bundles or externals(with webpack) and have a strong demand for load/reload guarantee (For example, serving for some regions which have weak-network or hijacked frequently). you could try this plugin.


## Install

```bash
yarn add bundle-ensure-webpack-plugin
```

## Useage

Just add the plugin in your webpack.config.js

```javascript
const BundleEnsureWebpackPlugin = require("bundle-ensure-webpack-plugin");
```

```javascript
module.exports = {
  entry: "./entry.js",
  output: {
    filename: "[name].js"
    path: path.resolve(__dirname, "./dist"),
    publicPath:"https://cdn1.com/", 
  },
  optimization: {
    minimize: false,
    splitChunks: {
      chunks: "all",
      minSize: 0,
      cacheGroups: {
        common: {
          name: "common",
          test: /lib/,
          minSize: 0
        }
      }
    }
  },
  plugins:[
    new HtmlWebpackPlugin(),

    new BundleEnsureWebpackPlugin({
      // Provide a alternative publicPath for chunk reload.
      publicPath:"https://cdn2.com/", 
    }),
  ]
};
```

It also can find dlls/externals and reload them when they were lost.

```javascript
module.exports = {
  //...
  externals:{
    jQuery:"jQuery",
  },
  plugins:[
    new webpack.DllReferencePlugin({
      name: "myDll",
      manifest: require("./dist/myDll-manifest.json")
    }),

    new BundleEnsureWebpackPlugin({
      // Provide urls for externals reload when lost.
      externals:{
        myDll: "https://cdn2.com/dist/myDll.js",
        jQuery: "https://code.jquery.com/jquery-3.2.1.min.js", 
      }
    }),
  ]
};
```

Work fine with muti page(muti html-webpack-plugin):

```javascript
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

    new BundleEnsureWebpackPlugin({
      publicPath:"https://cdn2.com/", 
    }),
  ]
};
```

See [examples](/examples/).

## Options

- **externals**: Object. Provide reload URL for each external.

- **publicPath**: String. Provide an alternative publicPath for chunk reload.

- **appendTime**: Default is `true`, append timestamp to retry URL's querystring to avoid cache.

- **associateWithHtmlPlugin**: Default is `true`, auto inline the startup code into the HTML page with [`html-webpack-plugin`](https://github.com/jantimon/html-webpack-plugin).

- **retryTemplate**: String. Default is `"default"`. You can pass a plain javascript code snippet as your own retry handler which will be inserted into startup code. See the [retry template](/template/retry/))

- **emitStartup**: Default is `false`. Output each entry point's startup code to disk. the startup code should be inline to the page to avoid load failure. So it's not recommended to use unless you are using another way who need it such as server rendering.

- **startupFilename**: String. Default is `[name].startup.js`. Only available while `emitStartup` has enabled. (Files will be outputted to your `webpackOptions.output.path`).

## License

MIT.
