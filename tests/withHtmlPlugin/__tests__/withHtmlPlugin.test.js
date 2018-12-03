const path = require("path");

describe("with htmlPlugin", () => {
  const testOutputFn = jest.fn();
  const retryFn = jest.fn();
  beforeAll(async () => {
    await page.exposeFunction("test_output", testOutputFn);
    await page.exposeFunction("retry", retryFn);
  });
  beforeEach(async () => {
    testOutputFn.mockClear();
    retryFn.mockClear();
  });

  test("should startup when bundles are completely", async () => {
    await page.goto(
      `file://${path.posix.resolve(__dirname, "../dist/index1.html")}`
    );
    expect(retryFn).not.toBeCalled();
    expect(testOutputFn).toHaveBeenCalledTimes(2);
    expect(testOutputFn.mock.calls[0][0]).toBe("I am commonLib!");
    expect(testOutputFn.mock.calls[1][0]).toBe("I am index1!");
  });

  test("should trigger retry when commonChunk missing", async () => {
    await page.goto(
      `file://${path.posix.resolve(
        __dirname,
        "../dist/index2-missingcommon.html"
      )}`
    );
    expect(retryFn).toHaveBeenCalledTimes(1);
    expect(retryFn.mock.calls[0][0].name).toBe("commonLib");
    expect(testOutputFn).not.toBeCalled();
  });

  test("should trigger retry when entry missing", async () => {
    await page.goto(
      `file://${path.posix.resolve(
        __dirname,
        "../dist/index2-missingindex.html"
      )}`
    );
    expect(retryFn).toHaveBeenCalledTimes(1);
    expect(retryFn.mock.calls[0][0].name).toBe("index2");
    expect(testOutputFn).not.toBeCalled();
  });

  test("should trigger retry when all missing", async () => {
    await page.goto(
      `file://${path.posix.resolve(
        __dirname,
        "../dist/index2-missingall.html"
      )}`
    );
    expect(retryFn).toHaveBeenCalledTimes(2);
    expect(retryFn.mock.calls[0][0].name).toBe("commonLib");
    expect(retryFn.mock.calls[1][0].name).toBe("index2");
    expect(testOutputFn).not.toBeCalled();
  });

  test("should OK when using muti retrypoints", async () => {
    await page.goto(
      `file://${path.posix.resolve(__dirname, "../dist/index-muti.html")}`
    );
    expect(retryFn).not.toBeCalled();
    expect(testOutputFn).toHaveBeenCalledTimes(4);
    expect(testOutputFn.mock.calls[0][0]).toBe("I am commonLib!");
    expect(testOutputFn.mock.calls[1][0]).toBe("I am index2!");
    expect(testOutputFn.mock.calls[2][0]).toBe("I am commonLib!");
    expect(testOutputFn.mock.calls[3][0]).toBe("I am index1!");
  });

  test("should dedup the manifest when using muti retrypoints in one page", async () => {
    await page.goto(
      `file://${path.posix.resolve(
        __dirname,
        "../dist/index-muti-missingcommon.html"
      )}`
    );
    expect(retryFn).toHaveBeenCalledTimes(1);
    expect(retryFn.mock.calls[0][0].name).toBe("commonLib");
    expect(testOutputFn).not.toBeCalled();
  });
});
