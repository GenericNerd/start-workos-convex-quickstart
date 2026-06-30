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
  it("prefers Set-Cookie from a fetch-like response object", () => {
    expect(
      extractSessionHeaders({
        response: {
          headers: {
            get: (name: string) =>
              name === "Set-Cookie" ? "session=abc" : null,
          },
        },
      })
    ).toEqual({ "Set-Cookie": "session=abc" })
  })

  it("falls back to a plain headers object", () => {
    expect(
      extractSessionHeaders({
        headers: { "Set-Cookie": "session=xyz" },
      })
    ).toEqual({ "Set-Cookie": "session=xyz" })
  })

  it("returns an empty object for unsupported values", () => {
    expect(extractSessionHeaders(null)).toEqual({})
    expect(extractSessionHeaders("nope")).toEqual({})
  })
})
