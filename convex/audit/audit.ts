import { v } from "convex/values"
import { internal } from "../_generated/api"
import { internalMutation } from "../_generated/server"
import { vSessionCreateEvent, vSessionRevokeEvent } from "./events/session"
import { vUserCreateEvent, vUserDeleteEvent } from "./events/user"
import type { MutationCtx } from "../_generated/server"
import type { Infer } from "convex/values"

const vAuditEvent = v.union(vUserCreateEvent, vSessionCreateEvent)
const vAuditChange = v.union(vUserDeleteEvent, vSessionRevokeEvent)

export const vAuditLog = v.union(
  vUserCreateEvent,
  vSessionCreateEvent,
  vUserDeleteEvent,
  vSessionRevokeEvent
)

type AuditEvent = Infer<typeof vAuditEvent>
type AuditChange = Infer<typeof vAuditChange>

export const log = async (ctx: MutationCtx, event: AuditEvent) => {
  await ctx.runMutation(internal.audit.audit.writeLog, { event })
}

export const logChange = async (ctx: MutationCtx, change: AuditChange) => {
  await ctx.runMutation(internal.audit.audit.writeChange, { change })
}

export const maskEmail = (email: string): string => {
  if (!email || !email.includes("@")) return email
  const [localPart, domain] = email.split("@")
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`
  }
  return `${localPart[0]}***${localPart.slice(-1)}@${domain}`
}

export const writeLog = internalMutation({
  args: v.object({ event: vAuditEvent }),
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLogs", { ...args.event })
  },
})

export const writeChange = internalMutation({
  args: v.object({ change: vAuditChange }),
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLogs", { ...args.change })
  },
})
