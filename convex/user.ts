import { query } from "./_generated/server"
import { requireUser } from "./auth/utils"

export const getUser = query({
  handler: async (ctx) => {
    return await requireUser(ctx)
  },
})
