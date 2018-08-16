var log = typeof console !== "undefined" ? console : {};
var externalUrls = __EXTERNALS__;
var publicPath = __PUBLIC_PATH__;
var url;
if (bundleInfo.isChunk) {
  url = publicPath + bundleInfo.filename;
} else if (bundleInfo.isExternal && externalUrls) {
  url = externalUrls[bundleInfo.name];
}
if (url) {
  if (__APPEND_TIMESTAMP__) {
    url = (url + "&time=" + new Date().valueOf()).replace(/\?|&/, "?");
  }
  log.log("reload: " + bundleInfo.name + " " + url);
  var script = document.createElement("script");
  script.src = url;
  script.async = true;
  script.onload = function() {
    log.log("reload done: " + bundleInfo.name);
    callback();
  };
  document.getElementsByTagName("head")[0].appendChild(script);
}
