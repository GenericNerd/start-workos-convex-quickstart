import { v } from "convex/values"
import { baseFields } from "../base"
import { changeValidator } from "../utils"

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

const vUserUpdateEvent = v.object({
  event: v.literal("user.update"),
  ...baseFields,
  data: v.object({
    target: v.object({
      id: v.id("users"),
      type: v.literal("user"),
      displayName: v.string(),
    }),
    changes: changeValidator({
      emailVerified: v.boolean(),
      firstName: v.string(),
      lastName: v.string(),
      profilePictureUrl: v.string(),
    }),
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

export { vUserCreateEvent, vUserUpdateEvent, vUserDeleteEvent }
