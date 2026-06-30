import type { WorkOsOAuthRawData } from "@/lib/workos-oauth-error"

export type ParsedOAuthState = {
  returnPathname: string | undefined
  errorPathname: string
}

export function parseOAuthState(
  rawState: string
): ParsedOAuthState | undefined {
  try {
    const parsed: unknown = JSON.parse(atob(rawState))
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("errorPathname" in parsed) ||
      typeof (parsed as { errorPathname: unknown }).errorPathname !== "string"
    ) {
      return undefined
    }
    const { returnPathname, errorPathname } = parsed as {
      returnPathname?: unknown
      errorPathname: string
    }
    return {
      errorPathname,
      returnPathname:
        typeof returnPathname === "string" ? returnPathname : undefined,
    }
  } catch {
    return undefined
  }
}

export function encodeOAuthState(state: ParsedOAuthState): string {
  return btoa(JSON.stringify(state))
}

export function firstSsoConnectionId(
  raw: WorkOsOAuthRawData
): string | undefined {
  const ids = raw.connection_ids
  if (!Array.isArray(ids) || ids.length === 0) {
    return undefined
  }
  const first = ids[0]
  return typeof first === "string" ? first : undefined
}

export function extractSessionHeaders(result: unknown): Record<string, string> {
  if (typeof result !== "object" || result === null) {
    return {}
  }
  const r = result as {
    response?: { headers?: { get?: (name: string) => string | null } }
    headers?: Record<string, string>
  }
  const setCookie = r.response?.headers?.get?.("Set-Cookie")
  if (setCookie) {
    return { "Set-Cookie": setCookie }
  }
  if (r.headers && typeof r.headers === "object") {
    return r.headers
  }
  return {}
}
