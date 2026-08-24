import type { NextConfig } from "next"
import { fileURLToPath } from "node:url"

const nextConfig: NextConfig = {
  // `@workspace/crypto` ships TypeScript source with no build step, like the
  // other two — the heir box opens the release bundle in the browser.
  transpilePackages: ["@workspace/ui", "@workspace/backend", "@workspace/crypto"],
  // Emit a self-contained server (.next/standalone) for a minimal Docker image.
  output: "standalone",
  // Trace from the monorepo root so workspace deps in ../../node_modules are bundled.
  outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)),
}

export default nextConfig
