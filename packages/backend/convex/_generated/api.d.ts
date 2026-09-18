/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as assets from "../assets.js";
import type * as audit from "../audit.js";
import type * as checkin from "../checkin.js";
import type * as claims from "../claims.js";
import type * as crons from "../crons.js";
import type * as devices from "../devices.js";
import type * as email from "../email.js";
import type * as guardians from "../guardians.js";
import type * as heirs from "../heirs.js";
import type * as http from "../http.js";
import type * as identity from "../identity.js";
import type * as keyring from "../keyring.js";
import type * as model_access from "../model/access.js";
import type * as model_claimFlow from "../model/claimFlow.js";
import type * as model_emailCopy from "../model/emailCopy.js";
import type * as model_jobRuns from "../model/jobRuns.js";
import type * as notifications from "../notifications.js";
import type * as release from "../release.js";
import type * as routing from "../routing.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  assets: typeof assets;
  audit: typeof audit;
  checkin: typeof checkin;
  claims: typeof claims;
  crons: typeof crons;
  devices: typeof devices;
  email: typeof email;
  guardians: typeof guardians;
  heirs: typeof heirs;
  http: typeof http;
  identity: typeof identity;
  keyring: typeof keyring;
  "model/access": typeof model_access;
  "model/claimFlow": typeof model_claimFlow;
  "model/emailCopy": typeof model_emailCopy;
  "model/jobRuns": typeof model_jobRuns;
  notifications: typeof notifications;
  release: typeof release;
  routing: typeof routing;
  seed: typeof seed;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  resend: import("@convex-dev/resend/_generated/component.js").ComponentApi<"resend">;
};
