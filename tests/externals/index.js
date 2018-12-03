const $ = require("jquery");
const lib1 = require("./lib1");
const lib2 = require("./lib2");
const _ = require("lodash");

/* eslint-disable */
window.test_output("I am index!");
window.test_output($, lib1, lib2, _);
/* eslint-enable */
