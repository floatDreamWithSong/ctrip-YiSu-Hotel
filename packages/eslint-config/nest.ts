import globals from "globals";
import baseConfig from "@yisu/eslint-config/base";

/**
 * A custom ESLint configuration for Nest.js.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
const nestJsConfig = [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: "commonjs",
      parserOptions: {
        projectService: true,
        // @ts-expect-error no-check
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["src/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },
  {
    files: [".prettierrc.mjs", "eslint.config.mjs"],
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
  },
];

export default nestJsConfig;