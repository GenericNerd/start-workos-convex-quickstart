import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("getWorkOS", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    delete process.env.WORKOS_API_KEY
  })

  it("throws when WORKOS_API_KEY is not set", async () => {
    const { getWorkOS } = await import("./workos")
    expect(() => getWorkOS()).toThrow("WORKOS_API_KEY is not set")
  })

  it("returns a WorkOS client when the API key is configured", async () => {
    process.env.WORKOS_API_KEY = "sk_test_example"

    const { getWorkOS } = await import("./workos")
    const client = getWorkOS()

    expect(client).toBeDefined()
    expect(client.userManagement).toBeDefined()
  })

  it("reuses the same client instance across calls", async () => {
    process.env.WORKOS_API_KEY = "sk_test_example"

    const { getWorkOS } = await import("./workos")
    const first = getWorkOS()
    const second = getWorkOS()

    expect(second).toBe(first)
  })
})
