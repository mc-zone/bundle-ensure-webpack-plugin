var path = require("path");
var fs = require("fs");
var vm = require("vm");

describe("singleEntry", () => {
  var bundle = fs.readFileSync(
    path.resolve(__dirname, "../dist/main.bundle.js"),
    "utf8"
  );
  var startupScript = fs.readFileSync(
    path.resolve(__dirname, "../dist/main.startup.js"),
    "utf8"
  );

  var retryFn = jest.fn();
  var consoleError = jest.fn();
  var consoleWarn = jest.fn();
  var ctx;
  beforeEach(() => {
    retryFn.mockClear();
    consoleError.mockClear();
    consoleWarn.mockClear();
    ctx = {
      window: { retry: retryFn },
      document: { getElementsByTagName: () => [] },
      console: { error: consoleError, warn: consoleWarn }
    };
    vm.createContext(ctx);
  });
  test("startup should realize chunk dosen't exist and launch retry", () => {
    vm.runInContext(startupScript, ctx, { filename: "main.startup.js" });
    expect(consoleError).toBeCalled();
    expect(retryFn).toBeCalled();
    expect(retryFn.mock.calls[0][0].name).toBe("main");
    expect(retryFn.mock.calls[0][0].filename).toBe("main.bundle.js");
  });

  test("entry shouldn't run immediately but by the startup code", () => {
    expect(() => {
      vm.runInContext(bundle, ctx, { filename: "main.bundle.js" });
    }).not.toThrow();
    expect(ctx.window.__WP_CHUNKS__).toBeDefined();
    expect(() => {
      vm.runInContext(startupScript, ctx);
    }).toThrow("I am index!");
  });

  test("shouldn't trigger more than 3 times retry for one file", () => {
    vm.runInContext(startupScript, ctx, { filename: "main.startup.js" });
    expect(retryFn).toHaveBeenCalledTimes(1);
    vm.runInContext(
      `
      Object.keys(window.__WP_CHUNKS__).forEach(id => delete window.__WP_CHUNKS__[id]);
      window.__WP_CHUNKS_CHECK__();
    `,
      ctx
    );
    expect(retryFn).toHaveBeenCalledTimes(2);
    vm.runInContext(
      `
      Object.keys(window.__WP_CHUNKS__).forEach(id => delete window.__WP_CHUNKS__[id]);
      window.__WP_CHUNKS_CHECK__();
    `,
      ctx
    );
    expect(retryFn).toHaveBeenCalledTimes(3);
    vm.runInContext(
      `
      Object.keys(window.__WP_CHUNKS__).forEach(id => delete window.__WP_CHUNKS__[id]);
      window.__WP_CHUNKS_CHECK__();
    `,
      ctx
    );
    expect(retryFn).toHaveBeenCalledTimes(3);
  });

  test("shouldn't trigger retry func after call giveup", () => {
    vm.runInContext(startupScript, ctx, { filename: "main.startup.js" });
    expect(retryFn).toHaveBeenCalledTimes(1);
    var bundleInfo = retryFn.mock.calls[0][0];
    var giveupFn = retryFn.mock.calls[0][3];
    expect(ctx.window.__WP_CHUNKS__[bundleInfo.id]).toBe(1);

    giveupFn();
    expect(retryFn).toHaveBeenCalledTimes(1);
    expect(ctx.window.__WP_CHUNKS__[bundleInfo.id]).toBeUndefined();
  });

  test("should trigger retry func again when one reload failed, until out of limit", () => {
    vm.runInContext(startupScript, ctx, { filename: "main.startup.js" });
    expect(retryFn).toHaveBeenCalledTimes(1);
    const bundleInfo = retryFn.mock.calls[0][0];
    expect(bundleInfo.name).toBe("main");
    expect(ctx.window.__WP_CHUNKS__[bundleInfo.id]).toBe(1);

    retryFn.mock.calls[0][1]();
    expect(retryFn).toHaveBeenCalledTimes(2);
    expect(ctx.window.__WP_CHUNKS__[bundleInfo.id]).toBe(1);

    retryFn.mock.calls[1][1]();
    expect(retryFn).toHaveBeenCalledTimes(3);
    expect(ctx.window.__WP_CHUNKS__[bundleInfo.id]).toBe(1);

    retryFn.mock.calls[2][1]();
    expect(retryFn).toHaveBeenCalledTimes(3);
    expect(ctx.window.__WP_CHUNKS__).toBe(null);
  });
});
