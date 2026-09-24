import { nextJsConfig } from "@workspace/eslint-config/next-js"
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript"
import importX from "eslint-plugin-import-x"

/**
 * Shared layers. Code here is imported *by* features and routes, so it may
 * never import back — that is what keeps a dependency graph from becoming a
 * knot.
 *
 * `types` and `utils` do not exist yet. Listing them is deliberate: a zone for
 * a missing folder is inert, and becomes live the day someone creates it.
 */
const SHARED = [
  "./components",
  "./config",
  "./hooks",
  "./lib",
  "./stores",
  "./types",
  "./utils",
]

/**
 * Every folder under `features/`.
 *
 * **Adding a feature means adding it here**, or it silently gets no cross-
 * feature protection at all.
 */
const FEATURES = [
  "account",
  "box",
  "claims",
  "notifications",
  "overview",
  "support",
]

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  {
    plugins: { "import-x": importX },
    settings: {
      // `createTypeScriptImportResolver` comes from the resolver package, not
      // from `eslint-plugin-import-x` — importing it from the plugin fails at
      // config load with "not a function" rather than at lint time.
      "import-x/resolver-next": [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        }),
      ],
    },
    rules: {
      // Code flows one way: shared → features → app.
      //
      // Note that `eslint-plugin-only-warn` is applied repo-wide in
      // `@workspace/eslint-config/base`, so a violation here reports but does
      // not fail the build. It is a design conversation, not a gate.
      "import-x/no-restricted-paths": [
        "error",
        {
          zones: [
            // Routes may compose features; features may not reach back.
            { target: "./features", from: "./app" },

            // Shared code cannot depend on what depends on it.
            { target: SHARED, from: ["./features", "./app"] },

            // A feature may import itself and nothing else under `features/`.
            ...FEATURES.map((feature) => ({
              target: `./features/${feature}`,
              from: "./features",
              except: [`./${feature}`],
            })),
          ],
        },
      ],
    },
  },
]
