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
import type * as billing from "../billing.js";
import type * as checkin from "../checkin.js";
import type * as claims from "../claims.js";
import type * as crons from "../crons.js";
import type * as deliveries from "../deliveries.js";
import type * as devices from "../devices.js";
import type * as email from "../email.js";
import type * as escrow from "../escrow.js";
import type * as heirs from "../heirs.js";
import type * as http from "../http.js";
import type * as identity from "../identity.js";
import type * as jobs from "../jobs.js";
import type * as keyring from "../keyring.js";
import type * as model_access from "../model/access.js";
import type * as model_claimFlow from "../model/claimFlow.js";
import type * as model_didit from "../model/didit.js";
import type * as model_emailCopy from "../model/emailCopy.js";
import type * as model_entitlements from "../model/entitlements.js";
import type * as model_escrowSeal from "../model/escrowSeal.js";
import type * as model_identityHash from "../model/identityHash.js";
import type * as model_jobRuns from "../model/jobRuns.js";
import type * as model_permissions from "../model/permissions.js";
import type * as model_plans from "../model/plans.js";
import type * as model_receivers from "../model/receivers.js";
import type * as model_settings from "../model/settings.js";
import type * as model_staff from "../model/staff.js";
import type * as model_support from "../model/support.js";
import type * as notifications from "../notifications.js";
import type * as outreach from "../outreach.js";
import type * as plans from "../plans.js";
import type * as routing from "../routing.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";
import type * as staff from "../staff.js";
import type * as support_admin from "../support/admin.js";
import type * as support_help from "../support/help.js";
import type * as support_notify from "../support/notify.js";
import type * as support_push from "../support/push.js";
import type * as support_retention from "../support/retention.js";
import type * as support_threads from "../support/threads.js";
import type * as users from "../users.js";
import type * as vault from "../vault.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  assets: typeof assets;
  audit: typeof audit;
  billing: typeof billing;
  checkin: typeof checkin;
  claims: typeof claims;
  crons: typeof crons;
  deliveries: typeof deliveries;
  devices: typeof devices;
  email: typeof email;
  escrow: typeof escrow;
  heirs: typeof heirs;
  http: typeof http;
  identity: typeof identity;
  jobs: typeof jobs;
  keyring: typeof keyring;
  "model/access": typeof model_access;
  "model/claimFlow": typeof model_claimFlow;
  "model/didit": typeof model_didit;
  "model/emailCopy": typeof model_emailCopy;
  "model/entitlements": typeof model_entitlements;
  "model/escrowSeal": typeof model_escrowSeal;
  "model/identityHash": typeof model_identityHash;
  "model/jobRuns": typeof model_jobRuns;
  "model/permissions": typeof model_permissions;
  "model/plans": typeof model_plans;
  "model/receivers": typeof model_receivers;
  "model/settings": typeof model_settings;
  "model/staff": typeof model_staff;
  "model/support": typeof model_support;
  notifications: typeof notifications;
  outreach: typeof outreach;
  plans: typeof plans;
  routing: typeof routing;
  seed: typeof seed;
  settings: typeof settings;
  staff: typeof staff;
  "support/admin": typeof support_admin;
  "support/help": typeof support_help;
  "support/notify": typeof support_notify;
  "support/push": typeof support_push;
  "support/retention": typeof support_retention;
  "support/threads": typeof support_threads;
  users: typeof users;
  vault: typeof vault;
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
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};
