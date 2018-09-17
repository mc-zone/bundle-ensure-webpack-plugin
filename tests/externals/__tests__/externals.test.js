var path = require("path");
var fs = require("fs");
var vm = require("vm");

describe("with externals", () => {
  var entryBundle = fs.readFileSync(path.resolve(__dirname, "../dist/main.bundle.js"), "utf8");
  var startup = fs.readFileSync(path.resolve(__dirname, "../dist/main.startup.js"), "utf8");

  var retryFn = jest.fn();
  var consoleLog = jest.fn();
  var consoleWarn = jest.fn();
  var consoleError = jest.fn();
  var ctx = null;

  beforeEach(() => {
    retryFn.mockClear();
    consoleLog.mockClear();
    consoleWarn.mockClear();
    consoleError.mockClear();
    ctx = { global:{}, window: { retry: retryFn }, console: { log: consoleLog, warn: consoleWarn, error: consoleError } };
    vm.createContext(ctx);
  });

  afterEach(() => {
    ctx = null;
  });

  test("should check externals", () => {
    expect(() => {
      vm.runInContext(entryBundle, ctx);
    }).not.toThrow();

    vm.runInContext(startup, ctx);
    expect(consoleError).toBeCalled();
    expect(consoleLog).not.toBeCalled();
    expect(retryFn).toBeCalled();
  });

  test("should skip non-global externals (can't check)", () => {
    vm.runInContext(entryBundle, ctx);
    vm.runInContext(startup, ctx);
    expect(consoleWarn).toBeCalled();
    var libraryWarnInfo = "", reTryNames = [];
    consoleWarn.mock.calls.forEach(call => {
      libraryWarnInfo += call[0];
    });
    retryFn.mock.calls.forEach(call => {
      reTryNames.push(call[0].name);
    });
    expect(libraryWarnInfo).toEqual(expect.stringContaining("lodash"));
    expect(libraryWarnInfo).toEqual(expect.stringContaining("commonjs"));
    expect(libraryWarnInfo).not.toEqual(expect.stringContaining("jQuery"));

    expect(reTryNames).toEqual(expect.arrayContaining(["jQuery", "commonLib"]));
    expect(reTryNames).not.toEqual(expect.arrayContaining(["lodash"]));
  });

});
