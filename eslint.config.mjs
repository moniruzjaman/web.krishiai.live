import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Rules that are intentionally kept loose for agricultural content/template strings */
const LOOSE_RULES = {
  // Template-heavy UI code occasionally uses _ prefixed unused params
  "@typescript-eslint/no-unused-vars": ["warn", {
    argsIgnorePattern: "^_",
    varsIgnorePattern: "^_",
    caughtErrorsIgnorePattern: "^_",
  }],
  // Bengali text in JSX may contain apostrophes
  "react/no-unescaped-entities": "off",
  // Next.js <Image> not always possible for dynamic external URLs
  "@next/next/no-img-element": "off",
  // Many third-party libraries don't have TS types
  "@typescript-eslint/no-explicit-any": "warn",
  // API route error handlers catch `any`
  "no-console": ["warn", { allow: ["warn", "error"] }],
};

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // TypeScript rules — keep explicit-any warn (not off), keep unused-vars warn
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/prefer-as-const": "error",
      "@typescript-eslint/no-unused-disable-directive": "off",

      // React rules — keep unescaped-entities off for Bengali, enable the rest
      "react-hooks/exhaustive-deps": "warn",
      "react/display-name": "off",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",

      // Next.js rules
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",

      // General JavaScript — enable meaningful checks
      "prefer-const": "error",
      "no-unused-vars": "off", // Handled by @typescript-eslint/no-unused-vars
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-empty": "warn",
      "no-irregular-whitespace": "error",
      "no-case-declarations": "error",
      "no-fallthrough": "error",
      "no-mixed-spaces-and-tabs": "error",
      "no-redeclare": "error",
      "no-undef": "error",
      "no-unreachable": "error",
      "no-useless-escape": "warn",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "examples/**",
      "skills",
    ],
  },
];

export default eslintConfig;