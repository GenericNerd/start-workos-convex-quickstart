import type { WorkOsOAuthRawData } from "@/lib/workos-oauth-error"

export type ParsedOAuthState = {
  returnPathname: string | undefined
  errorPathname: string
}

export type ExtractedSessionHeaders = {
  setCookies: Array<string>
  headers: Record<string, string>
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

function appendSetCookie(setCookies: Array<string>, value: string | undefined) {
  if (value) {
    setCookies.push(value)
  }
}

export function extractSessionHeaders(
  result: unknown
): ExtractedSessionHeaders {
  const setCookies: Array<string> = []
  const headers: Record<string, string> = {}

  if (typeof result !== "object" || result === null) {
    return { setCookies, headers }
  }

  const r = result as {
    response?: {
      headers?: {
        get?: (name: string) => string | null
        getSetCookie?: () => Array<string>
      }
    }
    headers?: Record<string, string>
  }

  const responseHeaders = r.response?.headers
  if (responseHeaders?.getSetCookie) {
    setCookies.push(...responseHeaders.getSetCookie())
  } else {
    appendSetCookie(setCookies, responseHeaders?.get?.("Set-Cookie") ?? undefined)
  }

  if (r.headers && typeof r.headers === "object") {
    for (const [key, value] of Object.entries(r.headers)) {
      if (key.toLowerCase() === "set-cookie") {
        appendSetCookie(setCookies, value)
      } else {
        headers[key] = value
      }
    }
  }

  return { setCookies, headers }
}

export function applySessionHeaders(
  responseHeaders: Headers,
  extracted: ExtractedSessionHeaders
): void {
  for (const [key, value] of Object.entries(extracted.headers)) {
    responseHeaders.set(key, value)
  }
  for (const cookie of extracted.setCookies) {
    responseHeaders.append("Set-Cookie", cookie)
  }
}
