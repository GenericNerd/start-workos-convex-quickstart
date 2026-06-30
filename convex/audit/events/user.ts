import { v } from "convex/values"
import { baseFields } from "../base"
import type { Infer } from "convex/values"

const vUserCreateEvent = v.object({
  event: v.literal("user.create"),
  ...baseFields,
  data: v.object({
    target: v.object({
      id: v.id("users"),
      type: v.literal("user"),
      displayName: v.string(),
    }),
    metadata: v.object({
      provider: v.literal("workos"),
      emailVerified: v.boolean(),
      workOSAuthKitId: v.string(),
    }),
  }),
})

const vUserUpdateChanges = v.object({
  before: v.object({
    email: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    profilePictureUrl: v.optional(v.string()),
  }),
  after: v.object({
    email: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    profilePictureUrl: v.optional(v.string()),
  }),
})

const vUserUpdateEvent = v.object({
  event: v.literal("user.update"),
  ...baseFields,
  data: v.object({
    target: v.object({
      id: v.id("users"),
      type: v.literal("user"),
      displayName: v.string(),
    }),
    changes: vUserUpdateChanges,
    reason: v.string(),
  }),
})

const vUserDeleteEvent = v.object({
  event: v.literal("user.delete"),
  ...baseFields,
  data: v.object({
    target: v.object({
      id: v.id("users"),
      type: v.literal("user"),
      displayName: v.string(),
    }),
    changes: v.object({
      before: v.object({
        provider: v.literal("workos"),
        emailVerified: v.boolean(),
        workOSAuthKitId: v.string(),
      }),
      after: v.object({
        provider: v.null(),
        emailVerified: v.null(),
        workOSAuthKitId: v.null(),
      }),
    }),
    reason: v.string(),
  }),
})

export { vUserCreateEvent, vUserDeleteEvent, vUserUpdateEvent }
export type UserUpdateAuditEvent = Infer<typeof vUserUpdateEvent>
