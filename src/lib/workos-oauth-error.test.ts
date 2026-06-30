import { describe, expect, it } from "vitest"
import { workOsOAuthRawDataFromCatch } from "./workos-oauth-error"

describe("workOsOAuthRawDataFromCatch", () => {
  it("returns rawData when present on an Error", () => {
    const error = new Error("oauth failed") as Error & {
      rawData: Record<string, unknown>
    }
    error.rawData = { code: "email_verification_required" }

    expect(workOsOAuthRawDataFromCatch(error)).toEqual({
      code: "email_verification_required",
    })
  })

  it("returns undefined for non-Error values", () => {
    expect(workOsOAuthRawDataFromCatch("nope")).toBeUndefined()
  })

  it("returns undefined when rawData is not a plain object", () => {
    const error = new Error("oauth failed") as Error & { rawData: unknown }
    error.rawData = null
    expect(workOsOAuthRawDataFromCatch(error)).toBeUndefined()
  })
})
