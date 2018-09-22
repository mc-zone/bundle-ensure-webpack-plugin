jasmine.DEFAULT_TIMEOUT_INTERVAL = 20 * 1e3;
jest.dontMock("../../../scripts/phantom-run");
jest.dontMock("phantomjs-prebuilt");

var path = require("path");
var phantomRun = require("../../../scripts/phantom-run");

describe("with htmlPlugin", () => {
  test("should startup when bundles are completely", () => {
    var script = path.resolve(__dirname, "../scripts/page1.phantom.js");
    return phantomRun(script).then(output => {
      expect(output).toEqual(expect.stringContaining("I am commonLib!"));
      expect(output).toEqual(expect.stringContaining("I am index1!"));
    });
  });
});
