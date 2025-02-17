module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:node/recommended",
    "airbnb-base",
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    "no-console": "warn",
    "import/no-extraneous-dependencies": [
      "error",
      { devDependencies: true },
    ],
    "node/no-unpublished-require": "off",
  },
  ignorePatterns: ["node_modules/", "logs/", ".env"],
};