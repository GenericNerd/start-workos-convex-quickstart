import { WorkOS } from "@workos-inc/node"

let workosClient: WorkOS | undefined

export function getWorkOS(): WorkOS {
  const apiKey = process.env.WORKOS_API_KEY
  if (!apiKey) {
    throw new Error("WORKOS_API_KEY is not set")
  }
  workosClient ??= new WorkOS(apiKey)
  return workosClient
}
