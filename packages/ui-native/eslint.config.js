import { config } from "@workspace/eslint-config/react-internal"
import globals from "globals"

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    // Build-time tooling: runs in Node, not in the app bundle.
    files: ["scripts/**/*.mjs"],
    languageOptions: { globals: globals.node },
  },
]
