import { createFileRoute } from "@tanstack/react-router"
import { getAuthkit } from "@workos/authkit-tanstack-react-start"
import {
  extractSessionHeaders,
  firstSsoConnectionId,
  parseOAuthState,
} from "@/lib/oauth-callback"
import { getWorkOS } from "@/lib/workos"
import { workOsOAuthRawDataFromCatch } from "@/lib/workos-oauth-error"

export const Route = createFileRoute("/api/auth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const code = url.searchParams.get("code")
        const rawState = url.searchParams.get("state")

        if (!rawState) {
          return new Response(JSON.stringify({ error: "missing_state" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        }
        const state = parseOAuthState(rawState)
        if (!state) {
          return new Response(JSON.stringify({ error: "invalid_state" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          })
        }

        if (!code) {
          return new Response(null, {
            status: 307,
            headers: {
              Location: state.errorPathname.replace(
                "{{error}}",
                "missing_code"
              ),
            },
          })
        }

        try {
          const response = new Response()
          const authKit = await getAuthkit()
          const result = await authKit.handleCallback(request, response, {
            code,
            state: rawState,
          })
          const sessionHeaders = extractSessionHeaders(result)

          return new Response(null, {
            status: 307,
            headers: {
              Location: state.returnPathname || "/",
              ...sessionHeaders,
            },
          })
        } catch (error: unknown) {
          const rawData = workOsOAuthRawDataFromCatch(error)
          if (rawData) {
            if (
              rawData.code &&
              rawData.code === "email_verification_required"
            ) {
              return new Response(null, {
                status: 307,
                headers: {
                  Location: state.errorPathname.replace(
                    "{{error}}",
                    "email_verification_required"
                  ),
                },
              })
            }

            if (rawData.error) {
              if (rawData.error === "sso_required") {
                const connectionId = firstSsoConnectionId(rawData)
                if (!connectionId) {
                  return new Response(null, {
                    status: 307,
                    headers: {
                      Location: state.errorPathname.replace(
                        "{{error}}",
                        "sso_connection_not_found"
                      ),
                    },
                  })
                }
                const workOS = getWorkOS()
                const connection = await workOS.sso.getConnection(connectionId)
                const organizationId = connection.organizationId
                if (!organizationId) {
                  return new Response(null, {
                    status: 307,
                    headers: {
                      Location: state.errorPathname.replace(
                        "{{error}}",
                        "sso_connection_not_found"
                      ),
                    },
                  })
                }

                const ssoUrl = workOS.sso.getAuthorizationUrl({
                  clientId: process.env.WORKOS_CLIENT_ID!,
                  organization: organizationId,
                  state: rawState,
                  redirectUri: process.env.WORKOS_REDIRECT_URI!,
                })

                return new Response(null, {
                  status: 307,
                  headers: {
                    Location: ssoUrl,
                  },
                })
              }
            }
          }
          return new Response(null, {
            status: 307,
            headers: {
              Location: state.errorPathname.replace(
                "{{error}}",
                "internal_server_error"
              ),
            },
          })
        }
      },
    },
  },
})
