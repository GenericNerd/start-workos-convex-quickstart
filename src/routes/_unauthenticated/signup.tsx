import { Link, createFileRoute } from "@tanstack/react-router"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  listConnections,
  providerToIcon,
} from "@/lib/workos-social-connections"
import { authErrorToMessage, safeDecodeURIComponent } from "@/lib/utils"

export const Route = createFileRoute("/_unauthenticated/signup")({
  component: RouteComponent,
  validateSearch: (search) =>
    search as {
      returnPathname?: string | undefined
      error?: string | undefined
    },
  loaderDeps: ({ search: { returnPathname, error } }) => ({
    returnPathname: returnPathname
      ? safeDecodeURIComponent(returnPathname)
      : undefined,
    error,
  }),
  loader: async ({ deps: { returnPathname, error } }) => {
    return {
      connections: await listConnections({
        data: { errorPathname: "/signup?error={{error}}", returnPathname },
      }),
      error,
    }
  },
})

function RouteComponent() {
  const { connections, error } = Route.useLoaderData()

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-y-2">
      <Logo className="size-12" />
      <h1 className="mb-2 text-2xl font-bold">Sign up to XXX</h1>
      <Card>
        <CardContent className="min-w-80">
          {error && (
            <div className="mb-2 text-center text-destructive">
              {authErrorToMessage(error)}
            </div>
          )}
          <div className="flex flex-col gap-y-2">
            {connections.authorizationUrls.map((connection) => (
              <a key={connection.provider} href={connection.url}>
                <Button variant="outline" className="w-full p-4 text-base">
                  {providerToIcon(connection.provider)}
                  <span>Sign up with {connection.provider}</span>
                </Button>
              </a>
            ))}
          </div>
          <Separator className="my-2" />
          <p className="text-center">
            Already have an account?{" "}
            <Link
              to="/login"
              search={{ returnPathname: Route.useSearch().returnPathname }}
              className="text-primary underline-offset-4 hover:underline"
            >
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
