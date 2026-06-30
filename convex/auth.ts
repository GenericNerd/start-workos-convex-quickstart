import { AuthKit } from "@convex-dev/workos-authkit"
import { v } from "convex/values"
import { log, logChange, maskEmail } from "./audit/audit"
import { components, internal } from "./_generated/api"
import { internalAction } from "./_generated/server"
import { getUserByAuthKitId } from "./auth/utils"
import type { UserUpdateAuditEvent } from "./audit/events/user"
import type { DataModel } from "./_generated/dataModel"
import type { AuthFunctions } from "@convex-dev/workos-authkit"
import type { MutationCtx, QueryCtx } from "./_generated/server"

type UserProfileSnapshot = {
  email: string
  emailVerified: boolean
  firstName: string
  lastName: string
  profilePictureUrl: string
}

function snapshotUserProfile(user: {
  email: string
  emailVerified: boolean
  firstName?: string | null
  lastName?: string | null
  profilePictureUrl?: string | null
}): UserProfileSnapshot {
  return {
    email: user.email,
    emailVerified: user.emailVerified,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    profilePictureUrl: user.profilePictureUrl ?? "",
  }
}

function buildUserUpdateChanges(
  beforeSnapshot: UserProfileSnapshot,
  afterSnapshot: UserProfileSnapshot
): UserUpdateAuditEvent["data"]["changes"] {
  const before: UserUpdateAuditEvent["data"]["changes"]["before"] = {}
  const after: UserUpdateAuditEvent["data"]["changes"]["after"] = {}

  if (beforeSnapshot.email !== afterSnapshot.email) {
    before.email = beforeSnapshot.email
    after.email = afterSnapshot.email
  }
  if (beforeSnapshot.emailVerified !== afterSnapshot.emailVerified) {
    before.emailVerified = beforeSnapshot.emailVerified
    after.emailVerified = afterSnapshot.emailVerified
  }
  if (beforeSnapshot.firstName !== afterSnapshot.firstName) {
    before.firstName = beforeSnapshot.firstName
    after.firstName = afterSnapshot.firstName
  }
  if (beforeSnapshot.lastName !== afterSnapshot.lastName) {
    before.lastName = beforeSnapshot.lastName
    after.lastName = afterSnapshot.lastName
  }
  if (beforeSnapshot.profilePictureUrl !== afterSnapshot.profilePictureUrl) {
    before.profilePictureUrl = beforeSnapshot.profilePictureUrl
    after.profilePictureUrl = afterSnapshot.profilePictureUrl
  }

  return { before, after }
}

function toStoredProfile(snapshot: UserProfileSnapshot) {
  return {
    email: snapshot.email,
    emailVerified: snapshot.emailVerified,
    firstName: snapshot.firstName === "" ? null : snapshot.firstName,
    lastName: snapshot.lastName === "" ? null : snapshot.lastName,
    profilePictureUrl:
      snapshot.profilePictureUrl === "" ? null : snapshot.profilePictureUrl,
  }
}

export const authKit: AuthKit<DataModel> = new AuthKit<DataModel>(
  components.workOSAuthKit,
  {
    authFunctions: internal.auth as AuthFunctions,
    additionalEventTypes: ["session.created", "session.revoked"],
  }
)

export const updateUserExternalId = internalAction({
  args: v.object({
    userId: v.string(),
    externalId: v.id("users"),
  }),
  handler: async (_ctx, args) => {
    await authKit.workos.userManagement.updateUser({
      userId: args.userId,
      externalId: args.externalId,
    })
  },
})

async function emailToUser(ctx: QueryCtx | MutationCtx, email: string) {
  return await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .first()
}

