import { api } from "@workspace/backend/api"
import { ConvexHttpClient } from "convex/browser"
import type { FunctionReturnType } from "convex/server"

import { SITE } from "@/config/site"

export type PublishedPlans = FunctionReturnType<typeof api.plans.published>

let pending: Promise<PublishedPlans | null> | undefined

/**
 * The tier limits, read once per build from `plans.published`.
 *
 * `null` means the Plans section renders its sentence without numbers. That is
 * never wrong, only less specific — so an unreachable deployment degrades the
 * page instead of failing the deploy. The warning is loud so a production build
 * that lost its numbers does not do so silently.
 *
 * ⚠️ What this returns is frozen into the HTML. A plan edited in the console
 * reaches the site only when the landing is rebuilt, which is why its turbo
 * build is uncached.
 */
export function loadPlans(): Promise<PublishedPlans | null> {
  pending ??= fetchPlans()
  return pending
}

async function fetchPlans(): Promise<PublishedPlans | null> {
  if (SITE.convexUrl === undefined) {
    console.warn("[landing] PUBLIC_CONVEX_URL is not set; the Plans section renders without numbers.")
    return null
  }
  try {
    return await new ConvexHttpClient(SITE.convexUrl).query(api.plans.published, {})
  } catch (error) {
    console.warn(
      `[landing] plans.published failed on ${SITE.convexUrl}; the Plans section renders without numbers.`,
      error
    )
    return null
  }
}
