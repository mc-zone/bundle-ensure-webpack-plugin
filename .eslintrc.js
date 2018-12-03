module.exports = {
  "root": true,
  "env": {
    "node": true,
    "es6": true
  },
  extends: [
    "eslint:recommended",
    "plugin:prettier/recommended"
	],
  "parserOptions": {
    "sourceType": "module",
    "ecmaVersion": 8
  },
  "rules": {
    "prettier/prettier": "error",
    "no-extra-semi": "error",
    "no-template-curly-in-string": "error",
    "no-caller": "error",
    "no-control-regex": "off",
    "yoda": "error",
    "eqeqeq": "error",
    "global-require": "off",
    "brace-style": "off",
    "eol-last": "error",
    "no-extra-bind": "warn",
    "no-process-exit": "warn",
    "no-use-before-define": "off",
    "no-unused-vars": ["error", { args: "none" }],
    "no-unsafe-negation": "error",
    "no-loop-func": "warn",
    "indent": "off",
    "no-console": "off",
    "no-empty": "off",
    "no-multi-spaces": "error",
    "no-multiple-empty-lines": "error",
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "error",
      "double",
      { avoidEscape: true, allowTemplateLiterals: false }
    ],
    "prettier/prettier": ["error", { "singleQuote": false }]
  }
};
