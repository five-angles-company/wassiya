import type { MetadataRoute } from "next"

/** Nothing here is meant to be found by search; see the root layout. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } }
}