export const { authKitEvent } = authKit.events({
  "user.created": async (ctx, event) => {
    const user = await ctx.db.insert("users", {
      workOSAuthKitId: event.data.id,
      firstName: event.data.firstName,
      lastName: event.data.lastName,
      email: event.data.email,
      emailVerified: event.data.emailVerified,
      profilePictureUrl: event.data.profilePictureUrl,
    })
    await ctx.scheduler.runAfter(0, internal.auth.updateUserExternalId, {
      userId: event.data.id,
      externalId: user,
    })
    await log(ctx, {
      occurredAt: new Date(event.data.createdAt).getTime(),
      actor: {
        id: user,
        type: "system",
      },
      event: "user.create",
      status: "success",
      data: {
        target: {
          id: user,
          type: "user",
          displayName: maskEmail(event.data.email),
        },
        metadata: {
          provider: "workos",
          emailVerified: event.data.emailVerified,
          workOSAuthKitId: event.data.id,
        },
      },
    })
    return
  },
  "user.updated": async (ctx, event) => {
    const user = await getUserByAuthKitId(ctx, event.data.id)
    if (!user) {
      console.warn(`User not found: ${event.data.id}`)
      return
    }

    const beforeSnapshot = snapshotUserProfile(user)
    const afterSnapshot = snapshotUserProfile(event.data)
    const changes = buildUserUpdateChanges(beforeSnapshot, afterSnapshot)

    await ctx.db.patch("users", user._id, toStoredProfile(afterSnapshot))

    if (Object.keys(changes.after).length === 0) {
      return
    }

    const auditEvent: UserUpdateAuditEvent = {
      occurredAt: new Date(event.data.updatedAt).getTime(),
      actor: {
        id: user._id,
        type: "user",
      },
      event: "user.update",
      status: "success",
      data: {
        target: {
          id: user._id,
          type: "user",
          displayName: maskEmail(afterSnapshot.email),
        },
        changes,
        reason: "Profile updated",
      },
    }

    await logChange(ctx, auditEvent)
    return
  },
  "user.deleted": async (ctx, event) => {
    const user = await getUserByAuthKitId(ctx, event.data.id)
    if (!user) {
      throw new Error("User not found")
    }
    await logChange(ctx, {
      occurredAt: new Date(event.data.createdAt).getTime(),
      actor: {
        id: user._id,
        type: "user",
      },
      event: "user.delete",
      status: "success",
      data: {
        target: {
          id: user._id,
          type: "user",
          displayName: maskEmail(event.data.email),
        },
        changes: {
          before: {
            provider: "workos",
            emailVerified: event.data.emailVerified,
            workOSAuthKitId: event.data.id,
          },
          after: {
            provider: null,
            emailVerified: null,
            workOSAuthKitId: null,
          },
        },
        reason: "User requested deletion",
      },
    })
    await ctx.db.delete("users", user._id)
    return
  },
  "session.created": async (ctx, event) => {
    const target = await getUserByAuthKitId(ctx, event.data.userId)
    if (!target) {
      throw new Error("User not found")
    }
    let actor = target
    let reason = undefined
    if (event.data.impersonator) {
      const impersonator = await emailToUser(ctx, event.data.impersonator.email)
      if (!impersonator) {
        throw new Error("Impersonator not found")
      }
      actor = impersonator
      reason = event.data.impersonator.reason ?? undefined
    }

    await log(ctx, {
      occurredAt: new Date(event.data.createdAt).getTime(),
      actor: {
        id: actor._id,
        type: "user",
      },
      event: "session.create",
      status: "success",
      data: {
        target: {
          id: event.data.id,
          type: "session",
          userId: target._id,
        },
        metadata: {
          reason: reason ?? "Logged in",
        },
        context: {
          ipAddress: event.data.ipAddress ?? "Unknown",
          userAgent: event.data.userAgent ?? "Unknown",
        },
      },
    })
    return
  },
  "session.revoked": async (ctx, event) => {
    const target = await getUserByAuthKitId(ctx, event.data.userId)
    if (!target) {
      throw new Error("User not found")
    }
    let actor = target
    let reason = undefined
    if (event.data.impersonator) {
      const impersonator = await emailToUser(ctx, event.data.impersonator.email)
      if (!impersonator) {
        throw new Error("Impersonator not found")
      }
      actor = impersonator
      reason = event.data.impersonator.reason ?? undefined
    }

    await logChange(ctx, {
      occurredAt: new Date(event.data.createdAt).getTime(),
      actor: {
        id: actor._id,
        type: "user",
      },
      event: "session.revoke",
      status: "success",
      data: {
        target: {
          id: event.data.id,
          type: "session",
          userId: target._id,
        },
        metadata: {
          reason: reason ?? "Logged out",
        },
        changes: {
          before: {
            sessionId: event.data.id,
          },
          after: {
            sessionId: null,
          },
        },
        context: {
          ipAddress: event.data.ipAddress ?? "Unknown",
          userAgent: event.data.userAgent ?? "Unknown",
        },
      },
    })
    return
  },
})
