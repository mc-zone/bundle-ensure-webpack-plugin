jasmine.DEFAULT_TIMEOUT_INTERVAL = 20 * 1e3;
jest.dontMock("../../../scripts/phantom-run");
jest.dontMock("phantomjs-prebuilt");

var path = require("path");
var phantomRun = require("../../../scripts/phantom-run");

describe("with externals(HTML)", () => {
  test("should OK when externals completely", () => {
    var script = path.resolve(__dirname, "../scripts/page.phantom.js");
    return phantomRun(script).then(output => {
      expect(output).toEqual(expect.stringContaining("I am index!"));
      expect(output).toEqual(expect.stringContaining("jQuery"));
      expect(output).toEqual(expect.stringContaining("lib1"));
      expect(output).toEqual(expect.stringContaining("lib2"));
      expect(output).toEqual(expect.stringContaining("lodash"));
    });
  });
});
