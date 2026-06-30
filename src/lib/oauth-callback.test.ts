import { describe, expect, it } from "vitest"
import {
  encodeOAuthState,
  extractSessionHeaders,
  firstSsoConnectionId,
  parseOAuthState,
} from "./oauth-callback"

describe("parseOAuthState", () => {
  it("parses a valid base64-encoded OAuth state payload", () => {
    const raw = encodeOAuthState({
      errorPathname: "/login?error={{error}}",
      returnPathname: "/account",
    })

    expect(parseOAuthState(raw)).toEqual({
      errorPathname: "/login?error={{error}}",
      returnPathname: "/account",
    })
  })

  it("returns undefined when errorPathname is missing", () => {
    const raw = btoa(JSON.stringify({ returnPathname: "/account" }))
    expect(parseOAuthState(raw)).toBeUndefined()
  })

  it("returns undefined for malformed base64 or JSON", () => {
    expect(parseOAuthState("not-valid-base64!!!")).toBeUndefined()
    expect(parseOAuthState(btoa("not json"))).toBeUndefined()
  })

  it("ignores non-string returnPathname values", () => {
    const raw = btoa(
      JSON.stringify({
        errorPathname: "/login?error={{error}}",
        returnPathname: 123,
      })
    )

    expect(parseOAuthState(raw)).toEqual({
      errorPathname: "/login?error={{error}}",
      returnPathname: undefined,
    })
  })
})

describe("firstSsoConnectionId", () => {
  it("returns the first string connection id", () => {
    expect(
      firstSsoConnectionId({ connection_ids: ["conn_1", "conn_2"] })
    ).toBe("conn_1")
  })

  it("returns undefined when connection ids are missing or invalid", () => {
    expect(firstSsoConnectionId({})).toBeUndefined()
    expect(firstSsoConnectionId({ connection_ids: [] })).toBeUndefined()
    expect(firstSsoConnectionId({ connection_ids: [123] })).toBeUndefined()
  })
})

describe("extractSessionHeaders", () => {
  it("collects every Set-Cookie from getSetCookie()", () => {
    expect(
      extractSessionHeaders({
        response: {
          headers: {
            getSetCookie: () => ["session=abc", "pkce=delete"],
          },
        },
      })
    ).toEqual({
      setCookies: ["session=abc", "pkce=delete"],
      headers: {},
    })
  })

  it("falls back to a single Set-Cookie from response.headers.get", () => {
    expect(
      extractSessionHeaders({
        response: {
          headers: {
            get: (name: string) =>
              name === "Set-Cookie" ? "session=abc" : null,
          },
        },
      })
    ).toEqual({
      setCookies: ["session=abc"],
      headers: {},
    })
  })

  it("collects Set-Cookie values from a plain headers object", () => {
    expect(
      extractSessionHeaders({
        headers: { "Set-Cookie": "session=xyz" },
      })
    ).toEqual({
      setCookies: ["session=xyz"],
      headers: {},
    })
  })

  it("returns empty collections for unsupported values", () => {
    expect(extractSessionHeaders(null)).toEqual({
      setCookies: [],
      headers: {},
    })
    expect(extractSessionHeaders("nope")).toEqual({
      setCookies: [],
      headers: {},
    })
  })
})
