/**
 * Liveness for the container's `HEALTHCHECK` and the load balancer. It answers
 * whether this server is serving, and nothing about Convex or Clerk: a check
 * that failed when a dependency blipped would have the orchestrator restart a
 * healthy server.
 */
export const dynamic = "force-dynamic"

export function GET() {
  return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } })
}
