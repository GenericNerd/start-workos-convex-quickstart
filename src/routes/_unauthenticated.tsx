import { createFileRoute, redirect } from "@tanstack/react-router"
import { getAuth } from "@workos/authkit-tanstack-react-start"

export const Route = createFileRoute("/_unauthenticated")({
  validateSearch: (search) =>
    search as {
      returnPathname?: string | undefined
    },
  loaderDeps: ({ search: { returnPathname } }) => ({
    returnPathname: returnPathname
      ? decodeURIComponent(returnPathname)
      : undefined,
  }),
  loader: async ({ deps: { returnPathname } }) => {
    const { user } = await getAuth()
    if (user) {
      throw redirect({ href: returnPathname || "/" })
    }
  },
})
