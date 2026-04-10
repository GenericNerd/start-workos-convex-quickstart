import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { ConvexQueryClient } from "@convex-dev/react-query"
import { routeTree } from "./routeTree.gen"
import { QueryClient } from "@tanstack/react-query"
import { ConvexProvider } from "convex/react"

export function getRouter() {
  const CONVEX_URL: string = import.meta.env.VITE_CONVEX_URL
  if (!CONVEX_URL) {
    throw new Error("VITE_CONVEX_URL is not set")
  }
  const convexQueryClient = new ConvexQueryClient(CONVEX_URL)

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  })
  convexQueryClient.connect(queryClient)

  const router = createTanStackRouter({
    routeTree,
    defaultPreload: "intent",
    context: {
      queryClient,
    },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    Wrap: ({ children }) => (
      <ConvexProvider client={convexQueryClient.convexClient}>
        {children}
      </ConvexProvider>
    ),
  })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
