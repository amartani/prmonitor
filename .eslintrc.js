module.exports = {
  parser: "@typescript-eslint/parser", // Specifies the ESLint parser
  extends: [
    "plugin:react/recommended", // Uses the recommended rules from @eslint-plugin-react
    "plugin:react/jsx-runtime", // Automatic JSX runtime (matches tsconfig react-jsx)
    "plugin:@typescript-eslint/recommended", // Uses the recommended rules from @typescript-eslint/eslint-plugin
    "prettier",
  ],
  parserOptions: {
    ecmaVersion: 2020, // Aligns with TypeScript target and modern syntax
    sourceType: "module", // Allows for the use of imports
    ecmaFeatures: {
      jsx: true, // Allows for the parsing of JSX
    },
  },
  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/explicit-member-accessibility": [
      "error",
      {
        accessibility: "no-public",
      },
    ],
    "@typescript-eslint/no-use-before-define": "off",
    "react/no-unescaped-entities": "off",
  },
  settings: {
    react: {
      version: "detect", // Tells eslint-plugin-react to automatically detect the version of React to use
    },
  },
  overrides: [
    {
      files: ["**/*.spec.ts", "src/environment/testing/fake.ts"],
      globals: {
        afterEach: "readonly",
        beforeEach: "readonly",
        describe: "readonly",
        expect: "readonly",
        it: "readonly",
        test: "readonly",
        vi: "readonly",
      },
    },
    {
      // Extension code (popup + service worker graph) must not use Node globals;
      // MV3 workers have no `process` at runtime.
      files: ["src/**/*.ts", "src/**/*.tsx"],
      excludedFiles: ["**/*.spec.ts", "src/environment/testing/**"],
      env: {
        browser: true,
        es2020: true,
      },
      rules: {
        "no-restricted-globals": [
          "error",
          {
            name: "Buffer",
            message:
              "Node global not available in the extension; avoid Buffer in src/.",
          },
          {
            name: "__dirname",
            message:
              "Node global not available in the extension; avoid __dirname in src/.",
          },
          {
            name: "__filename",
            message:
              "Node global not available in the extension; avoid __filename in src/.",
          },
          {
            name: "process",
            message:
              "Use import.meta.env (Vite) instead of process; the service worker bundle has no Node process object.",
          },
          {
            name: "require",
            message:
              "Use ESM import instead of require in extension source.",
          },
        ],
      },
    },
  ],
};
