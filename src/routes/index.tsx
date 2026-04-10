import { createFileRoute } from "@tanstack/react-router"
import { getAuth } from "@workos/authkit-tanstack-react-start"

export const Route = createFileRoute("/")({
  component: App,
  loader: async () => {
    const { user } = await getAuth()
    return { user }
  },
})

function App() {
  const { user } = Route.useLoaderData()
  return <>{JSON.stringify(user)}</>
}
