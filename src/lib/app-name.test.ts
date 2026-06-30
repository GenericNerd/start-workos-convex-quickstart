import { afterEach, describe, expect, it, vi } from "vitest"
import { getAppName } from "./app-name"

describe("getAppName", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("defaults to My App when VITE_APP_NAME is unset", () => {
    vi.stubEnv("VITE_APP_NAME", undefined)
    expect(getAppName()).toBe("My App")
  })

  it("defaults to My App when VITE_APP_NAME is empty or whitespace", () => {
    vi.stubEnv("VITE_APP_NAME", "   ")
    expect(getAppName()).toBe("My App")
  })

  it("returns the configured app name", () => {
    vi.stubEnv("VITE_APP_NAME", "Acme Corp")
    expect(getAppName()).toBe("Acme Corp")
  })
})
