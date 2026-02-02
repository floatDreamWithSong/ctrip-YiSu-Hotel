import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig } from "eslint/config";

const baseConfig = defineConfig(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks as any,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "warn",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ...reactRefresh.configs.vite,
  },
  {
    files: ["**/*.{js,jsx}"],
    ...js.configs.recommended,
  },
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "*.config.js",
      "*.config.ts",
      "vite.config.ts",
      "routeTress.gen.ts",
      "public/**",
    ],
  }
);

export default baseConfig;