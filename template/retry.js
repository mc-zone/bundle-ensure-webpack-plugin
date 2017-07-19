var url = __info__.url;
console.log("reload: ", url);
var script = document.createElement("script");
script.src = url;
script.async = true;
script.onload = function(){
console.log("reload done: ", url);
  __callback__();
}
document.getElementsByTagName("head")[0].appendChild(script);
