import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { vAuditLog } from "./audit/audit"

export default defineSchema({
  users: defineTable({
    workOSAuthKitId: v.string(),
    firstName: v.optional(v.union(v.null(), v.string())),
    lastName: v.optional(v.union(v.null(), v.string())),
    email: v.string(),
    emailVerified: v.boolean(),
    profilePictureUrl: v.optional(v.union(v.null(), v.string())),
  })
    .index("by_workOSAuthKitId", ["workOSAuthKitId"])
    .index("by_email", ["email"]),
  auditLogs: defineTable(vAuditLog)
    .index("by_occurredAt", ["occurredAt"])
    .index("by_event_and_occurredAt", ["event", "occurredAt"]),
})
