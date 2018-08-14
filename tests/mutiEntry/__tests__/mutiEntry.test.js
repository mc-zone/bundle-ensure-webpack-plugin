var path = require("path");
var fs = require("fs");
var vm = require("vm");

describe("mutiEntry with commonChunk", () => {
  var index1Bundle = fs.readFileSync(path.resolve(__dirname, "../dist/index1.bundle.js"), "utf8");
  var commonBundle = fs.readFileSync(path.resolve(__dirname, "../dist/common.bundle.js"), "utf8");
  var index1Startup = fs.readFileSync(path.resolve(__dirname, "../dist/index1.startup.js"), "utf8");
  var index2Startup = fs.readFileSync(path.resolve(__dirname, "../dist/index2.startup.js"), "utf8");

  var retryFn = jest.fn();
  var consoleLog = jest.fn();
  var consoleError = jest.fn();
  var ctx = null;

  beforeEach(() => {
    retryFn.mockClear();
    consoleLog.mockClear();
    consoleError.mockClear();
    ctx = { window: { retry: retryFn }, console: { log: consoleLog, error: consoleError } };
    vm.createContext(ctx);
  });

  afterEach(() => {
    ctx = null;
  });

  test("muti entrypoint's manifest should separated", () => {
    vm.runInContext(index1Startup, ctx);
    expect(consoleError).toBeCalled();
    expect(retryFn).toHaveBeenCalledTimes(2);
    expect(retryFn.mock.calls[0][0].name).toBe("common");
    expect(retryFn.mock.calls[0][0].url).toBe("common.bundle.js");
    expect(retryFn.mock.calls[1][0].name).toBe("index1");
    expect(retryFn.mock.calls[1][0].url).toBe("index1.bundle.js");

    consoleError.mockClear();
    retryFn.mockClear();
    vm.runInContext(index2Startup, ctx);
    expect(consoleError).toBeCalled();
    expect(retryFn).toHaveBeenCalledTimes(2);
    expect(retryFn.mock.calls[0][0].name).toBe("common");
    expect(retryFn.mock.calls[0][0].url).toBe("common.bundle.js");
    expect(retryFn.mock.calls[1][0].name).toBe("index2");
    expect(retryFn.mock.calls[1][0].url).toBe("index2.bundle.js");

  });

  test("commonChunk should run by startup code, not automatically", () => {
    vm.runInContext(commonBundle, ctx);
    expect(consoleLog).not.toBeCalled();
    expect(ctx.window.__WPE__).toBeDefined();

    vm.runInContext(index1Startup, ctx);
    expect(consoleError).toBeCalled();
    expect(retryFn).toHaveBeenCalledTimes(1);
    expect(retryFn.mock.calls[0][0].name).toBe("index1");
    expect(retryFn.mock.calls[0][0].url).toBe("index1.bundle.js");
    expect(consoleLog).not.toBeCalled();
  });

  test("entry should run by startup code, instead of automatically", () => {
    expect(() => {
      vm.runInContext(index1Bundle, ctx);
    }).not.toThrow();
    expect(ctx.window.__WPE__).toBeDefined();

    vm.runInContext(index1Startup, ctx);
    expect(consoleError).toBeCalled();
    expect(retryFn).toHaveBeenCalledTimes(1);
    expect(retryFn.mock.calls[0][0].name).toBe("common");
    expect(retryFn.mock.calls[0][0].url).toBe("common.bundle.js");

    vm.runInContext(commonBundle, ctx);
    expect(() => {
      vm.runInContext(index1Startup, ctx);
    }).toThrow("I am index1!");
    expect(consoleLog).toBeCalled();
    expect(consoleLog.mock.calls[0][0]).toBe("I am commonLib!");
  });
});
