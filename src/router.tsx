import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { ConvexQueryClient } from "@convex-dev/react-query"
import { routeTree } from "./routeTree.gen"
import { QueryClient } from "@tanstack/react-query"
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react"
import {
  AuthKitProvider,
  useAccessToken,
  useAuth,
} from "@workos/authkit-tanstack-react-start/client"
import { useCallback, useMemo } from "react"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"

function useAuthFromAuthKit() {
  const { loading, user } = useAuth()
  const { getAccessToken, refresh } = useAccessToken()

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!user) {
        return null
      }

      if (forceRefreshToken) {
        return (await refresh()) ?? null
      }

      return (await getAccessToken()) ?? null
    },
    [user, refresh, getAccessToken]
  )

  return useMemo(
    () => ({
      isLoading: loading,
      isAuthenticated: !!user,
      fetchAccessToken,
    }),
    [loading, user, fetchAccessToken]
  )
}

export function getRouter() {
  const CONVEX_URL: string = import.meta.env.VITE_CONVEX_URL
  if (!CONVEX_URL) {
    throw new Error("VITE_CONVEX_URL is not set")
  }
  const convex = new ConvexReactClient(CONVEX_URL)
  const convexQueryClient = new ConvexQueryClient(convex)

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
      convexClient: convex,
      convexQueryClient,
    },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    InnerWrap: ({ children }) => (
      <AuthKitProvider>
        <ConvexProviderWithAuth
          client={convexQueryClient.convexClient}
          useAuth={useAuthFromAuthKit}
        >
          {children}
        </ConvexProviderWithAuth>
      </AuthKitProvider>
    ),
  })
  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
