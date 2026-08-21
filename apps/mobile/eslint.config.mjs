import { config } from "@workspace/eslint-config/react-internal"
import globals from "globals"

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  { ignores: [".expo/**", "expo-env.d.ts"] },
  {
    // Metro and Babel configs are CommonJS and run in Node, not the app bundle.
    files: ["metro.config.js", "babel.config.js"],
    languageOptions: { globals: globals.node, sourceType: "commonjs" },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
]
