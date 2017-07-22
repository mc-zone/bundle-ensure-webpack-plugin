jasmine.DEFAULT_TIMEOUT_INTERVAL = 20*1e3;
jest.dontMock("../../../scripts/phantom-run");
jest.dontMock("phantomjs-prebuilt");

var path = require("path");
var phantomRun = require("../../../scripts/phantom-run");

describe("with htmlPlugin", () => {

  test("should trigger retry when commonChunk missing", () => {
    var script = path.resolve(__dirname, "../scripts/page2-1.phantom.js");
    return phantomRun(script)
      .then(output => {
        expect(output).toEqual(expect.stringContaining("retry common"));
        expect(output).not.toEqual(expect.stringContaining("I am index2"));
      });
  });

  test("should trigger retry when entry missing", () => {
    var script = path.resolve(__dirname, "../scripts/page2-2.phantom.js");
    return phantomRun(script)
      .then(output => {
        expect(output).toEqual(expect.stringContaining("retry index2"));
        expect(output).not.toEqual(expect.stringContaining("I am index2"));
      });
  });

  test("should trigger retry when all missing", () => {
    var script = path.resolve(__dirname, "../scripts/page2-3.phantom.js");
    return phantomRun(script)
      .then(output => {
        expect(output).toEqual(expect.stringContaining("retry index2"));
        expect(output).toEqual(expect.stringContaining("retry common"));
        expect(output).not.toEqual(expect.stringContaining("I am index2"));
      });
  });
});
