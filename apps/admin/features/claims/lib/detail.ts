import type { api } from "@workspace/backend/api"
import type { FunctionReturnType } from "convex/server"

export type ClaimDetail = NonNullable<
  FunctionReturnType<typeof api.admin.claimDetail>
>
