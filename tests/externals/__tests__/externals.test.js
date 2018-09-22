var path = require("path");
var fs = require("fs");
var vm = require("vm");

describe("with externals", () => {
  var entryBundle = fs.readFileSync(
    path.resolve(__dirname, "../dist/main.bundle.js"),
    "utf8"
  );
  var startup = fs.readFileSync(
    path.resolve(__dirname, "../dist/main.startup.js"),
    "utf8"
  );

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
    ctx = {
      global: {},
      window: { retry: retryFn },
      document: { getElementsByTagName: () => [] },
      console: { log: consoleLog, warn: consoleWarn, error: consoleError }
    };
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
    var libraryWarnInfo = "",
      reTryNames = [];
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

  test.only("external's status should updated and don't trigger reload again after it reloaded done", () => {
    return new Promise((resolve, reject) => {
      let firstResolver;
      let firstBundle, secondBundle;
      let callTimes = 0;
      let retry = jest.fn((bundleInfo, callback) => {
        if (callTimes === 0) {
          firstBundle = bundleInfo;
          firstResolver = () => callback();
        } else if (callTimes === 1) {
          secondBundle = bundleInfo;
          Promise.resolve()
            .then(() => {
              expect(firstBundle.isExternal).toBeTruthy();
              const currentCallTime = retry.mock.calls.length;
              expect(retry).toHaveBeenCalledTimes(currentCallTime);
              expect(ctx.window.__WP_CHUNKS__[firstBundle.id]).toBe(1);
              expect(ctx.window.__WP_CHUNKS__[secondBundle.id]).toBe(1);
              ctx.window[firstBundle.name] = {};
              firstResolver();
              expect(retry).toHaveBeenCalledTimes(currentCallTime);
              expect(ctx.window.__WP_CHUNKS__[firstBundle.id]).toBe(0);
              expect(ctx.window.__WP_CHUNKS__[secondBundle.id]).toBe(1);
              resolve();
            })
            .catch(reject);
        }
        callTimes++;
      });
      ctx.window.retry = retry;
      vm.runInContext(startup, ctx, { filename: "main.startup.js" });
    });
  });
});
