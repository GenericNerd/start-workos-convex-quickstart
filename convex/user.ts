import { query } from "./_generated/server"
import { requireUser } from "./auth/utils"
import { vUser } from "./lib/userValidator"

export const getUser = query({
  args: {},
  returns: vUser,
  handler: async (ctx) => {
    return await requireUser(ctx)
  },
})
