import { describe, expect, it, vi } from "vitest"
import { getUser, getUserByAuthKitId, requireUser } from "./utils"
import type { Id } from "../_generated/dataModel"
import type { QueryCtx } from "../_generated/server"

type TestUser = {
  _id: Id<"users">
  _creationTime: number
  workOSAuthKitId: string
  email: string
  emailVerified: boolean
}

function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    _id: "users:test" as Id<"users">,
    _creationTime: 1,
    workOSAuthKitId: "user_authkit_123",
    email: "alice@example.com",
    emailVerified: true,
    ...overrides,
  }
}

function createMockCtx({
  identity = null,
  user = null,
}: {
  identity?: { subject: string } | null
  user?: TestUser | null
} = {}) {
  const first = vi.fn().mockResolvedValue(user)
  const eq = vi.fn().mockReturnValue({})
  const withIndex = vi.fn((_indexName, buildRange) => {
    buildRange?.({ eq } as never)
    return { first }
  })
  const query = vi.fn().mockReturnValue({ withIndex })

  return {
    ctx: {
      auth: {
        getUserIdentity: vi.fn().mockResolvedValue(identity),
      },
      db: { query },
    } as unknown as QueryCtx,
    mocks: { query, withIndex, eq, first },
  }
}

describe("getUserByAuthKitId", () => {
  it("queries the users table by workOSAuthKitId", async () => {
    const user = createTestUser()
    const { ctx, mocks } = createMockCtx({ user })

    await expect(
      getUserByAuthKitId(ctx, "user_authkit_123")
    ).resolves.toEqual(user)
    expect(mocks.query).toHaveBeenCalledWith("users")
    expect(mocks.withIndex).toHaveBeenCalledWith(
      "by_workOSAuthKitId",
      expect.any(Function)
    )
    expect(mocks.eq).toHaveBeenCalledWith(
      "workOSAuthKitId",
      "user_authkit_123"
    )
  })
})

describe("getUser", () => {
  it("returns null when there is no authenticated identity", async () => {
    const { ctx } = createMockCtx()
    await expect(getUser(ctx)).resolves.toBeNull()
  })

  it("returns the user for the authenticated identity subject", async () => {
    const user = createTestUser()
    const { ctx, mocks } = createMockCtx({
      identity: { subject: "user_authkit_123" },
      user,
    })

    await expect(getUser(ctx)).resolves.toEqual(user)
    expect(mocks.eq).toHaveBeenCalledWith(
      "workOSAuthKitId",
      "user_authkit_123"
    )
  })
})

describe("requireUser", () => {
  it("throws when the authenticated user cannot be found", async () => {
    const { ctx } = createMockCtx({
      identity: { subject: "user_authkit_123" },
      user: null,
    })

    await expect(requireUser(ctx)).rejects.toThrow("User not found")
  })

  it("returns the user when authenticated and present in the database", async () => {
    const user = createTestUser()
    const { ctx } = createMockCtx({
      identity: { subject: "user_authkit_123" },
      user,
    })

    await expect(requireUser(ctx)).resolves.toEqual(user)
  })
})
