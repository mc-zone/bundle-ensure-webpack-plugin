var externalUrls = __EXTERNALS__;
var publicPath = __PUBLIC_PATH__;
var bundleInfo = __BUNDLE_INFO__;

var emptyFn = function() {};
var log =
  typeof console !== "undefined" ? console : { log: emptyFn, warn: emptyFn };

var url;
if (bundleInfo.isChunk) {
  url = publicPath + bundleInfo.filename;
} else if (bundleInfo.isExternal && externalUrls) {
  url = externalUrls[bundleInfo.name];
}

if (!url) {
  log.warn("[Bundle Ensure Plugin] reload url not found: " + bundleInfo.name);
  __GIVEUP__();
} else {
  if (__APPEND_TIMESTAMP__) {
    url = (url + "&time=" + new Date().valueOf()).replace(/\?|&/, "?");
  }
  log.log(
    "[Bundle Ensure Plugin] reloading " +
      bundleInfo.name +
      "(" +
      bundleInfo.id +
      "):" +
      url +
      " (" +
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
      log.warn(
        "[Bundle Ensure Plugin] reload failed: " +
          bundleInfo.name +
          " (" +
          error.type +
          ")"
      );
    } else {
      log.log("[Bundle Ensure Plugin] reload done: " + bundleInfo.name);
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
