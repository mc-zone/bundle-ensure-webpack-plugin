jasmine.DEFAULT_TIMEOUT_INTERVAL = 20*1e3;
jest.dontMock("../../../scripts/phantom-run");
jest.dontMock("phantomjs-prebuilt");

var path = require("path");
var phantomRun = require("../../../scripts/phantom-run");

describe("with htmlPlugin", () => {

  test("should OK when using muti retrypoints", () => {
    var script = path.resolve(__dirname, "../scripts/page3-1.phantom.js");
    return phantomRun(script)
      .then(output => {
        expect(output).not.toEqual(expect.stringContaining("retry"));
        expect(output).toEqual(expect.stringContaining("I am index1!"));
        expect(output).toEqual(expect.stringContaining("I am index2!"));
      });
  });

  test("should dedup the manifest when using muti retrypoints in one page", () => {
    var script = path.resolve(__dirname, "../scripts/page3-2.phantom.js");
    return phantomRun(script)
      .then(output => {
        expect(output).toEqual(expect.stringContaining("retry common"));
        expect(output.match(/retry\scommon/g).length).toBe(1);
        expect(output).not.toEqual(expect.stringContaining("I am index2"));
      });
  });

});
