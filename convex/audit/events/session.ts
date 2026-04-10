import { v } from "convex/values"
import { actorFields, baseFields } from "../base"

const vSessionCreateEvent = v.object({
  event: v.literal("session.create"),
  ...baseFields,
  data: v.object({
    target: v.object({
      ...actorFields,
    }),
    metadata: v.object({
      sessionId: v.string(),
      reason: v.optional(v.string()),
    }),
    context: v.object({
      ipAddress: v.string(),
      userAgent: v.string(),
    }),
  }),
})

const vSessionRevokeEvent = v.object({
  event: v.literal("session.revoke"),
  ...baseFields,
  data: v.object({
    target: v.object({
      ...actorFields,
    }),
    metadata: v.object({
      reason: v.optional(v.string()),
    }),
    changes: v.object({
      before: v.object({
        sessionId: v.string(),
      }),
      after: v.object({
        sessionId: v.null(),
      }),
    }),
    context: v.object({
      ipAddress: v.string(),
      userAgent: v.string(),
    }),
  }),
})

export { vSessionCreateEvent, vSessionRevokeEvent }
