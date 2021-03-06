const path = require("path");
const fs = require("fs");
const vm = require("vm");

describe("insertPolyfill", () => {
  const bundle = fs.readFileSync(
    path.resolve(__dirname, "../dist/main.bundle.js"),
    "utf8"
  );
  const startupScript = fs.readFileSync(
    path.resolve(__dirname, "../dist/main.startup.js"),
    "utf8"
  );

  const testOutputFn = jest.fn();
  let ctx;
  beforeEach(() => {
    testOutputFn.mockClear();
    ctx = {
      window: { test_output: testOutputFn },
      document: { getElementsByTagName: () => [] }
    };
    vm.createContext(ctx);
  });

  test("polyfill codes should be excuted after ready", () => {
    expect(testOutputFn).not.toBeCalled();
    vm.runInContext(startupScript, ctx, { filename: "main.startup.js" });
    expect(testOutputFn).toHaveBeenCalledTimes(1);
    expect(testOutputFn.mock.calls[0][0]).toBe("polyfill excuted!");
    vm.runInContext(bundle, ctx, { filename: "main.bundle.js" });
    vm.runInContext("window.__WP_CHUNKS_CHECK__();", ctx);
    expect(testOutputFn).toHaveBeenCalledTimes(2);
    expect(testOutputFn.mock.calls[1][0]).toBe("entry excuted!");
  });

  test("polyfill codes should be excuted before entrypoint", () => {
    vm.runInContext(bundle, ctx, { filename: "main.bundle.js" });
    expect(testOutputFn).not.toBeCalled();
    vm.runInContext(startupScript, ctx, { filename: "main.startup.js" });
    expect(testOutputFn).toHaveBeenCalledTimes(2);
    expect(testOutputFn.mock.calls[0][0]).toBe("polyfill excuted!");
    expect(testOutputFn.mock.calls[1][0]).toBe("entry excuted!");
  });
});
