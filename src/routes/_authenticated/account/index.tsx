import { convexQuery } from "@convex-dev/react-query"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { api } from "convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/_authenticated/account/")({
  component: RouteComponent,
  loader: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(
      convexQuery(api.user.getUser)
    )
    return { user }
  },
})

function RouteComponent() {
  const { data: user } = useSuspenseQuery(convexQuery(api.user.getUser))
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{displayName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email verified</dt>
              <dd className="font-medium">
                {user.emailVerified ? "Yes" : "No"}
              </dd>
            </div>
          </dl>
          <Link to="/">
            <Button variant="outline" className="w-full">
              Back home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
