import { createFileRoute } from "@tanstack/react-router"
import { useAuth } from "@workos/authkit-tanstack-react-start/client"

export const Route = createFileRoute("/logout")({
  component: RouteComponent,
})

async function RouteComponent() {
  const { signOut } = useAuth()
  await signOut({ returnTo: "/" })
}
