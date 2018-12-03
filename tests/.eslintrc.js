module.exports = {
  env: {
    jest: true
  },
  extends: ["plugin:node/recommended"],
  globals: {
    jest: false,
    jasmine: false,
    expect: false,
    test: false,
    describe: false,
    beforeEach: false,
    afterEach: false,
    page: false,
    browser: false,
    context: false,
    jestPuppeteer: false,
    document: false,
    window: false
  },
  rules: {
    "no-undef": "error",
    "no-var": "error",
    "node/no-unpublished-require": 0,
    "node/no-missing-require": 0,
    "node/no-extraneous-require": 0,
    "node/no-unsupported-features": "error",
    "node/no-deprecated-api": "error"
  }
};
