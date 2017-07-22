var path = require("path");
var fs = require("fs");
var vm = require("vm");

describe("singleEntry", () => {
  var bundle = fs.readFileSync(path.resolve(__dirname, "../dist/main.bundle.js"), "utf8");
  var startupScript = fs.readFileSync(path.resolve(__dirname, "../dist/main.startup.js"), "utf8");

  var retryFn = jest.fn();
  var consoleError = jest.fn();
  var ctx = { window: { retry: retryFn }, console: {  error: consoleError } };
  vm.createContext(ctx);

  test("startup should realize chunk dosen't exist and launch retry", () => {
    vm.runInContext(startupScript, ctx);
    expect(consoleError).toBeCalled();
    expect(retryFn).toBeCalled();
    expect(retryFn.mock.calls[0][0].name).toBe("main");
    expect(retryFn.mock.calls[0][0].url).toBe("main.bundle.js");
  });

  test("entry should run by startup code, instead of automatically", () => {
    expect(() => {
      vm.runInContext(bundle, ctx);
    }).not.toThrow();
    expect(ctx.window.__WPE__).toBeDefined();
    expect(() => {
      vm.runInContext(startupScript, ctx);
    }).toThrow("I am index!");
  });
});


