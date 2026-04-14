const { FlatCompat } = require("@eslint/eslintrc");
const path = require("node:path");

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = [...compat.config(require("./.eslintrc.js"))];
