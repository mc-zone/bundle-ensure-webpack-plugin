var url = bundleInfo.url;
console.log("reload: ", url);
var script = document.createElement("script");
script.src = url;
script.async = true;
script.onload = function(){
  console.log("reload done: ", url);
  callback();
};
document.getElementsByTagName("head")[0].appendChild(script);
