module.exports = {
  "root": true,
  "env": {
    "node": true,
    "es6": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "sourceType": "module",
    "ecmaVersion": 2017
  },
  "rules": {
    "no-console": "off",
    "no-unused-vars": ["error", { "args": "none" }],
    "no-empty": "off",
    "no-multi-spaces": "error",
		"no-multiple-empty-lines": "error",
    "brace-style":"error",
    "arrow-parens": ["error", "as-needed"],
    "indent": ["error", 2, { "SwitchCase": 1 }],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "error",
      "double"
    ],
    "semi": [
      "error",
      "always"
    ]
  }
};
