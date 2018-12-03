const path = require("path");
const fs = require("fs");
const vm = require("vm");

describe("multiple entry with commonChunk", () => {
  const index1Bundle = fs.readFileSync(
    path.resolve(__dirname, "../dist/index1.bundle.js"),
    "utf8"
  );
  const commonBundle = fs.readFileSync(
    path.resolve(__dirname, "../dist/common.bundle.js"),
    "utf8"
  );
  const index1Startup = fs.readFileSync(
    path.resolve(__dirname, "../dist/index1.startup.js"),
    "utf8"
  );
  const index2Startup = fs.readFileSync(
    path.resolve(__dirname, "../dist/index2.startup.js"),
    "utf8"
  );

  const retryFn = jest.fn();
  const testOutputFn = jest.fn();
  const consoleLog = jest.fn();
  const consoleError = jest.fn();
  let ctx = null;

  beforeEach(() => {
    retryFn.mockClear();
    consoleLog.mockClear();
    consoleError.mockClear();
    testOutputFn.mockClear();
    ctx = {
      window: { retry: retryFn, test_output: testOutputFn },
      document: { getElementsByTagName: () => [] },
      console: { log: consoleLog, error: consoleError }
    };
    vm.createContext(ctx);
  });

  afterEach(() => {
    ctx = null;
  });

  test("multiple entrypoint's manifest should separated", () => {
    vm.runInContext(index1Startup, ctx);
    expect(consoleError).toHaveBeenCalledTimes(2);
    expect(consoleError.mock.calls[0][0]).toEqual(
      expect.stringMatching(/common.*missing/)
    );
    expect(consoleError.mock.calls[1][0]).toEqual(
      expect.stringMatching(/index.*missing/)
    );
    expect(retryFn).toHaveBeenCalledTimes(2);
    expect(retryFn.mock.calls[0][0].name).toBe("common");
    expect(retryFn.mock.calls[0][0].filename).toBe("common.bundle.js");
    expect(retryFn.mock.calls[1][0].name).toBe("index1");
    expect(retryFn.mock.calls[1][0].filename).toBe("index1.bundle.js");
    expect(retryFn.mock.calls).toMatchSnapshot();
    consoleError.mockClear();
    retryFn.mockClear();
    vm.runInContext(index2Startup, ctx);
    expect(consoleError).toBeCalled();
    expect(retryFn).toHaveBeenCalledTimes(1);
    expect(retryFn.mock.calls[0][0].name).toBe("index2");
    expect(retryFn.mock.calls[0][0].filename).toBe("index2.bundle.js");
  });

  test("commonChunk should run by startup code, not automatically", () => {
    vm.runInContext(commonBundle, ctx);
    expect(testOutputFn).not.toBeCalled();
    expect(ctx.window.__WP_CHUNKS__).toBeDefined();

    vm.runInContext(index1Startup, ctx);
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0][0]).toEqual(
      expect.stringMatching(/index1.*missing/)
    );
    expect(retryFn).toHaveBeenCalledTimes(1);
    expect(retryFn.mock.calls[0][0].name).toBe("index1");
    expect(retryFn.mock.calls[0][0].filename).toBe("index1.bundle.js");
    expect(testOutputFn).not.toBeCalled();
    expect(() => {
      vm.runInContext(index1Bundle, ctx, { filename: "index1.bundle.js" });
    }).toThrow("I am index1!");
    expect(testOutputFn).toBeCalled();
    expect(testOutputFn.mock.calls[0][0]).toBe("I am commonLib!");
  });

  test("entry should run by startup code, not automatically", () => {
    expect(ctx.window.__WP_CHUNKS__).not.toBeDefined();
    expect(ctx.window.__WP_CHUNKS_CHECK__).not.toBeDefined();
    expect(() => {
      vm.runInContext(index1Bundle, ctx, { filename: "index1.bundle.js" });
    }).not.toThrow();
    expect(ctx.window.__WP_CHUNKS__).toBeDefined();
    expect(ctx.window.__WP_CHUNKS_CHECK__).toBeDefined();

    vm.runInContext(index1Startup, ctx, { filename: "index1.startup.js" });
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0][0]).toEqual(
      expect.stringMatching(/common.*missing/)
    );

    expect(retryFn).toHaveBeenCalledTimes(1);
    expect(retryFn.mock.calls[0][0].name).toBe("common");
    expect(retryFn.mock.calls[0][0].filename).toBe("common.bundle.js");

    expect(() => {
      vm.runInContext(commonBundle, ctx, { filename: "common.bundle.js" });
    }).toThrow("I am index1!");
    expect(testOutputFn).toHaveBeenCalledTimes(1);
    expect(testOutputFn.mock.calls[0][0]).toBe("I am commonLib!");
  });

  test("shouldn't retry again while retrying", () => {
    vm.runInContext(index1Startup, ctx, { filename: "index1.startup.js" });
    expect(consoleError).toHaveBeenCalledTimes(2);
    expect(retryFn).toHaveBeenCalledTimes(2);
    vm.runInContext(
      `
      window.__WP_CHUNKS_CHECK__();
      window.__WP_CHUNKS_CHECK__();
    `,
      ctx
    );
    expect(retryFn).toHaveBeenCalledTimes(2);
    vm.runInContext(
      `
      Object.keys(window.__WP_CHUNKS__).forEach(id => delete window.__WP_CHUNKS__[id]);
      window.__WP_CHUNKS_CHECK__();
      window.__WP_CHUNKS_CHECK__();
    `,
      ctx
    );
    expect(retryFn).toHaveBeenCalledTimes(4);
  });
});
