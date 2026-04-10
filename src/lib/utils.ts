import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
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
    default:
      return "An unknown error occurred, please try again."
  }
}
