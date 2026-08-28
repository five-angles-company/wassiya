import { nextJsConfig } from "@workspace/eslint-config/next-js"
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript"
import importX from "eslint-plugin-import-x"

/**
 * The admin console follows the bulletproof-react layout, and this is the part
 * that keeps it that way.
 *
 * Folders alone are a naming convention: they drift the first time someone is in
 * a hurry, and nothing announces it. These zones make the drift visible.
 *
 * ## The rule: code flows one way, shared → features → app
 *
 * `app/` may import from `features/`, and `features/` may import from
 * `components/`, `lib/`, `config/` and the rest — never the reverse. A shared
 * component that reaches into a feature is no longer shared, and a feature that
 * reaches into `app/` has become a route in disguise.
 *
 * ## Cross-feature imports are blocked too
 *
 * There is one feature today, so that zone does nothing yet — it is written now
 * because it is worth nothing written later, after the second feature has
 * already reached into the first. Features compose at the application level, in
 * `app/`, which is the whole reason `app/` is allowed to see them.
 *
 * ## What this does NOT do
 *
 * `eslint-plugin-only-warn` is applied repo-wide in
 * `@workspace/eslint-config/base`, which downgrades every rule to a warning. So
 * a violation here **reports but does not fail the build**. That is a
 * pre-existing repo-wide choice, not one made here; changing it is a separate
 * decision that would affect every package.
 *
 * The paths are relative to this file, and the TypeScript resolver is what lets
 * the rule see through the `@/*` alias — without it every import would resolve
 * to nothing and the zones would silently never fire.
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
 * Every feature module. **Adding a folder under `features/` means adding it
 * here**, or it silently gets no cross-feature protection at all.
 *
 * That is not hypothetical: this list held only `dashboard` when `claims` was
 * split out, and the one real cross-feature import that split created went
 * unreported until it was found by grep. A zone protects its `target`, so a
 * feature missing from this list is a feature nothing is watching.
 */
const FEATURES = ["claims", "dashboard", "guardians", "identity", "owners"]

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  {
    plugins: { "import-x": importX },
    settings: {
      // The resolver comes from `eslint-import-resolver-typescript`, not from
      // the plugin — the plugin re-exports no such helper, and calling it there
      // fails at config load with "not a function" rather than at lint time.
      "import-x/resolver-next": [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        }),
      ],
    },
    rules: {
      "import-x/no-restricted-paths": [
        "error",
        {
          zones: [
            // Routes may compose features; features may not reach back.
            { target: "./features", from: "./app" },

            // Shared code is shared: it cannot depend on what depends on it.
            { target: SHARED, from: ["./features", "./app"] },

            // One feature may not import another — one zone per feature, so
            // each is protected from all the others. `except` is what keeps a
            // feature able to import *itself* while the zone is expressed as
            // "everything under features/". Shared code goes in `components/`
            // or `lib/`; anything two features both need was never
            // feature-specific to begin with.
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
