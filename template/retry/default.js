var log = typeof console !== "undefined" ? console : {};
var externalUrls = __EXTERNALS__;
var publicPath = __PUBLIC_PATH__;
var bundleInfo = __BUNDLE_INFO__;
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
  log.log(
    "reloading: " +
      bundleInfo.name +
      " " +
      url + " (" +
      bundleInfo.retryTimes +
      "th)"
  );
  var script = document.createElement("script");
  script.src = url;
  script.async = true;
  var finished = false;
  var timer;
  var finish = function(error) {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    if (error) {
      log.log("reload failed: " + bundleInfo.name + " (" + error.type + ")");
    } else {
      log.log("reload done: " + bundleInfo.name);
    }
    __CALLBACK__();
  };
  script.onload = function() {
    finish();
  };
  script.onerror = function(e) {
    finish(e);
  };
  timer = setTimeout(function() {
    var e = new Error();
    e.type = "timeout";
    finish(e);
  }, 2000);
  document.getElementsByTagName("head")[0].appendChild(script);
}
