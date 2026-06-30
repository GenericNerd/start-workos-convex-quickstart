import { describe, expect, it } from "vitest"
import { authErrorToMessage, safeDecodeURIComponent } from "./utils"

describe("authErrorToMessage", () => {
  it("maps known WorkOS OAuth errors to user-friendly messages", () => {
    expect(authErrorToMessage("missing_code")).toBe(
      "Authentication failed, please try again."
    )
    expect(authErrorToMessage("email_verification_required")).toBe(
      "Please verify your email address before authenticating."
    )
    expect(authErrorToMessage("sso_required")).toBe(
      "Your organization requires SSO. Use the SSO option to sign in."
    )
  })

  it("returns a generic message for unknown errors", () => {
    expect(authErrorToMessage("something_else")).toBe(
      "An unknown error occurred, please try again."
    )
  })
})

describe("safeDecodeURIComponent", () => {
  it("decodes valid URI components", () => {
    expect(safeDecodeURIComponent("%2Faccount")).toBe("/account")
  })

  it("returns the original string when decoding fails", () => {
    expect(safeDecodeURIComponent("%E0%A4%A")).toBe("%E0%A4%A")
  })
})
