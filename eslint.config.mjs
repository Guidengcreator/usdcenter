import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

const testGlobals = {
  afterAll: "readonly",
  afterEach: "readonly",
  beforeAll: "readonly",
  beforeEach: "readonly",
  describe: "readonly",
  expect: "readonly",
  it: "readonly",
  vi: "readonly",
};

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "backend/drizzle/**",
    ],
  },
  {
    files: ["backend/**/*.ts", "frontend/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: [
      "backend/tests/**/*.ts",
      "backend/vitest.config.ts",
      "frontend/src/**/*.test.ts",
      "frontend/src/**/*.test.tsx",
      "frontend/src/test/**/*.ts",
      "frontend/vite.config.ts",
    ],
    languageOptions: {
      globals: testGlobals,
    },
  },
  {
    files: ["frontend/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs["recommended-latest"].rules,
    },
  },
);
