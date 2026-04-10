import { Infer, v } from "convex/values"
import { vUserCreateEvent, vUserDeleteEvent } from "./events/user"
import { internalMutation, MutationCtx } from "../_generated/server"
import { internal } from "../_generated/api"
import { vSessionCreateEvent, vSessionRevokeEvent } from "./events/session"

const vAuditEvent = v.union(vUserCreateEvent, vSessionCreateEvent)
const vAuditChange = v.union(vUserDeleteEvent, vSessionRevokeEvent)

type AuditEvent = Infer<typeof vAuditEvent>
type AuditChange = Infer<typeof vAuditChange>

export const log = async (ctx: MutationCtx, log: AuditEvent) => {
  await ctx.runMutation(internal.audit.audit.writeLog, { log })
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
  args: v.object({ log: vAuditEvent }),
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLogs", { ...args.log })
  },
})

export const writeChange = internalMutation({
  args: v.object({ change: vAuditChange }),
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLogs", { ...args.change })
  },
})
