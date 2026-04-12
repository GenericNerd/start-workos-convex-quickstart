import {  clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type {ClassValue} from "clsx";

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

export function authErrorToMessage(error: string): string {
  switch (error) {
    case "missing_code":
    case "missing_state":
    case "invalid_grant":
      return "Authentication failed, please try again."
    case "email_verification_required":
      return "Please verify your email address before authenticating."
    case "sso_required":
      return "Your organization requires SSO. Use the SSO option to sign in."
    case "sso_connection_not_found":
      return "We could not find an SSO configuration for your account. Contact support."
    case "internal_server_error":
      return "Something went wrong. Please try again in a moment."
    default:
      return "An unknown error occurred, please try again."
  }
}

/** Decodes a pathname from the query string without throwing on malformed input. */
export function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
