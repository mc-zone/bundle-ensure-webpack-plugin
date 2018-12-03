const path = require("path");
const fs = require("fs");
const vm = require("vm");

describe("with externals", () => {
  const entryBundle = fs.readFileSync(
    path.resolve(__dirname, "../dist/main.bundle.js"),
    "utf8"
  );
  const startup = fs.readFileSync(
    path.resolve(__dirname, "../dist/main.startup.js"),
    "utf8"
  );

  const retryFn = jest.fn();
  const consoleLog = jest.fn();
  const consoleWarn = jest.fn();
  const consoleError = jest.fn();
  const testOutputFn = jest.fn();
  let ctx = null;

  beforeEach(() => {
    retryFn.mockClear();
    consoleLog.mockClear();
    consoleWarn.mockClear();
    consoleError.mockClear();
    testOutputFn.mockClear();
    ctx = {
      global: {},
      window: { retry: retryFn, test_output: testOutputFn },
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
    expect(testOutputFn).not.toBeCalled();
    expect(retryFn).toHaveBeenCalledTimes(2);
    expect(retryFn.mock.calls[0][0].name).toBe("commonLib");
    expect(retryFn.mock.calls[1][0].name).toBe("jQuery");
  });

  test("should skip non-global externals (can't check)", () => {
    vm.runInContext(entryBundle, ctx);
    vm.runInContext(startup, ctx);
    expect(consoleWarn).toBeCalled();
    let libraryWarnInfo = "";
    const reTryNames = [];
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

  test("external's status should updated and don't trigger reload again after it reloaded done", () => {
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

  test("should OK when externals completely", async () => {
    const requireFn = jest.fn();
    const page = await browser.newPage();
    await page.exposeFunction("retry", retryFn);
    await page.exposeFunction("require", requireFn);
    await page.exposeFunction("test_output", testOutputFn);
    await page.goto(
      `file://${path.posix.join(__dirname, "../dist/index.html")}`
    );
    expect(retryFn).toHaveBeenCalledTimes(1);
    expect(retryFn.mock.calls[0][0].name).toBe("jQuery");
    expect(testOutputFn).not.toHaveBeenCalled();
    await page.evaluate(() => {
      window.jQuery = "jQuery";
      window.__WP_CHUNKS_CHECK__();
    });
    expect(testOutputFn).toHaveBeenCalledTimes(2);
    expect(testOutputFn.mock.calls[0][0]).toBe("I am index!");
    expect(testOutputFn.mock.calls[1][0]).toBe("jQuery");
    expect(testOutputFn.mock.calls[1][1]).toBe("lib1");
    expect(testOutputFn.mock.calls[1][2]).toBe("lib2");
    expect(requireFn.mock.calls[0][0]).toBe("lodash");
  });
});
