var path = require("path");
var fs = require("fs");
var vm = require("vm");

describe("singleEntry", () => {
  var bundle = fs.readFileSync(path.resolve(__dirname, "../dist/main.bundle.js"), "utf8");
  var startupScript = fs.readFileSync(path.resolve(__dirname, "../dist/main.startup.js"), "utf8");

  var retryFn = jest.fn();
  var consoleError = jest.fn();
  var ctx;
  beforeEach(() => {
    retryFn.mockClear();
    consoleError.mockClear();
    ctx = { window: { retry: retryFn }, console: { error: consoleError } };
    vm.createContext(ctx);
  });
  test("startup should realize chunk dosen't exist and launch retry", () => {
    vm.runInContext(startupScript, ctx);
    expect(consoleError).toBeCalled();
    expect(retryFn).toBeCalled();
    expect(retryFn.mock.calls[0][0].name).toBe("main");
    expect(retryFn.mock.calls[0][0].filename).toBe("main.bundle.js");
  });

  test("entry shouldn't run immediately but by the startup code", () => {
    expect(() => {
      vm.runInContext(bundle, ctx);
    }).not.toThrow();
    expect(ctx.window.__WP_CHUNKS__).toBeDefined();
    expect(() => {
      vm.runInContext(startupScript, ctx);
    }).toThrow("I am index!");
  });
});
