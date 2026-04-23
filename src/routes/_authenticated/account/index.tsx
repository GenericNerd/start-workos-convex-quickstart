import { convexQuery } from "@convex-dev/react-query"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { api } from "convex/_generated/api"

export const Route = createFileRoute("/_authenticated/account/")({
  component: RouteComponent,
  loader: async ({ context }) => {
    // Preload data (blocking)
    const user = await context.queryClient.ensureQueryData(
      convexQuery(api.user.getUser)
    )
    // Prefetch data (non-blocking)
    // const user = context.queryClient.prefetchQuery(
    //   convexQuery(api.user.getUser)
    // )
    return { user }
  },
})

function RouteComponent() {
  // Live data
  const { data: user } = useSuspenseQuery(convexQuery(api.user.getUser))
  return <div className="wrap-break-word">{JSON.stringify(user)}</div>
}
