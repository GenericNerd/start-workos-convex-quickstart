import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createFileRoute, Link } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { WorkOS } from "@workos-inc/node"
import { z } from "zod"
import { zodValidator } from "@tanstack/zod-adapter"
import { ArrowRight } from "lucide-react"
import { formOptions, useForm } from "@tanstack/react-form-start"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"
import { getCookie, setCookie } from "@tanstack/react-start/server"
import { Badge } from "@/components/ui/badge"
import {
  listConnections,
  providerToIcon,
} from "@/lib/workos-social-connections"
import { authErrorToMessage } from "@/lib/utils"

const getSSOUrl = createServerFn()
  .inputValidator(
    zodValidator(
      z.object({
        domain: z.string(),
        returnPathname: z.optional(z.string()),
      })
    )
  )
  .handler(async ({ data }) => {
    const workOS = new WorkOS(process.env.WORKOS_API_KEY!)

    const connection = await workOS.sso.listConnections({
      domain: data.domain,
    })

    if (connection.data.length === 0 || !connection.data[0].organizationId) {
      throw new Error("No connection found")
    }

    return workOS.sso.getAuthorizationUrl({
      clientId: process.env.WORKOS_CLIENT_ID!,
      redirectUri: process.env.WORKOS_REDIRECT_URI!,
      organization: connection.data[0].organizationId!,
      state: data.returnPathname,
    })
  })

const getLastUsedLoginMethod = createServerFn().handler(async () => {
  return getCookie("lastUsedLoginMethod")
})

const setLastUsedLoginMethod = createServerFn()
  .inputValidator(
    zodValidator(
      z.object({
        method: z.union([
          z.literal("sso"),
          z.literal("Google"),
          z.literal("Microsoft"),
          z.literal("Apple"),
          z.literal("GitHub"),
        ]),
      })
    )
  )
  .handler(async ({ data }) => {
    setCookie("lastUsedLoginMethod", data.method, {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    })
  })

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  validateSearch: (search) =>
    search as {
      returnPathname?: string | undefined
      error?: string | undefined
    },
  loaderDeps: ({ search: { returnPathname, error } }) => ({
    returnPathname,
    error,
  }),
  loader: async ({ deps: { returnPathname, error } }) => {
    const [lastUsedMethod, connections] = await Promise.all([
      getLastUsedLoginMethod(),
      listConnections({
        data: { errorPathname: "/login?error={{error}}", returnPathname },
      }),
    ])
    return { lastUsedMethod, connections, error }
  },
})

const formOpts = formOptions({
  validators: {
    onBlur: z.object({
      email: z.email(),
    }),
    onSubmit: z.object({
      email: z.email(),
    }),
  },
  defaultValues: {
    email: "",
  },
})

function RouteComponent() {
  const { connections, lastUsedMethod, error } = Route.useLoaderData()
  const [showSSO, setShowSSO] = useState(connections.sso)

  const form = useForm({
    ...formOpts,
    onSubmit: async ({ value }) => {
      let ssoUrl: string | undefined = undefined
      try {
        const domain = value.email.split("@")[1]
        ssoUrl = await getSSOUrl({ data: { domain } })
      } catch (error) {
        setShowSSO(false)
        return
      }
      setLastUsedLoginMethod({ data: { method: "sso" } })
      window.location.href = ssoUrl
    },
  })

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-y-2">
      <Logo className="size-12" />
      <h1 className="mb-2 text-2xl font-bold">Log in to XXX</h1>
      <Card>
        <motion.div
          layout
          transition={{
            layout: { type: "spring", stiffness: 380, damping: 32 },
          }}
        >
          <CardContent className="min-w-80">
            {error && (
              <div className="mb-4 text-center text-destructive">
                {authErrorToMessage(error)}
              </div>
            )}
            <AnimatePresence initial={false} mode="sync">
              {showSSO && (
                <motion.div
                  key="sso"
                  className="overflow-hidden"
                  initial={false}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{
                    opacity: 0,
                    height: 0,
                    marginBottom: 0,
                    transition: {
                      opacity: { duration: 0.2, ease: "easeOut" },
                      height: { duration: 0.32, ease: [0.32, 0.72, 0, 1] },
                    },
                  }}
                >
                  <div className="flex flex-col gap-y-2">
                    <form
                      id="sso-form"
                      onSubmit={(e) => {
                        e.preventDefault()
                        form.handleSubmit()
                      }}
                      className="flex flex-col gap-y-2"
                    >
                      <form.Field
                        name="email"
                        children={(field) => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid
                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={field.name}>
                                Email
                              </FieldLabel>
                              <Input
                                id={field.name}
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                                aria-invalid={isInvalid}
                                autoComplete="email"
                                required
                                className="h-8 text-base! ring-inset"
                              />
                              {isInvalid && (
                                <FieldError errors={field.state.meta.errors} />
                              )}
                            </Field>
                          )
                        }}
                      />
                      <Button
                        variant="outline"
                        className="w-full p-4 text-base"
                        type="submit"
                        form="sso-form"
                      >
                        Continue with SSO
                        <ArrowRight />
                      </Button>
                    </form>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 py-1">
                    <Separator />
                    <span className="text-muted-foreground">OR</span>
                    <Separator />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex flex-col gap-y-2">
              {connections.authorizationUrls.map((connection) => (
                <a
                  key={connection.provider}
                  href={connection.url}
                  onClick={async () => {
                    await setLastUsedLoginMethod({
                      data: {
                        method: connection.provider as
                          | "Google"
                          | "Microsoft"
                          | "Apple"
                          | "GitHub",
                      },
                    })
                  }}
                >
                  <Button
                    variant="outline"
                    className="relative w-full p-4 text-base"
                  >
                    {lastUsedMethod === connection.provider && (
                      <Badge
                        className="absolute -top-2 right-1"
                        variant="secondary"
                      >
                        Last used
                      </Badge>
                    )}
                    {providerToIcon(connection.provider)}
                    <span>Log in with {connection.provider}</span>
                  </Button>
                </a>
              ))}
            </div>
            <Separator className="my-2" />
            <p className="text-center">
              Don't have an account?{" "}
              <Link
                to="/signup"
                search={{ returnPathname: Route.useSearch().returnPathname }}
                className="text-primary underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </motion.div>
      </Card>
    </div>
  )
}
