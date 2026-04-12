import { Link, createFileRoute } from "@tanstack/react-router"
import { getAuth } from "@workos/authkit-tanstack-react-start"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/")({
  component: App,
  loader: async () => {
    const { user } = await getAuth()
    return { user }
  },
})

function App() {
  const { user } = Route.useLoaderData()

  if (user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              You are signed in
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              Signed in as{" "}
              <span className="font-medium text-foreground">{user.email}</span>.
            </p>
            <Link to="/account">
              <Button className="w-full text-center">Account</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Welcome</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Sign in or create an account to continue.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/login">
              <Button className="w-full text-center">Log in</Button>
            </Link>
            <Link to="/signup">
              <Button className="w-full text-center" variant="outline">
                Sign up
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
