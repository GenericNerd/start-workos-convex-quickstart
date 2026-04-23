/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as audit_audit from "../audit/audit.js";
import type * as audit_base from "../audit/base.js";
import type * as audit_events_session from "../audit/events/session.js";
import type * as audit_events_user from "../audit/events/user.js";
import type * as audit_utils from "../audit/utils.js";
import type * as auth from "../auth.js";
import type * as auth_utils from "../auth/utils.js";
import type * as http from "../http.js";
import type * as user from "../user.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "audit/audit": typeof audit_audit;
  "audit/base": typeof audit_base;
  "audit/events/session": typeof audit_events_session;
  "audit/events/user": typeof audit_events_user;
  "audit/utils": typeof audit_utils;
  auth: typeof auth;
  "auth/utils": typeof auth_utils;
  http: typeof http;
  user: typeof user;
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
  workOSAuthKit: import("@convex-dev/workos-authkit/_generated/component.js").ComponentApi<"workOSAuthKit">;
};
