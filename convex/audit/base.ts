import { v } from "convex/values"

export const actorFields = {
  id: v.id("users"),
  type: v.union(v.literal("user"), v.literal("system")),
}

export const contextFields = {
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
}

export const statusFields = v.union(v.literal("success"), v.literal("error"))

export const baseFields = {
  occurredAt: v.number(),
  actor: v.object(actorFields),
  status: statusFields,
}
