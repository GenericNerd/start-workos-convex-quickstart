import Logo from "@/components/logo"
import AppleLogo from "@/components/logos/apple"
import GitHubLogo from "@/components/logos/github"
import GoogleLogo from "@/components/logos/google"
import MicrosoftLogo from "@/components/logos/microsoft"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createFileRoute, Link } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { WorkOS } from "@workos-inc/node"

const providerToIcon = (provider: string) => {
  switch (provider) {
    case "Google":
      return <GoogleLogo className="size-4" />
    case "Microsoft":
      return <MicrosoftLogo className="size-4" />
    case "Apple":
      return <AppleLogo className="size-4" />
    case "GitHub":
      return <GitHubLogo className="size-4" />
  }
}

const listConnections = createServerFn().handler(async () => {
  const workOS = new WorkOS(process.env.WORKOS_API_KEY!)

  const availableProviders = [
    {
      name: "Google",
      enabled:
        process.env.VITE_GOOGLE_AUTH_ENABLED &&
        process.env.VITE_GOOGLE_AUTH_ENABLED === "true",
    },
    {
      name: "Microsoft",
      enabled:
        process.env.VITE_MICROSOFT_AUTH_ENABLED &&
        process.env.VITE_MICROSOFT_AUTH_ENABLED === "true",
    },
    {
      name: "Apple",
      enabled:
        process.env.VITE_APPLE_AUTH_ENABLED &&
        process.env.VITE_APPLE_AUTH_ENABLED === "true",
    },
    {
      name: "GitHub",
      enabled:
        process.env.VITE_GITHUB_AUTH_ENABLED &&
        process.env.VITE_GITHUB_AUTH_ENABLED === "true",
    },
  ]

  const authorizationUrls = await Promise.all(
    availableProviders
      .filter((provider) => provider.enabled)
      .map((provider) => provider.name)
      .map((provider) => {
        return {
          provider,
          url: workOS.sso.getAuthorizationUrl({
            clientId: process.env.WORKOS_CLIENT_ID!,
            provider: `${provider}OAuth`,
            redirectUri: process.env.WORKOS_REDIRECT_URI!,
          }),
        }
      })
  )
  return authorizationUrls
})

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  loader: async () => {
    return {
      connections: await listConnections(),
    }
  },
})

function RouteComponent() {
  const connections = Route.useLoaderData().connections

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-y-2">
      <Logo className="size-12" />
      <h1 className="mb-2 text-2xl font-bold">Log in to XXX</h1>
      <Card>
        <CardContent className="min-w-80">
          <div className="flex flex-col gap-y-2">
            {connections.map((connection) => (
              <Link key={connection.provider} to={connection.url}>
                <Button variant="outline" className="w-full p-4 text-base">
                  {providerToIcon(connection.provider)}
                  <span>Log in with {connection.provider}</span>
                </Button>
              </Link>
            ))}
          </div>
          <Separator className="my-2" />
          <p className="text-center">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
