// PRO-TRX-1 — Minimal ESLint config used by the dedicated CI gate that
// blocks regressions of `react-hooks/set-state-in-effect` inside the
// prospection module.
//
// Why a separate config file?
//   * The base `eslint.config.mjs` is still advisory in CI (`npm run lint
//     || true`) because the repo carries 85 pre-existing errors on unrelated
//     modules. Removing the `|| true` today would break every PR.
//   * We still want a hard block on `set-state-in-effect` in prospection —
//     three Sprint 1 fixes (H5/H7/H8) + one prior hotfix (`8e1405f7`)
//     confirmed this class of bug recurs in this module.
//   * This minimal config enables ONLY the target rule, so the gate fails
//     solely when someone reintroduces the anti-pattern, not because of
//     unrelated pre-existing warnings/errors.
//
// Invoked via `npm run lint:prospection-gate`. See `.github/workflows/ci.yml`.

import reactHooks from "eslint-plugin-react-hooks";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/set-state-in-effect": "error",
    },
  },
];
