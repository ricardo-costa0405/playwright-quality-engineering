import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "reports/**"]
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      // Enforce meaningful names
      "id-length": ["error", { min: 3, exceptions: ["i", "id", "x", "y"] }],

      // Prevent hardcoded timeouts - CRITICAL for flakiness prevention
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.property.name='waitForTimeout']",
          message:
            "waitForTimeout is banned. Use state-based waits instead (expect, waitForLoadState, etc.)"
        },
        {
          selector: "CallExpression[callee.name='setTimeout']",
          message: "setTimeout is banned in tests. Use Playwright auto-waiting."
        },
        {
          selector: "CallExpression[callee.name='sleep']",
          message: "sleep is banned. Use expect().toBeVisible() or similar state-based waits."
        }
      ],

      // Enforce async/await
      "require-await": "error",
      "@typescript-eslint/no-floating-promises": "error",

      // Code quality
      "max-len": ["error", { code: 100, ignoreStrings: true, ignoreTemplateLiterals: true }],
      complexity: ["error", 10],
      "max-lines-per-function": ["error", { max: 50, skipBlankLines: true, skipComments: true }],

      // Enforce explicit types
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ]
    }
  }
];
