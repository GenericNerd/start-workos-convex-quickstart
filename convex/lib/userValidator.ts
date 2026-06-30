import { v } from "convex/values"

export const vUser = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  workOSAuthKitId: v.string(),
  firstName: v.optional(v.union(v.null(), v.string())),
  lastName: v.optional(v.union(v.null(), v.string())),
  email: v.string(),
  emailVerified: v.boolean(),
  profilePictureUrl: v.optional(v.union(v.null(), v.string())),
})
