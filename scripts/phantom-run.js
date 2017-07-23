var phantomjs = require("phantomjs-prebuilt");


module.exports = function(script, args, timeout=10*1e3){
  return new Promise((resolve, reject) => {
    var runner = phantomjs.exec.bind(phantomjs, script);
    var program = runner.apply(phantomjs, args);
    var timeoutId = -1;
    var stdout = "", stderr = "";

    function done(){
      clearTimeout(timeoutId);
      resolve(stdout + stderr);
    }
    function fail(error){
      clearTimeout(timeoutId);
      if(!error){
        error = new Error(stderr);
      }
      error.stdout = stdout;
      error.stderr = stderr;
      reject(error);
    }

    program.stdout.on("data", data => {
      stdout += data;
    });
    program.stderr.on("data", data => {
      stderr += data;
    });
    program.on("error", err => {
      fail(err);
    });
    program.on("exit", code => {
      code == 0 ? done() : fail(`phantom exit with non-zero code: ${code}`);
    });

    timeoutId = setTimeout(() => {
      fail(new Error("phantom timeout"));
      program.kill("SIGINT");
    }, timeout);
  });
};
