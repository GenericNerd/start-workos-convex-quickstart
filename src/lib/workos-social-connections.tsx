import AppleLogo from "@/components/logos/apple"
import GitHubLogo from "@/components/logos/github"
import GoogleLogo from "@/components/logos/google"
import MicrosoftLogo from "@/components/logos/microsoft"
import { createServerFn } from "@tanstack/react-start"
import { zodValidator } from "@tanstack/zod-adapter"
import { WorkOS } from "@workos-inc/node"
import z from "zod"

export function providerToIcon(provider: string) {
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

export const listConnections = createServerFn()
  .inputValidator(
    zodValidator(
      z.object({
        errorPathname: z.string(),
        returnPathname: z.optional(z.string()),
      })
    )
  )
  .handler(async ({ data }) => {
    // TODO: Replace with singleton
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
              state: btoa(
                JSON.stringify({
                  returnPathname: data.returnPathname,
                  errorPathname: data.errorPathname,
                })
              ),
            }),
          }
        })
    )
    return {
      authorizationUrls,
      sso:
        process.env.VITE_SSO_ENABLED && process.env.VITE_SSO_ENABLED === "true",
    }
  })
