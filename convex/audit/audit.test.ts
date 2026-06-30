import { describe, expect, it } from "vitest"
import { maskEmail } from "./audit"

describe("maskEmail", () => {
  it("masks the local part of an email address", () => {
    expect(maskEmail("alice@example.com")).toBe("a***e@example.com")
  })

  it("handles short local parts", () => {
    expect(maskEmail("ab@example.com")).toBe("a***@example.com")
  })

  it("returns invalid input unchanged", () => {
    expect(maskEmail("not-an-email")).toBe("not-an-email")
    expect(maskEmail("")).toBe("")
  })
})
